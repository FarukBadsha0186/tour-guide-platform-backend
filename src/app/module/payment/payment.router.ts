// routes/payment.route.ts
import { Router } from "express";

import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { PaymentController } from "./payment.controller";



const router = Router();


router.get("/bkash/callback", PaymentController.paymentCallback);

router.post(
  "/bkash/initialize",
  auth(Role.TOURIST),
  PaymentController.initializePayment
);

export const paymentRouter=router;