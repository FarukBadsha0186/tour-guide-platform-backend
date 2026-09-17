// interfaces/admin.interface.ts

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