import assert from "node:assert/strict";
import test from "node:test";
import { createBrasiliaDate } from "../src/utils/date.js";

test("gera data com horario de Brasilia para gravacao", () => {
  const storedDate = createBrasiliaDate(new Date("2026-07-22T19:30:15.250Z"));

  assert.equal(storedDate.toISOString(), "2026-07-22T16:30:15.250Z");
});
