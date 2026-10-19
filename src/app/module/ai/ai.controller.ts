

// src/app/modules/ai/ai.controller.ts

import { Request, Response } from "express";
import { publicChatWithAI, guideChatWithAI, adminChatWithAI } from "./ai.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

// Public
const publicChat = catchAsync(async (req: Request, res: Response) => {
  const { message } = req.body;
  const result = await publicChatWithAI(message);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "AI response generated", data: result });
});

// Guide
const guideChat = catchAsync(async (req: any, res: Response) => {
  const { message } = req.body;
  const userId = req.user?.userId;
  if (!userId) return sendResponse(res, { statusCode: 401, success: false, message: "Unauthorized", data: null });
  const result = await guideChatWithAI(userId, message);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Guide AI response generated", data: result });
});

// ✅ Admin - adminId pass koro
const adminChat = catchAsync(async (req: any, res: Response) => {
  const { message } = req.body;
  const adminId = req.user?.userId;
  if (!adminId) return sendResponse(res, { statusCode: 401, success: false, message: "Unauthorized", data: null });
  const result = await adminChatWithAI(adminId, message);
  sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Admin AI response generated", data: result });
});

export const AiController = {
  publicChat,
  guideChat,
  adminChat,
};