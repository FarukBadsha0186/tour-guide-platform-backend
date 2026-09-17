import { 
  format, 
  parse, 
  isToday, 
  isTomorrow, 
  isYesterday,
  isBefore,
  isAfter,
  addHours,
  addDays,
  differenceInHours,
  differenceInDays,
  startOfDay,
  endOfDay,
  isSameDay,
  isSameWeek,
  isSameMonth
} from "date-fns";

export const DateHelpers = {
  // Format date
  formatDate: (date: Date, pattern: string = "yyyy-MM-dd HH:mm") => {
    return format(date, pattern);
  },

  // Parse date
  parseDate: (dateString: string, pattern: string = "yyyy-MM-dd") => {
    return parse(dateString, pattern, new Date());
  },

  // Check if date is today
  isToday: (date: Date) => isToday(date),

  // Check if date is tomorrow
  isTomorrow: (date: Date) => isTomorrow(date),

  // Check if date is yesterday
  isYesterday: (date: Date) => isYesterday(date),

  // Check if date is expired
  isExpired: (date: Date) => isBefore(date, new Date()),

  // Check if date is in future
  isFuture: (date: Date) => isAfter(date, new Date()),

  // Add hours
  addHours: (date: Date, hours: number) => addHours(date, hours),

  // Add days
  addDays: (date: Date, days: number) => addDays(date, days),

  // Calculate difference in hours
  diffHours: (date1: Date, date2: Date) => differenceInHours(date1, date2),

  // Calculate difference in days
  diffDays: (date1: Date, date2: Date) => differenceInDays(date1, date2),

  // Check if same day
  isSameDay: (date1: Date, date2: Date) => isSameDay(date1, date2),

  // Start of day
  startOfDay: (date: Date) => startOfDay(date),

  // End of day
  endOfDay: (date: Date) => endOfDay(date),
};