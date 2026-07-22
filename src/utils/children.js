const CHILD_FIELD_NAMES = ["F1", "F2", "F3", "F4", "F5", "F6"];
const CHILD_SEPARATOR = " | ";

export const serializeChildren = (children = []) => {
  const fields = Object.fromEntries(CHILD_FIELD_NAMES.map((field) => [field, ""]));

  children.slice(0, CHILD_FIELD_NAMES.length).forEach((child, index) => {
    fields[CHILD_FIELD_NAMES[index]] = `${child.nome}${CHILD_SEPARATOR}${child.idade}`;
  });

  return fields;
};

export const deserializeChildren = (document = {}) =>
  CHILD_FIELD_NAMES.map((field) => String(document[field] || "").trim())
    .filter(Boolean)
    .map((value) => {
      const separatorIndex = value.lastIndexOf(CHILD_SEPARATOR);

      if (separatorIndex === -1) {
        return { nome: value, idade: null };
      }

      const nome = value.slice(0, separatorIndex).trim();
      const idade = Number(value.slice(separatorIndex + CHILD_SEPARATOR.length).trim());

      return {
        nome,
        idade: Number.isInteger(idade) ? idade : null,
      };
    });
