import mongoose from "mongoose";
import { Convidado } from "../models/Convidado.js";
import { deserializeChildren, serializeChildren } from "../utils/children.js";
import { createBrasiliaDate } from "../utils/date.js";
import { validateFamilyId, validateRsvpPayload } from "../utils/validation.js";

const buildResponsePayload = (familyId, guests) => {
  const firstGuest = guests[0];

  return {
    chave: familyId,
    convidados: guests.map((guest) => ({
      id: String(guest.ID),
      nome: guest.Nome,
      sobrenome: guest.Sobrenome || "",
      status: guest.Confirmacao || "",
    })),
    possuiFilhosEntre6e17: firstGuest.Filhos === "Sim",
    filhos: deserializeChildren(firstGuest),
    mensagem: firstGuest.Mensagem || "",
    atualizadoEm: firstGuest.Data_Confirmacao
      ? new Date(firstGuest.Data_Confirmacao).toISOString()
      : null,
  };
};

const getRegistrationState = (guests) => {
  const responseFields = [
    "Confirmacao",
    "Filhos",
    "F1",
    "F2",
    "F3",
    "F4",
    "F5",
    "F6",
    "Mensagem",
    "Data_Confirmacao",
  ];
  const hasAnyResponseData = guests.some((guest) =>
    responseFields.some((field) => Boolean(guest[field]))
  );
  const isRegistered = guests.every(
    (guest) => guest.Data_Confirmacao && guest.Confirmacao
  );

  if (!hasAnyResponseData) {
    return { isRegistered: false, isPartial: false };
  }

  const firstGuest = guests[0];
  const firstFamilySignature = JSON.stringify({
    Filhos: firstGuest.Filhos || "",
    F1: firstGuest.F1 || "",
    F2: firstGuest.F2 || "",
    F3: firstGuest.F3 || "",
    F4: firstGuest.F4 || "",
    F5: firstGuest.F5 || "",
    F6: firstGuest.F6 || "",
    Mensagem: firstGuest.Mensagem || "",
    Data_Confirmacao: firstGuest.Data_Confirmacao
      ? new Date(firstGuest.Data_Confirmacao).toISOString()
      : null,
  });
  const hasConsistentFamilyData = guests.every((guest) =>
    JSON.stringify({
      Filhos: guest.Filhos || "",
      F1: guest.F1 || "",
      F2: guest.F2 || "",
      F3: guest.F3 || "",
      F4: guest.F4 || "",
      F5: guest.F5 || "",
      F6: guest.F6 || "",
      Mensagem: guest.Mensagem || "",
      Data_Confirmacao: guest.Data_Confirmacao
        ? new Date(guest.Data_Confirmacao).toISOString()
        : null,
    }) === firstFamilySignature
  );

  return {
    isRegistered: isRegistered && hasConsistentFamilyData,
    isPartial: !isRegistered || !hasConsistentFamilyData,
  };
};

export const getInvitation = async (req, res) => {
  const familyId = validateFamilyId(req.params.familyId);
  const guests = await Convidado.find({ ID_Familiar: familyId })
    .sort({ ID: 1 })
    .lean();

  if (!guests.length) {
    return res.status(404).json({
      code: "INVITATION_NOT_FOUND",
      message: "Não encontramos convidados associados a esta chave.",
    });
  }

  const registrationState = getRegistrationState(guests);

  if (registrationState.isPartial) {
    console.error(`Confirmação parcial detectada para a família ${familyId}.`);
    return res.status(500).json({
      code: "INCONSISTENT_INVITATION",
      message: "Este convite possui dados inconsistentes. Entre em contato com os noivos.",
    });
  }

  const responsePayload = buildResponsePayload(familyId, guests);

  return res.json({
    chave: familyId,
    convidados: responsePayload.convidados,
    respostaRegistrada: registrationState.isRegistered,
    resposta: registrationState.isRegistered ? responsePayload : null,
  });
};

export const submitInvitationResponse = async (req, res) => {
  const familyId = validateFamilyId(req.params.familyId);

  if (req.body?.chave && String(req.body.chave).trim() !== familyId) {
    const error = new Error("A chave enviada no formulário não corresponde ao convite aberto.");
    error.statusCode = 400;
    error.code = "FAMILY_ID_MISMATCH";
    throw error;
  }

  const allowUpdates = String(process.env.ALLOW_RSVP_UPDATES || "false") === "true";
  const session = await mongoose.startSession();
  let updatedGuests = [];

  try {
    await session.withTransaction(async () => {
      const guests = await Convidado.find({ ID_Familiar: familyId })
        .sort({ ID: 1 })
        .session(session)
        .lean();

      if (!guests.length) {
        const error = new Error("Não encontramos convidados associados a esta chave.");
        error.statusCode = 404;
        error.code = "INVITATION_NOT_FOUND";
        throw error;
      }

      const registrationState = getRegistrationState(guests);

      if (registrationState.isPartial) {
        const error = new Error(
          "Este convite possui dados inconsistentes. Entre em contato com os noivos."
        );
        error.statusCode = 500;
        error.code = "INCONSISTENT_INVITATION";
        throw error;
      }

      if (registrationState.isRegistered && !allowUpdates) {
        const error = new Error("Esta confirmação já foi registrada e não pode ser alterada.");
        error.statusCode = 409;
        error.code = "RSVP_ALREADY_SUBMITTED";
        throw error;
      }

      const normalized = validateRsvpPayload(req.body, guests);
      const childrenFields = serializeChildren(normalized.filhos);
      const confirmationDate = createBrasiliaDate();
      const responseById = new Map(
        normalized.guestResponses.map((response) => [response.id, response])
      );

      const operations = guests.map((guest) => {
        const response = responseById.get(guest.ID);

        return {
          updateOne: {
            filter: { ID: guest.ID, ID_Familiar: familyId },
            update: {
              $set: {
                Sobrenome: response.sobrenome,
                Confirmacao: response.status,
                Filhos: normalized.possuiFilhosEntre6e17 ? "Sim" : "Não",
                ...childrenFields,
                Mensagem: normalized.mensagem,
                Data_Confirmacao: confirmationDate,
              },
            },
          },
        };
      });

      const result = await Convidado.bulkWrite(operations, { session, ordered: true });

      if (result.matchedCount !== guests.length) {
        const error = new Error("Nem todos os convidados puderam ser atualizados.");
        error.statusCode = 409;
        error.code = "RSVP_UPDATE_CONFLICT";
        throw error;
      }

      updatedGuests = await Convidado.find({ ID_Familiar: familyId })
        .sort({ ID: 1 })
        .session(session)
        .lean();
    });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    message: "Confirmação registrada com sucesso.",
    resposta: buildResponsePayload(familyId, updatedGuests),
  });
};
