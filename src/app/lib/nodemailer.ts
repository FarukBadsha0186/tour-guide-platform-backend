import fs from "fs";
import path from "path";

import ejs from "ejs";
import nodemailer from "nodemailer";

import config from "../config/index";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password,
  },
});

interface ISendEmailWithAttachment {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  pdfBuffer: Buffer;
  pdfFileName: string;
}

export const sendEmailWithAttachment = async ({
  to,
  subject,
  templateName,
  templateData,
  pdfBuffer,
  pdfFileName,
}: ISendEmailWithAttachment): Promise<boolean> => {
  try {
    // ✅ Multiple paths to handle different environments
    const possiblePaths = [
      // Path 1: Relative from lib to templates (src/app/lib -> src/app/templates)
      path.join(__dirname, "..", "templates", `${templateName}.ejs`),

      // Path 2: From project root
      path.join(process.cwd(), "src", "app", "templates", `${templateName}.ejs`),

      // Path 3: Using NODE_ENV for compiled JS (dist)
      path.join(__dirname, "../templates", `${templateName}.ejs`),
    ];

    console.log("🔍 Searching for template:", templateName);
    possiblePaths.forEach((p, i) => {
      const exists = fs.existsSync(p);
      console.log(`  Path ${i + 1}: ${p} ${exists ? "✅ EXISTS" : "❌"}`);
    });

    // ✅ Find first existing path
    const templatePath = possiblePaths.find((p) => fs.existsSync(p));

    if (!templatePath) {
      console.error(`❌ Template ${templateName}.ejs not found in any path`);
      throw new Error(
        `Template ${templateName}.ejs not found. Checked: ${possiblePaths.join(" | ")}`
      );
    }

    console.log("📁 Using template path:", templatePath);

    // ✅ Render template with EJS
    const html = await ejs.renderFile(templatePath, templateData);

    const mailOptions = {
      from: `"Tour Guide Platform" <${config.email_sender}>`,
      to,
      subject,
      html,
      attachments: [
        {
          filename: pdfFileName,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Email sending failed to ${to}:`, error.message);
    return false;
  }
};