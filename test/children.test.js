import assert from "node:assert/strict";
import test from "node:test";
import { deserializeChildren, serializeChildren } from "../src/utils/children.js";

test("serializa até seis filhos nos campos F1 a F6", () => {
  const fields = serializeChildren([
    { nome: "Ana Silva", idade: 8 },
    { nome: "João Souza", idade: 12 },
  ]);

  assert.equal(fields.F1, "Ana Silva | 8");
  assert.equal(fields.F2, "João Souza | 12");
  assert.equal(fields.F3, "");
  assert.equal(fields.F6, "");
});

test("desserializa os campos de filhos", () => {
  const children = deserializeChildren({ F1: "Ana Silva | 8", F2: "João Souza | 12" });

  assert.deepEqual(children, [
    { nome: "Ana Silva", idade: 8 },
    { nome: "João Souza", idade: 12 },
  ]);
});
