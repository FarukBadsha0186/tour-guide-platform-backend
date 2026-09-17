// interfaces/tourist.interface.ts
export interface ICreateBooking {
  packageId: string;
  userId: string;
  tourDate: string;
  numberOfPeople: number;
  specialRequests?: string;
}


// interfaces/tourist.interface.ts
export interface ICreateBooking {
  packageId: string;
  userId: string;
  tourDate: string;
  numberOfPeople: number;
  specialRequests?: string;
}

export interface ICreateReview {
  bookingId: string;
  rating: number;
  comment?: string;
  images?: string[];
}

// ===== Review Query =====
export interface IReviewQuery {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
  rating?: number;
  guideId?: string;
}

export interface ICancelBooking {
  cancellationReason?: string;
}


// interfaces/tourist.interface.ts

// ... আগের interface গুলো

// ===== Booking Query =====
export interface IBookingQuery {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
  status?: string;
  packageId?: string;
  startDate?: string;
  endDate?: string;
}


// interfaces/tourist.interface.ts

// ... আগের interface গুলো

// ===== Package Query =====
export interface ITouristPackageQuery {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minDuration?: number;
  maxDuration?: number;
}

// ===== Availability Query =====
export interface IGuideAvailabilityQuery {
  startDate?: string;
  endDate?: string;
  packageId?: string;
  page?: number;
  limit?: number;
}

export interface IGuideAvailabilityQuery {
  startDate?: string;
  endDate?: string;
  packageId?: string;
  page?: number;
  limit?: number;
}

export interface IAvailabilityQuery {
  limit?: number;
  page?: number;
  startDate?: string;
  endDate?: string;
  packageId?: string;
  guideId?: string;
}

// ===== Available Only Query =====
export interface IAvailableOnlyQuery {
  limit?: number;
  page?: number;
  startDate?: string;
  endDate?: string;
  packageId?: string;
  guideId?: string;
}