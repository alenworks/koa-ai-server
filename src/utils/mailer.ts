import nodemailer from "nodemailer";
import { config } from "@/config";

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  host: config.smtpHost, // e.g. smtp.qq.com
  port: 465,
  secure: true,
  auth: {
    user: config.smtpUser,
    pass: config.smtpPass,
  },
});

export async function sendMail({ to, subject, text, html }: MailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"AI Health Monitor" <${config.smtpUser}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Mail] Sent: ${info.messageId}`);
  } catch (error) {
    console.error("[Mail] Failed:", error);
  }
}
