export const errorHandler = (error, req, res, next) => {
  void next;

  if (error?.message === "CORS_NOT_ALLOWED") {
    return res.status(403).json({
      code: "ORIGIN_NOT_ALLOWED",
      message: "Origem não autorizada.",
    });
  }

  if (error?.name === "MongoServerError" && error?.code === 11000) {
    return res.status(409).json({
      code: "DUPLICATE_RECORD",
      message: "Foi encontrado um registro duplicado no banco de dados.",
    });
  }

  const statusCode = Number(error?.statusCode) || 500;
  const code = error?.code || (statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");

  if (statusCode >= 500) {
    console.error(error);
  }

  const hideUnexpectedDetails =
    statusCode >= 500 && process.env.NODE_ENV === "production" && !error?.code;

  return res.status(statusCode).json({
    code,
    message: hideUnexpectedDetails
      ? "Erro interno do servidor."
      : error?.message || "Erro interno do servidor.",
    ...(Array.isArray(error?.details) && error.details.length
      ? { details: error.details }
      : {}),
  });
};
