import { Request, Response, NextFunction, Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";

import { catchAsync } from "../../utils/catchAsync";
import z from "zod";
import { validateRequest } from "../../middleware/validateRequest";
import { UserController } from "./user.controller";
import { upload } from "../../lib/multer";

const router = Router();




router.patch("/profile-image",
    auth(Role.ADMIN, Role.ADMIN, Role.GUIDE, Role.TOURIST),
    upload.single("profileImage"),
    UserController.uploadProfileImage);




export const UserRoutes = router;


