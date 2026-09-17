// src/app/modules/availability/availability.route.ts

import { Router } from "express";
import { AvailabilityControllers } from "./availability.controller";
import { auth } from "../../middleware/checkAuth";



const router = Router();



router.post("/availability",auth("GUIDE"),AvailabilityControllers.createAvailability
);

router.get("/availability", auth("GUIDE"),AvailabilityControllers.getAllAvailability);

router.get("/availability/available", auth("GUIDE"),AvailabilityControllers.getAvailableOnly);
router.patch("/:id",auth("GUIDE"),AvailabilityControllers.updateAvailability
);

router.get("/guide/:guideId", AvailabilityControllers.getAvailabilityByGuide);

router.get("/package/:packageId", AvailabilityControllers.getAvailabilityByPackage);

router.get("/:id", AvailabilityControllers.getAvailabilityById);


router.delete("/:id",auth("GUIDE"),AvailabilityControllers.deleteAvailability
);

export const AvailabilityRoutes = router;