import { ImageResponse } from "next/og";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { SITE_ALIASES, SITE_NAME, SITE_TITLE } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = SITE_TITLE;
export const revalidate = 3600;

const AVATAR_SIZE = 320;

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
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });

  const name = profile?.name?.trim() || SITE_NAME;
  const headline = profile?.headline?.trim() ?? "";
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
          background: "#0a0a0a",
          color: "#fafafa",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "12px",
            background: "#c70036",
          }}
        />

        {avatarUrl && (
          <img
            src={avatarUrl}
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            style={{
              width: AVATAR_SIZE,
              height: AVATAR_SIZE,
              borderRadius: "50%",
              objectFit: "cover",
              border: "6px solid #c70036",
              flexShrink: 0,
            }}
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              fontSize: avatarUrl ? 68 : 88,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {name}
          </div>

          {headline && (
            <div
              style={{
                fontSize: avatarUrl ? 32 : 40,
                color: "#c70036",
                marginTop: 20,
                lineHeight: 1.25,
              }}
            >
              {headline}
            </div>
          )}

          <div
            style={{
              fontSize: 24,
              color: "#a1a1a1",
              marginTop: 32,
            }}
          >
            {`Also known as ${SITE_ALIASES.join(" · ")}`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
