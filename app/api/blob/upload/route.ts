import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_UPLOAD_BYTES,
} from "@/lib/image-upload";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        if (!(await isAuthenticated())) {
          throw new Error("Not authenticated");
        }

        return {
          allowedContentTypes: [...ACCEPTED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_IMAGE_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
