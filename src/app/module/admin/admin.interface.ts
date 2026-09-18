// interfaces/admin.interface.ts

import { PackageStatus, UserStatus } from "../../../generated/prisma/enums";

// ===== Query Interface (Tourists) =====
export interface ITouristQuery {
  limit?: number;
  page?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

// ===== Query Interface (Guides) =====
export interface IGuideQuery {
  limit?: number;
  page?: number;
  status?: string;
  isApproved?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

// ===== Update User Status =====
export interface IUpdateUserStatus {
  status: "ACTIVE" | "BLOCKED";
}

// ===== User List Response =====
export interface IUserListResponse {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


// src/app/module/admin/admin.interface.ts

// ... আগের interface গুলো

// ===== Booking Query =====
export interface IAdminBookingQuery {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  paymentStatus?: string;
  touristEmail?: string;
  guideEmail?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
}

// ===== Payment Query =====
export interface IAdminPaymentQuery {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}


export interface IAdminApproveGuidePayload {
  isApproved: boolean;
  reason?: string;
}

export interface IAdminApprovePackagePayload {
  status: "APPROVED" | "REJECTED";
  reason?: string;
}



// ============ GET ALL GUIDES ============
export interface IGetAllGuidesQuery {
  isApproved?: boolean;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

// ============ APPROVE GUIDE ============
export interface IApproveGuidePayload {
  isApproved: boolean;
}

// ============ GET ALL PACKAGES ============
export interface IGetAllPackagesQuery {
  status?: PackageStatus;
  isDeleted?: boolean;
  guideId?: string;
  page?: number;
  limit?: number;
}

// ============ APPROVE PACKAGE ============
export interface IApprovePackagePayload {
  status: PackageStatus;
}