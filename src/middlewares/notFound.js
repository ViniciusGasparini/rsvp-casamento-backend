export const notFound = (req, res) => {
  res.status(404).json({
    code: "ROUTE_NOT_FOUND",
    message: "Rota não encontrada.",
  });
};
