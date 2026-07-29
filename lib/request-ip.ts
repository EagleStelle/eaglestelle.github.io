import { headers } from "next/headers";

export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwardedFor = store.get("x-forwarded-for")?.split(",")[0]?.trim();

  return (
    forwardedFor ||
    store.get("x-real-ip") ||
    store.get("cf-connecting-ip") ||
    "unknown"
  );
}
