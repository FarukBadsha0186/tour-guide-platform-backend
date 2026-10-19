// src/app/modules/ai/ai.route.ts

import { Router } from "express";
import { AiController } from "./ai.controller";
import { aiRateLimiter } from "./ai.rateLimiter";
import { validateRequest } from "../../middleware/validateRequest";
import { chatValidationSchema } from "./ai.validation";
import { auth } from "../../middleware/checkAuth"; 
import { Role } from "../../../generated/prisma/enums";

const router = Router();


router.post(
  "/chat",
  aiRateLimiter,
  validateRequest(chatValidationSchema),
  AiController.publicChat
);

router.post(
  "/guide-chat",
  auth(Role.GUIDE), 
  aiRateLimiter,
  validateRequest(chatValidationSchema),
  AiController.guideChat
);


router.post(
  "/admin-chat",
  auth(Role.ADMIN), 
  aiRateLimiter,
  validateRequest(chatValidationSchema),
  AiController.adminChat
);

export const AiRoutes = router;