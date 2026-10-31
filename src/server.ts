import app from "./app";
import config from "./app/config";
import { transporter } from "./app/lib/nodemailer";
import { prisma } from "./app/lib/prisma";
import { redisclient } from "./app/lib/redis";
import { seedTesterAdmin, seedTesterGuide, seedTesterTourist } from "./app/utils/seed";
import cron from 'node-cron';


const PORT = config.port;

const main = async () => {
	try {
		



		await prisma.$connect();
		await redisclient.connect(),
		console.log("Redis connect successfully")
		await transporter.verify();
		console.log("Node mailer conncected Successfully")
		await seedTesterAdmin(),
		await seedTesterGuide(),
		await seedTesterTourist(),

		cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});

		

		console.log("Connected to the database successfully.");
		app.listen(PORT, () => {
			console.log(`Server is running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Error starting the server:", error);
		await prisma.$disconnect();
		process.exit(1);
	}
};

main();
