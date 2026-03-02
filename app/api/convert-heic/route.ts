import { NextRequest, NextResponse } from "next/server";
import convert from "heic-convert";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const outputBuffer = await convert({
      buffer: inputBuffer,
      format: "PNG",
      quality: 1,
    });

    return new NextResponse(new Uint8Array(outputBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${file.name.replace(/\.[^.]+$/, "")}.png"`,
      },
    });
  } catch (err) {
    console.error("HEIC conversion error:", err);
    return NextResponse.json(
      { error: "Failed to convert HEIC file" },
      { status: 500 }
    );
  }
}
