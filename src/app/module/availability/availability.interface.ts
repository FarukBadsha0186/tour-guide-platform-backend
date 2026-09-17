// src/app/modules/availability/availability.interface.ts

export interface ICreateAvailabilityPayload {
  dates: string[]; // ["2024-01-10", "2024-01-11"]
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  packageId?: string;
}

export interface IUpdateAvailabilityPayload {
  date?: string;
  startTime?: string;
  endTime?: string;
  isBooked?: boolean;
}

export interface IAvailabilityFilter {
  guideId?: string;
  packageId?: string;
  date?: string;
  isBooked?: boolean;
  page?: number;
  limit?: number;
}