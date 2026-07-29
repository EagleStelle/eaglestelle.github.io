import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "es_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const KEY_SALT = new TextEncoder().encode("eagle-stelle/admin-session/v1");
const KEY_ITERATIONS = 100_000;

let cachedKey: Promise<CryptoKey> | null = null;

function adminPassword(): string {
  const value = process.env.ADMIN_PASSWORD;
  if (!value) {
    throw new Error("ADMIN_PASSWORD is not set.");
  }
  return value;
}

function deriveKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = (async () => {
      const material = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(adminPassword()),
        "PBKDF2",
        false,
        ["deriveKey"],
      );

      return crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: KEY_SALT,
          iterations: KEY_ITERATIONS,
          hash: "SHA-256",
        },
        material,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
    })();
  }

  return cachedKey;
}

async function sign(value: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await deriveKey(),
    new TextEncoder().encode(value),
  );
  return Buffer.from(signature).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyPassword(input: string): Promise<boolean> {
  const [submitted, expected] = await Promise.all([
    sign(input),
    sign(adminPassword()),
  ]);
  return safeEqual(submitted, expected);
}

export async function createSession(): Promise<void> {
  const expiresAt = String(Date.now() + SESSION_TTL_SECONDS * 1000);
  const store = await cookies();
  store.set(COOKIE_NAME, `${expiresAt}.${await sign(expiresAt)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;

  const separator = token.lastIndexOf(".");
  if (separator === -1) return false;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, await sign(payload))) return false;

  const expiresAt = Number(payload);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAuthenticated())) {
    redirect("/admin/login");
  }
}
