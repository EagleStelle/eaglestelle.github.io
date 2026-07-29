import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function rateLimitKey(namespace: string, identifier: string): string {
  const hash = createHash("sha256").update(identifier).digest("base64url");
  return `${namespace}:${hash}`;
}

export async function consumeRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.resetAt <= now) {
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, resetAt },
      update: { count: 1, resetAt },
    });

    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function clearRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({ where: { key } });
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
