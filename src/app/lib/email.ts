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
    // ✅ Multiple paths for different environments
    const possiblePaths = [
      // Path 1: From lib to templates (development - src/app/lib)
      path.join(__dirname, "..", "templates", `${templateName}.ejs`),

      // Path 2: From project root (development)
      path.join(process.cwd(), "src", "app", "templates", `${templateName}.ejs`),

      // Path 3: Absolute hardcoded (your project)
      path.join(
        "D:",
        "L2B7-Project_Tourist_Local_Guide_Admin_Backend",
        "src",
        "app",
        "templates",
        `${templateName}.ejs`
      ),

      // Path 4: From __dirname backward
      path.join(__dirname, "..", "..", "..", "src", "app", "templates", `${templateName}.ejs`),

      // Path 5: Try to find "src" folder in cwd
      (() => {
        const cwd = process.cwd();
        const srcIndex = cwd.indexOf("src");
        if (srcIndex !== -1) {
          const root = cwd.substring(0, srcIndex);
          return path.join(root, "src", "app", "templates", `${templateName}.ejs`);
        }
        return "";
      })(),
    ].filter(Boolean); // Remove empty strings

    console.log("🔍 Searching for template:", templateName);
    console.log("🔍 CWD:", process.cwd());
    console.log("🔍 __dirname:", __dirname);
    
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