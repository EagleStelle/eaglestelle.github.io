import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const DIGITS = 6;
const PERIOD_SECONDS = 30;
const WINDOW = 1;

export const TOTP_ISSUER = "Eagle Stelle Admin";

export function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

export function createOtpAuthUrl({
  secret,
  username,
}: {
  secret: string;
  username: string;
}): string {
  const label = `${TOTP_ISSUER}:${username}`;
  const params = new URLSearchParams({
    secret,
    issuer: TOTP_ISSUER,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(PERIOD_SECONDS),
  });

  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

export function verifyTotpCode(code: string, secret: string): boolean {
  const normalized = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(normalized)) return false;

  const counter = Math.floor(Date.now() / 1000 / PERIOD_SECONDS);

  for (let offset = -WINDOW; offset <= WINDOW; offset++) {
    if (safeEqual(normalized, hotp(secret, counter + offset))) {
      return true;
    }
  }

  return false;
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac("sha1", key).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return String(binary % 10 ** DIGITS).padStart(DIGITS, "0");
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  return timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

function base32Encode(buffer: Buffer): string {
  let bits = "";
  let output = "";

  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, "0");
  }

  for (let index = 0; index < bits.length; index += 5) {
    const chunk = bits.slice(index, index + 5).padEnd(5, "0");
    output += ALPHABET[parseInt(chunk, 2)];
  }

  return output;
}

function base32Decode(value: string): Buffer {
  const clean = value.replace(/=+$/g, "").replace(/\s/g, "").toUpperCase();
  let bits = "";

  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error("Invalid TOTP secret.");
    }
    bits += index.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}
