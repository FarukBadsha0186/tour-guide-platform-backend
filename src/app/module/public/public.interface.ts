// src/app/module/public/public.interface.ts

// ===== Package Query =====
export interface IPublicPackageQuery {
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
  guideId?: string;     
  excludeId?: string;
}

// ===== Guide Query =====
export interface IPublicGuideQuery {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
  search?: string;
  location?: string;
  languages?: string;
  minRating?: number;
  minExperience?: number;
}

export interface IPublicReviewQuery {
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: string;
}