"use server";

import { redirect } from "next/navigation";
import {
  clearRateLimit,
  consumeRateLimit,
  formatRetryAfter,
  rateLimitKey,
} from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import {
  createSession,
  createTotpLoginChallenge,
  createTotpSetupChallenge,
  destroyTotpLoginChallenge,
  destroyTotpSetupChallenge,
  getTotpSecret,
  readTotpLoginChallenge,
  readTotpSetupChallenge,
  saveTotpSecret,
  verifyCredentials,
} from "@/lib/auth";
import {
  createOtpAuthUrl,
  generateTotpSecret,
  TOTP_ISSUER,
  verifyTotpCode,
} from "@/lib/totp";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_IP_LIMIT = 10;
const LOGIN_USERNAME_LIMIT = 6;
const SETUP_LIMIT = 6;

export type LoginState = {
  stage: "login" | "totp" | "setup";
  message: string;
  requiresTotp: boolean;
  username?: string;
  setup?: {
    secret: string;
    accountName: string;
    issuer: string;
    otpAuthUrl: string;
  };
};

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function loginState(message = "", requiresTotp = false): LoginState {
  return {
    stage: "login",
    message,
    requiresTotp,
  };
}

function totpState(message = "", username = ""): LoginState {
  return {
    stage: "totp",
    message,
    requiresTotp: true,
    username,
  };
}

function setupState({
  message,
  secret,
  username,
}: {
  message: string;
  secret: string;
  username: string;
}): LoginState {
  return {
    stage: "setup",
    message,
    requiresTotp: false,
    setup: {
      secret,
      accountName: username,
      issuer: TOTP_ISSUER,
      otpAuthUrl: createOtpAuthUrl({ secret, username }),
    },
  };
}

async function consumeLoginLimit(username: string) {
  const ip = await getClientIp();
  const ipKey = rateLimitKey("admin-login-ip", ip);
  const ipLimit = await consumeRateLimit({
    key: ipKey,
    limit: LOGIN_IP_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  if (!ipLimit.allowed) {
    return {
      allowed: false,
      retryAfterSeconds: ipLimit.retryAfterSeconds,
      keys: [ipKey],
    };
  }

  if (!username) {
    return { allowed: true, retryAfterSeconds: 0, keys: [ipKey] };
  }

  const usernameKey = rateLimitKey("admin-login-username", username);
  const usernameLimit = await consumeRateLimit({
    key: usernameKey,
    limit: LOGIN_USERNAME_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  return {
    allowed: usernameLimit.allowed,
    retryAfterSeconds: usernameLimit.retryAfterSeconds,
    keys: [ipKey, usernameKey],
  };
}

async function clearLoginLimits(keys: string[]): Promise<void> {
  await Promise.all(keys.map((key) => clearRateLimit(key)));
}

async function consumeSetupLimit() {
  const ip = await getClientIp();
  const key = rateLimitKey("admin-totp-setup-ip", ip);
  const limit = await consumeRateLimit({
    key,
    limit: SETUP_LIMIT,
    windowMs: LOGIN_WINDOW_MS,
  });

  return { ...limit, key };
}

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const mode = text(formData, "mode");

  if (mode === "setup") {
    return completeAuthenticatorSetup(formData);
  }

  if (mode === "totp") {
    return completeTotpLogin(formData);
  }

  await destroyTotpLoginChallenge();

  const username = text(formData, "username");
  const password = String(formData.get("password") ?? "");
  const limit = await consumeLoginLimit(username.toLowerCase());

  if (!limit.allowed) {
    return loginState(
      `Too many sign-in attempts. Try again in ${formatRetryAfter(
        limit.retryAfterSeconds,
      )}.`,
    );
  }

  if (!username || !password) {
    return loginState("Username and password are required.");
  }

  let validCredentials = false;
  try {
    validCredentials = await verifyCredentials({ username, password });
  } catch (cause) {
    console.error(cause);
    return loginState("Admin credentials are not configured.");
  }

  if (!validCredentials) {
    return loginState("Incorrect username or password.");
  }

  const secret = await getTotpSecret();

  if (secret) {
    await createTotpLoginChallenge({ username });
    return totpState("", username);
  }

  const setupSecret = generateTotpSecret();
  await createTotpSetupChallenge({ username, secret: setupSecret });

  return setupState({
    message: "",
    secret: setupSecret,
    username,
  });
}

async function completeTotpLogin(formData: FormData): Promise<LoginState> {
  const challenge = await readTotpLoginChallenge();

  if (!challenge) {
    return loginState("Authenticator check expired. Sign in again.");
  }

  const limit = await consumeLoginLimit(challenge.username.toLowerCase());

  if (!limit.allowed) {
    return totpState(
      `Too many sign-in attempts. Try again in ${formatRetryAfter(
        limit.retryAfterSeconds,
      )}.`,
      challenge.username,
    );
  }

  const secret = await getTotpSecret();

  if (!secret) {
    await destroyTotpLoginChallenge();
    return loginState("Authenticator is not configured. Sign in again.");
  }

  if (!verifyTotpCode(text(formData, "code"), secret)) {
    return totpState("Incorrect authenticator code.", challenge.username);
  }

  await destroyTotpLoginChallenge();
  await clearLoginLimits(limit.keys);
  await createSession();
  redirect("/admin");
}

async function completeAuthenticatorSetup(
  formData: FormData,
): Promise<LoginState> {
  const limit = await consumeSetupLimit();
  const challenge = await readTotpSetupChallenge();

  if (!challenge) {
    return loginState("Authenticator setup expired. Sign in again.", false);
  }

  if (await getTotpSecret()) {
    await destroyTotpSetupChallenge();
    return loginState("Authenticator is already configured. Sign in.", true);
  }

  if (!limit.allowed) {
    return setupState({
      message: `Too many setup attempts. Try again in ${formatRetryAfter(
        limit.retryAfterSeconds,
      )}.`,
      secret: challenge.secret,
      username: challenge.username,
    });
  }

  if (!verifyTotpCode(text(formData, "code"), challenge.secret)) {
    return setupState({
      message: "Incorrect authenticator code.",
      secret: challenge.secret,
      username: challenge.username,
    });
  }

  await saveTotpSecret(challenge.secret);
  await destroyTotpSetupChallenge();
  await clearRateLimit(limit.key);
  await createSession();
  redirect("/admin");
}
