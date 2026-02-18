import { Resend } from "resend";

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

export function getFromAddress() {
  return process.env.EMAIL_FROM ?? "marketing-hub@notification.sonance.com";
}
