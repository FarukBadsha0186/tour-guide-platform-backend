// src/app/middleware/optionalAuth.ts

import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import config from "../config";

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, config.jwt_access_secret) as any;
      (req as any).user = decoded; // Token valid hole user set hobe
    }
    // Token na thakleo next() call hobe (Public user)
    next();
  } catch (error) {
    // Token invalid thakle o block korbo na, public user hishebe treat korbo
    next();
  }
};