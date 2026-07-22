import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
  getInvitation,
  submitInvitationResponse,
} from "../controllers/conviteController.js";

const router = Router();

const invitationReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
  },
});

const invitationWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "Muitas tentativas de confirmação. Aguarde e tente novamente.",
  },
});

router.get("/:familyId", invitationReadLimiter, getInvitation);
router.put("/:familyId/resposta", invitationWriteLimiter, submitInvitationResponse);

export default router;
