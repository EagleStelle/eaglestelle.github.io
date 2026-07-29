import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "es_admin";
const SETUP_COOKIE_NAME = "es_admin_setup";
const TOTP_LOGIN_COOKIE_NAME = "es_admin_totp_login";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SETUP_TTL_SECONDS = 60 * 10;
const TOTP_LOGIN_TTL_SECONDS = 60 * 10;
const KEY_SALT = new TextEncoder().encode("eagle-stelle/admin-session/v1");
const KEY_ITERATIONS = 100_000;

let cachedKey: Promise<CryptoKey> | null = null;

type TotpSetupChallenge = {
  username: string;
  secret: string;
  expiresAt: number;
};

type TotpLoginChallenge = {
  username: string;
  expiresAt: number;
};

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set.`);
  }
  return value;
}

function adminPassword(): string {
  return requiredEnv("ADMIN_PASSWORD");
}

function adminUsername(): string {
  return requiredEnv("ADMIN_USERNAME");
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

async function verifySecret(input: string, expected: string): Promise<boolean> {
  const [submitted, expectedSignature] = await Promise.all([
    sign(input),
    sign(expected),
  ]);
  return safeEqual(submitted, expectedSignature);
}

export async function verifyPassword(input: string): Promise<boolean> {
  return verifySecret(input, adminPassword());
}

export async function verifyCredentials({
  username,
  password,
}: {
  username: string;
  password: string;
}): Promise<boolean> {
  const [validUsername, validPassword] = await Promise.all([
    verifySecret(username, adminUsername()),
    verifyPassword(password),
  ]);

  return validUsername && validPassword;
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

export async function createTotpSetupChallenge({
  username,
  secret,
}: {
  username: string;
  secret: string;
}): Promise<void> {
  const expiresAt = Date.now() + SETUP_TTL_SECONDS * 1000;
  const payload = Buffer.from(
    JSON.stringify({ username, secret, expiresAt }),
  ).toString("base64url");
  const store = await cookies();

  store.set(SETUP_COOKIE_NAME, `${payload}.${await sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/login",
    maxAge: SETUP_TTL_SECONDS,
  });
}

export async function readTotpSetupChallenge(): Promise<TotpSetupChallenge | null> {
  const token = (await cookies()).get(SETUP_COOKIE_NAME)?.value;
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator === -1) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, await sign(payload))) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<TotpSetupChallenge>;

    if (
      typeof parsed.username !== "string" ||
      typeof parsed.secret !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }

    return {
      username: parsed.username,
      secret: parsed.secret,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function destroyTotpSetupChallenge(): Promise<void> {
  const store = await cookies();
  store.delete(SETUP_COOKIE_NAME);
}

export async function createTotpLoginChallenge({
  username,
}: {
  username: string;
}): Promise<void> {
  const expiresAt = Date.now() + TOTP_LOGIN_TTL_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ username, expiresAt })).toString(
    "base64url",
  );
  const store = await cookies();

  store.set(TOTP_LOGIN_COOKIE_NAME, `${payload}.${await sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin/login",
    maxAge: TOTP_LOGIN_TTL_SECONDS,
  });
}

export async function readTotpLoginChallenge(): Promise<TotpLoginChallenge | null> {
  const token = (await cookies()).get(TOTP_LOGIN_COOKIE_NAME)?.value;
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator === -1) return null;

  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  if (!safeEqual(signature, await sign(payload))) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<TotpLoginChallenge>;

    if (
      typeof parsed.username !== "string" ||
      typeof parsed.expiresAt !== "number" ||
      parsed.expiresAt <= Date.now()
    ) {
      return null;
    }

    return {
      username: parsed.username,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function destroyTotpLoginChallenge(): Promise<void> {
  const store = await cookies();
  store.delete(TOTP_LOGIN_COOKIE_NAME);
}

export async function isTotpConfigured(): Promise<boolean> {
  const security = await prisma.adminSecurity.findUnique({
    where: { id: 1 },
    select: { totpSecret: true },
  });

  return Boolean(security?.totpSecret);
}

export async function getTotpSecret(): Promise<string | null> {
  const security = await prisma.adminSecurity.findUnique({
    where: { id: 1 },
    select: { totpSecret: true },
  });

  return security?.totpSecret ?? null;
}

export async function saveTotpSecret(secret: string): Promise<void> {
  await prisma.adminSecurity.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      totpSecret: secret,
      totpEnabledAt: new Date(),
    },
    update: {
      totpSecret: secret,
      totpEnabledAt: new Date(),
    },
  });
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
