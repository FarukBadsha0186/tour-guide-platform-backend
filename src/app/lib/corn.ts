
import cron from "node-cron";
import { isBefore, isToday, isTomorrow, isYesterday, addHours } from "date-fns";
import { prisma } from "./prisma";

// ✅ Job 1: Check for expired availability (Every hour)
cron.schedule("0 * * * *", async () => {
  // Find availability where date < today and isBooked = false
  const expiredSlots = await prisma.guideAvailability.findMany({
    where: {
      date: { lt: new Date() },
      isBooked: false
    }
  });
  // Delete expired slots
  await prisma.guideAvailability.deleteMany({
    where: {
      id: { in: expiredSlots.map(s => s.id) }
    }
  });
});

// ✅ Job 2: Check for pending payments (Every 5 minutes)
cron.schedule("*/5 * * * *", async () => {
  const bookings = await prisma.booking.findMany({
    where: {
      status: "PENDING_PAYMENT",
      paymentDeadline: { lt: new Date() }
    }
  });
  // Cancel expired bookings
  // Free up availability
});

// ✅ Job 3: Send tour reminders (Every day at 9:00 AM)
cron.schedule("0 9 * * *", async () => {
  const tomorrowBookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      tourDate: { equals: addHours(new Date(), 24) }
    }
  });
  // Send reminders
});

// ✅ Job 4: Auto complete tours (Every day at midnight)
cron.schedule("0 0 * * *", async () => {
  const completedTours = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      tourDate: { lt: new Date() }
    }
  });
  // Update status to COMPLETED
});