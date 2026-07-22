import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import conviteRoutes from "./routes/conviteRoutes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFound } from "./middlewares/notFound.js";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = String(process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(
  cors({
    methods: ["GET", "PUT", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("CORS_NOT_ALLOWED");
      return callback(error);
    },
  })
);

app.use(express.json({ limit: "20kb", strict: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
);

app.get("/", (req, res) => {
  res.json({
    service: "RSVP Vinicius & Noemia",
    status: "online",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/convites", conviteRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
