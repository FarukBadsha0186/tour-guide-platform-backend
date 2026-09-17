// guide.interface.ts

export interface IUpdateGuideProfile {
  licenseNumber?: string;
  yearsExperience?: number;
  languages?: string[];
  baseLocation?: string;
  bio?: string;
  hourlyRate?: number;
   isAvailable: "Active"
}

export interface IGuideResponse {
  id: string;
  userId: string;
  licenseNumber: string;
  yearsExperience: number;
  languages: string[];
  baseLocation: string;
  bio: string | null;
  hourlyRate: number | null;
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  profileImage: string | null;
  user?: {
    name: string;
    email: string;
    imageUrl: string;
    
  };
}

// package.interface.ts

export interface ICreatePackagePayload {
  
  title: string;
  description: string;
  durationHours: number;
  pricePerPerson: number;
  maxGroupSize: number;
  minGroupSize?: number;  // Optional
  meetingPoint?: string;  // Optional
  
}

export interface IUpdatePackagePayload extends Partial<ICreatePackagePayload> {}

export interface IPackageResponse {
  id: string;
  guideId: string;
  title: string;
  description: string;
  durationHours: number;
  pricePerPerson: number;
  maxGroupSize: number;
  minGroupSize: number;
  meetingPoint: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  guide?: {
    id: string;
    user: {
      name: string;
      email: string;
      imageUrl: string;
    };
  };
}

export interface IPackageFilter {
  search?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  minPrice?: number;
  maxPrice?: number;
  duration?: number;
  page?: number;
  limit?: number;
}


// interfaces/guide.interface.ts

// ===== Query Interface (Bookings List) =====
export interface IGuideBookingQuery {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
}

// ===== Update Booking Status =====
export interface IUpdateBookingStatus {
  status: "COMPLETED" | "CANCELLED";
  cancellationReason?: string;
}

// ===== Booking List Response =====
export interface IBookingListResponse {
  data: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export interface IAvailabilityQuery {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ===== Availability Response =====
export interface IAvailabilityResponse {
  id: string;
  isBooked: boolean;
  date: Date;
  startTime: string;
  endTime: string;
  packageId: string | null;
}

// ===== Availability List Response =====
export interface IAvailabilityListResponse {
  data: IAvailabilityResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}