// guide.route.ts

import { Router } from "express";
import { GuideControllers } from "./guide.controller";
import { auth } from "../../middleware/checkAuth";
import { upload } from "../../lib/multer";


const router = Router();

router.patch("/profile/update",auth("GUIDE"),    
  upload.single("profileImage"),
  GuideControllers.updateMyProfile
);

router.get("/profile/",
  auth("GUIDE"),    
  GuideControllers.getMyProfile
);

router.get("/allPackage", GuideControllers.getAllPackages);

router.get("/allbookings", auth("GUIDE"),GuideControllers.getMyBookings);
router.post( "/createpackage",auth("GUIDE"),GuideControllers.createPackage);
router.get("/:id", GuideControllers.getPackageById);



router.get("/my-packages",auth("GUIDE"),GuideControllers.getMyPackages
);


router.patch("/:id",auth("GUIDE"),GuideControllers.updatePackage
);


router.delete("/:id",auth("GUIDE"),GuideControllers.deletePackage



);



router.get("/bookings/:bookingId",auth("GUIDE"), GuideControllers.getBookingDetails);
router.patch("/bookings/:bookingId/status", auth("GUIDE"),GuideControllers.updateBookingStatus);







export const GuideRoutes = router;