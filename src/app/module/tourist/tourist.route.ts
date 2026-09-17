// routes/tourist.route.ts
import { Router } from "express";

import { Role } from "../../../generated/prisma/enums";
import { TouristController } from "./tourist.controller";
import { auth } from "../../middleware/checkAuth";

const router = Router();


router.use(auth(Role.TOURIST));

router.post("/create/bookings",
    auth(Role.TOURIST),TouristController.createBooking);
router.get("/packages", TouristController.getAllPackages);

    
router.get("/availability", TouristController.getAllAvailability);

// ✅ 2. Get Only Available (isBooked: false)
router.get("/availability/available", TouristController.getAvailableOnly);
  
router.patch("/bookings/:bookingId/cancel", TouristController.cancelBooking); 
router.get("/bookings", TouristController.getMyBookings);  
router.post("/reviews", auth("TOURIST"),TouristController.createReview);


export const TouristRouter= router;