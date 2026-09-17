// src/app/module/public/public.route.ts
import { Router } from "express";
import { PublicController } from "./public.controller";

const router = Router();


router.get("/guides", PublicController.getAllGuides);
router.get("/packages", PublicController.getAllPackages);

router.get("/packages/search", PublicController.searchPackages);

export const publicRouter = router;