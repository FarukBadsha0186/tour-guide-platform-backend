// import app from "./app";
// import config from "./app/config";
// import { transporter } from "./app/lib/nodemailer";
// import { prisma } from "./app/lib/prisma";
// import { redisclient } from "./app/lib/redis";
// import { seedTesterAdmin, seedTesterGuide, seedTesterTourist } from "./app/utils/seed";
// import cron from 'node-cron';


// const PORT = config.port;

// const main = async () => {
// 	try {
		



// 		await prisma.$connect();
// 		await redisclient.connect(),
// 		console.log("Redis connect successfully")
// 		await transporter.verify();
// 		console.log("Node mailer conncected Successfully")
// 		await seedTesterAdmin(),
// 		await seedTesterGuide(),
// 		await seedTesterTourist(),

// 		cron.schedule('* * * * *', () => {
//   console.log('running a task every minute');
// });

		

// 		console.log("Connected to the database successfully.");
// 		app.listen(PORT, () => {
// 			console.log(`Server is running on port ${PORT}`);
// 		});
// 	} catch (error) {
// 		console.error("Error starting the server:", error);
// 		await prisma.$disconnect();
// 		process.exit(1);
// 	}
// };

// main();


import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisclient } from "./app/lib/redis";
import {
  seedTesterAdmin,
  seedTesterGuide,
  seedTesterTourist,
} from "./app/utils/seed";
import cron from "node-cron";

const PORT = config.port;

// ✅ Vercel er jonno MUST - app export
export default app;

// ============================================
// One-time initialization (DB, Redis, Mailer, Seeds)
// ============================================
const initializeServices = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");

    if (!redisclient.isOpen) {
      await redisclient.connect();
      console.log("✅ Redis connected");
    }

    await transporter.verify();
    console.log("✅ Nodemailer connected");

    await seedTesterAdmin();
    await seedTesterGuide();
    await seedTesterTourist();
    console.log("✅ Seeds completed");

    // Cron job (only for long-running environments, not serverless)
    if (process.env.NODE_ENV !== "production") {
      cron.schedule("* * * * *", () => {
        console.log("🕐 Cron: running a task every minute");
      });
    }
  } catch (error) {
    console.error("❌ Service initialization failed:", error);
    // Don't throw - let app run, but log it
  }
};

// ============================================
// Local dev: initialize + listen
// ============================================
if (process.env.NODE_ENV !== "production") {
  initializeServices().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  });
} else {
  // Vercel production: initialize only (no listen)
  initializeServices();
}