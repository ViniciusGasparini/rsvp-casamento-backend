const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

const brasiliaDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BRASILIA_TIME_ZONE,
  calendar: "gregory",
  numberingSystem: "latn",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export const createBrasiliaDate = (date = new Date()) => {
  const parts = Object.fromEntries(
    brasiliaDateTimeFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return new Date(
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
      date.getMilliseconds()
    )
  );
};
