import assert from "node:assert/strict";
import test from "node:test";
import { validateRsvpPayload } from "../src/utils/validation.js";

const databaseGuests = [
  { ID: 1, Nome: "Vinicius" },
  { ID: 2, Nome: "Noemia" },
];

test("aceita uma resposta completa da família", () => {
  const result = validateRsvpPayload(
    {
      convidados: [
        { id: "1", status: "confirmado", sobrenome: "Gasparini" },
        { id: "2", status: "nao_comparecera", sobrenome: "" },
      ],
      possuiFilhosEntre6e17: true,
      filhos: [{ nome: "Criança Teste", idade: 10 }],
      mensagem: "Mensagem",
    },
    databaseGuests
  );

  assert.equal(result.guestResponses.length, 2);
  assert.equal(result.filhos[0].idade, 10);
});

test("bloqueia ID individual que não pertence à família", () => {
  assert.throws(
    () =>
      validateRsvpPayload(
        {
          convidados: [
            { id: "1", status: "confirmado" },
            { id: "999", status: "confirmado" },
          ],
          possuiFilhosEntre6e17: false,
          filhos: [],
        },
        databaseGuests
      ),
    /exatamente as pessoas vinculadas/
  );
});
