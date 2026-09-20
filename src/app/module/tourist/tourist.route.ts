// routes/tourist.route.ts
import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { TouristController } from "./tourist.controller";
import { auth } from "../../middleware/checkAuth";

const router = Router();


router.use(auth(Role.TOURIST));

router.post("/create/bookings",
    auth(Role.TOURIST),TouristController.createBooking);
router.get("/packages", auth("TOURIST"), TouristController.getAllPackages);

    
router.get("/availability", auth("TOURIST"), TouristController.getAllAvailability);


router.get("/availability/available", auth("TOURIST"), TouristController.getAvailableOnly);
  
router.patch("/bookings/:bookingId/cancel", auth("TOURIST"), TouristController.cancelBooking); 
router.get("/bookings",  auth("TOURIST"),TouristController.getMyBookings);  
router.post("/reviews", auth("TOURIST"),TouristController.createReview);


export const TouristRouter= router;