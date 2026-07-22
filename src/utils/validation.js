const VALID_STATUSES = new Set(["confirmado", "nao_comparecera"]);
const FAMILY_ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.code = "VALIDATION_ERROR";
    this.details = details;
  }
}

export const validateFamilyId = (value) => {
  const familyId = String(value || "").trim();

  if (!FAMILY_ID_PATTERN.test(familyId)) {
    throw new ValidationError("A chave familiar informada é inválida.");
  }

  return familyId;
};

export const validateRsvpPayload = (payload, databaseGuests) => {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new ValidationError("O corpo da confirmação é inválido.");
  }

  if (!Array.isArray(payload.convidados)) {
    throw new ValidationError("A lista de convidados é obrigatória.");
  }

  const databaseIds = databaseGuests.map((guest) => String(guest.ID)).sort();
  const submittedIds = payload.convidados.map((guest) => String(guest?.id ?? "")).sort();
  const uniqueSubmittedIds = new Set(submittedIds);

  if (
    submittedIds.length !== databaseIds.length ||
    uniqueSubmittedIds.size !== submittedIds.length ||
    submittedIds.some((id, index) => id !== databaseIds[index])
  ) {
    throw new ValidationError(
      "A confirmação precisa conter exatamente as pessoas vinculadas a este convite."
    );
  }

  const guestResponses = payload.convidados.map((guest) => {
    const id = Number(guest.id);
    const status = String(guest.status || "").trim();
    const sobrenome = String(guest.sobrenome || "").trim();

    if (!Number.isInteger(id) || id < 1) {
      throw new ValidationError("Um dos IDs individuais é inválido.");
    }

    if (!VALID_STATUSES.has(status)) {
      throw new ValidationError("Todos os convidados precisam ter uma resposta válida.");
    }

    if (sobrenome.length > 80) {
      throw new ValidationError("O sobrenome deve ter no máximo 80 caracteres.");
    }

    return { id, status, sobrenome };
  });

  const possuiFilhosEntre6e17 = payload.possuiFilhosEntre6e17 === true;
  const filhos = Array.isArray(payload.filhos) ? payload.filhos : [];

  if (!possuiFilhosEntre6e17 && filhos.length > 0) {
    throw new ValidationError("Foram enviados filhos sem marcar a opção correspondente.");
  }

  if (possuiFilhosEntre6e17 && (filhos.length < 1 || filhos.length > 6)) {
    throw new ValidationError("Informe entre 1 e 6 filhos com idade entre 6 e 17 anos.");
  }

  const normalizedChildren = filhos.map((child) => {
    const nome = String(child?.nome || "").trim();
    const idade = Number(child?.idade);

    if (!nome || nome.length > 80) {
      throw new ValidationError("O nome de cada filho é obrigatório e deve ter até 80 caracteres.");
    }

    if (!Number.isInteger(idade) || idade < 6 || idade > 17) {
      throw new ValidationError("A idade de cada filho deve estar entre 6 e 17 anos.");
    }

    return { nome, idade };
  });

  const mensagem = String(payload.mensagem || "").trim();

  if (mensagem.length > 500) {
    throw new ValidationError("A mensagem deve ter no máximo 500 caracteres.");
  }

  return {
    guestResponses,
    possuiFilhosEntre6e17,
    filhos: normalizedChildren,
    mensagem,
  };
};
