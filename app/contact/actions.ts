"use server";

import {
  consumeRateLimit,
  formatRetryAfter,
  rateLimitKey,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const CONTACT_LIMIT = 5;
const CONTACT_WINDOW_MS = 10 * 60 * 1000;
const MAX_NAME_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 4000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
  submittedAt: number;
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function state(
  status: ContactFormState["status"],
  message: string,
): ContactFormState {
  return {
    status,
    message,
    submittedAt: Date.now(),
  };
}

function emailEnv(name: string, aliases: string[] = []): string {
  for (const key of [name, ...aliases]) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }

  throw new Error(`${name} is not set.`);
}

function emailList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cleanSubject(value: string): string {
  return value.replace(/[\r\n]+/g, " ").slice(0, 160);
}

export async function sendContactMessage(
  _previousState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const honeypot = text(formData, "website");
  if (honeypot) {
    return state("success", "Message sent. Thank you.");
  }

  const ip = await getClientIp();
  const limit = await consumeRateLimit({
    key: rateLimitKey("contact-form-ip", ip),
    limit: CONTACT_LIMIT,
    windowMs: CONTACT_WINDOW_MS,
  });

  if (!limit.allowed) {
    return state(
      "error",
      `Too many messages. Try again in ${formatRetryAfter(
        limit.retryAfterSeconds,
      )}.`,
    );
  }

  const fullName = text(formData, "fullName");
  const email = text(formData, "email").toLowerCase();
  const message = text(formData, "message");

  if (!fullName || !email || !message) {
    return state("error", "Full name, email, and message are required.");
  }

  if (fullName.length > MAX_NAME_LENGTH) {
    return state("error", "Full name is too long.");
  }

  if (!EMAIL_PATTERN.test(email)) {
    return state("error", "Enter a valid email address.");
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return state("error", "Message is too long.");
  }

  let apiKey: string;
  let from: string;
  let to: string[];

  try {
    apiKey = emailEnv("EMAIL_API_KEY", [
      "EMAIL_API",
      "Email_API",
      "Email_API_KEY",
    ]);
    from = emailEnv("EMAIL_FROM_ADDRESS");
    to = emailList(emailEnv("EMAIL_TO_ADDRESS"));
  } catch (cause) {
    console.error(cause);
    return state("error", "Email is not configured yet.");
  }

  if (to.length === 0) {
    return state("error", "Email recipient is not configured yet.");
  }

  const subjectPrefix =
    process.env.EMAIL_SUBJECT_PREFIX?.trim() || "Portfolio contact";
  const subject = cleanSubject(`${subjectPrefix}: ${fullName}`);
  const safeName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject,
      text: `Name: ${fullName}\nEmail: ${email}\n\n${message}`,
      html: `
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
      `,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Resend contact email failed:", details);
    return state("error", "Message could not be sent right now.");
  }

  return state("success", "Message sent. Thank you.");
}
