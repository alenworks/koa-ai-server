import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  env: process.env.NODE_ENV || "development",
  openaiKeys: process.env.OPENAI_KEYS || "",
  smtpHost: process.env.SMTP_HOST!,
  smtpUser: process.env.SMTP_USER!,
  smtpPass: process.env.SMTP_PASS!,
  monitorEmail: process.env.MONITOR_EMAIL!,
  openaiBaseUrl: process.env.OPENAI_BASE_URL!,
};
