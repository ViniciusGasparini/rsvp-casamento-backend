import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "csv-parse/sync";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { Convidado } from "../src/models/Convidado.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultCsvPath = path.resolve(__dirname, "../data/Lista de Confirmação.csv");
const argumentsList = process.argv.slice(2);
const replaceResponses = argumentsList.includes("--replace-responses");
const customPath = argumentsList.find((argument) => !argument.startsWith("--"));
const csvPath = customPath ? path.resolve(process.cwd(), customPath) : defaultCsvPath;

const normalizeDate = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Data_Confirmacao inválida: ${text}`);
  }

  return date;
};

const createResponseFields = (row) => ({
  Confirmacao: String(row.Confirmacao || "").trim(),
  Filhos: String(row.Filhos || "").trim(),
  F1: String(row.F1 || "").trim(),
  F2: String(row.F2 || "").trim(),
  F3: String(row.F3 || "").trim(),
  F4: String(row.F4 || "").trim(),
  F5: String(row.F5 || "").trim(),
  F6: String(row.F6 || "").trim(),
  Mensagem: String(row.Mensagem || "").trim(),
  Data_Confirmacao: normalizeDate(row.Data_Confirmacao),
});

try {
  const csvContent = await fs.readFile(csvPath, "utf8");
  const rows = parse(csvContent, {
    columns: true,
    bom: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (!rows.length) {
    throw new Error("O CSV não possui registros para importar.");
  }

  const seenIds = new Set();
  const operations = rows.map((row, index) => {
    const ID = Number(row.ID);
    const Nome = String(row.Nome || "").trim();
    const Sobrenome = String(row.Sobrenome || "").trim();
    const ID_Familiar = String(row.ID_Familiar || "").trim();

    if (!Number.isInteger(ID) || ID < 1) {
      throw new Error(`ID inválido na linha ${index + 2}.`);
    }

    if (seenIds.has(ID)) {
      throw new Error(`ID duplicado no CSV: ${ID}.`);
    }
    seenIds.add(ID);

    if (!Nome || !ID_Familiar) {
      throw new Error(`Nome ou ID_Familiar ausente na linha ${index + 2}.`);
    }

    const stableIdentityFields = { ID, Nome, ID_Familiar };
    const responseFields = createResponseFields(row);

    return {
      updateOne: {
        filter: { ID },
        update: replaceResponses
          ? { $set: { ...stableIdentityFields, Sobrenome, ...responseFields } }
          : {
              $set: stableIdentityFields,
              $setOnInsert: { Sobrenome, ...responseFields },
            },
        upsert: true,
      },
    };
  });

  await connectDatabase();
  const result = await Convidado.bulkWrite(operations, { ordered: true });
  await Convidado.syncIndexes();

  console.log(`Arquivo importado: ${csvPath}`);
  console.log(`Registros lidos: ${rows.length}`);
  console.log(`Criados: ${result.upsertedCount}`);
  console.log(`Atualizados: ${result.modifiedCount}`);
  console.log(
    replaceResponses
      ? "Modo: respostas também foram substituídas."
      : "Modo seguro: confirmações existentes foram preservadas."
  );
} catch (error) {
  console.error("Falha na importação:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => undefined);
}
