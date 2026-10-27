import { ImageResponse } from "next/og";
import sharp from "sharp";
import { aliasIdentities, displayName, formatIdentity, getProfile } from "@/lib/profile";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Portfolio preview";
export const revalidate = 3600;

const AVATAR_SIZE = 320;
const NIGHT = "#0e0d0c";
const INK = "#e8e7e4";
const MUTED = "#a8a6a2";
const BRASS = "#ebbc63";

function starField(count: number) {
  let seed = 7;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  return Array.from({ length: count }, () => {
    const x = random() * size.width;
    const y = random() * size.height;
    const roll = random();

    return {
      x,
      y,
      size: roll < 0.12 ? 3 : roll < 0.45 ? 2 : 1.5,
      color: roll > 0.9 ? BRASS : INK,
      opacity: 0.3 + random() * 0.55,
    };
  });
}

const STARS = starField(70);

async function loadAvatar(url: string | null | undefined) {
  if (!url) return undefined;

  try {
    const response = await fetch(url);

    if (!response.ok) return undefined;

    const png = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover" })
      .png()
      .toBuffer();

    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export default async function OpengraphImage() {
  const profile = await getProfile();

  const name = displayName(profile);
  const headline = profile?.headline?.trim() ?? "";
  const aliases = aliasIdentities(profile?.aliases ?? []).map(formatIdentity);
  const avatarUrl = await loadAvatar(profile?.avatarUrl);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: "64px",
          background: NIGHT,
          backgroundImage: `linear-gradient(rgba(232,231,228,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(232,231,228,0.05) 1px, transparent 1px)`,
          backgroundSize: "120px 120px",
          color: INK,
          padding: "80px",
          position: "relative",
        }}
      >
        {STARS.map((star, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              borderRadius: "50%",
              background: star.color,
              opacity: star.opacity,
            }}
          />
        ))}

        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "12px",
            background: BRASS,
          }}
        />

        {avatarUrl && (
          <div
            style={{
              display: "flex",
              position: "relative",
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -70,
                left: -70,
                width: AVATAR_SIZE + 140,
                height: AVATAR_SIZE + 140,
                borderRadius: "50%",
                backgroundImage:
                  "radial-gradient(circle, rgba(235,188,99,0.32) 0%, rgba(235,188,99,0.32) 48%, rgba(235,188,99,0.1) 56%, rgba(235,188,99,0) 71%)",
              }}
            />
            <img
              src={avatarUrl}
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              style={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: "50%",
                objectFit: "cover",
                border: `6px solid ${BRASS}`,
              }}
            />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              fontSize: avatarUrl ? 68 : 88,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              textTransform: "uppercase",
            }}
          >
            {name}
          </div>

          {headline && (
            <div
              style={{
                fontSize: avatarUrl ? 32 : 40,
                color: BRASS,
                marginTop: 20,
                lineHeight: 1.25,
              }}
            >
              {headline}
            </div>
          )}

          {aliases.length > 0 && (
            <div
              style={{
                fontSize: 24,
                color: MUTED,
                marginTop: 32,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {aliases.join(" · ")}
            </div>
          )}
        </div>
      </div>
    ),
    size,
  );
}
