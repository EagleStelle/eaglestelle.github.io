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
  const [row] = await prisma.$queryRaw<
    { count: number; retryAfterSeconds: number }[]
  >`
    INSERT INTO "RateLimit" ("key", "count", "resetAt", "updatedAt")
    VALUES (
      ${key},
      1,
      (now() AT TIME ZONE 'UTC') + make_interval(secs => ${windowMs / 1000}),
      now() AT TIME ZONE 'UTC'
    )
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."resetAt" <= EXCLUDED."updatedAt" THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimit"."resetAt" <= EXCLUDED."updatedAt" THEN EXCLUDED."resetAt"
        ELSE "RateLimit"."resetAt"
      END,
      "updatedAt" = EXCLUDED."updatedAt"
    RETURNING
      "count",
      ceil(extract(epoch FROM "resetAt" - "updatedAt"))::int AS "retryAfterSeconds"
  `;

  if (row.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, row.retryAfterSeconds),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function clearRateLimit(key: string): Promise<void> {
  await prisma.rateLimit.deleteMany({
    where: { OR: [{ key }, { resetAt: { lt: new Date() } }] },
  });
}

export function formatRetryAfter(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}
