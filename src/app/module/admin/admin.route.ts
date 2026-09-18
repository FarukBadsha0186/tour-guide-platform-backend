// routes/admin.route.ts
import { Router } from "express";
import { AdminController } from "./admin.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();


router.use(auth(Role.ADMIN));

router.get("/tourists", auth("ADMIN"),AdminController.getAllTourists);


router.get("/guides", auth("ADMIN"),AdminController.getAllGuides);

router.get("/bookings", AdminController.getAllBookings);

router.get("/packages",auth(Role.ADMIN),AdminController.getAllPackages
);

router.get("/payments", AdminController.getAllPayments);
router.patch("/packages/:packageId/approve",auth(Role.ADMIN),
  AdminController.approvePackage
);

router.patch("/guides/:guideId/approve",auth(Role.ADMIN),
  AdminController.approveGuide
);


router.patch("/users/:userId/status",auth("ADMIN"), AdminController.updateUserStatus);


router.delete("/users/:userId",auth("ADMIN"), AdminController.deleteUser);


router.get("/users/:userId",auth("ADMIN"), AdminController.getUserDetails);




router.get("/bookings/:bookingId", AdminController.getBookingDetails);






export const adminRouter = router;