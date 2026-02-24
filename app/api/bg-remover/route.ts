import { NextResponse } from "next/server";
import Replicate from "replicate";

export async function POST(request: Request) {
  const apiKey = process.env.REPLICATE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "REPLICATE_API_KEY not configured" },
      { status: 500 }
    );
  }

  const replicate = new Replicate({ auth: apiKey });

  const { image } = await request.json();

  try {
    // Convert base64 data URI to a File object for the Replicate SDK
    const base64Data = image.split(",")[1];
    const mimeType = image.split(";")[0].split(":")[1];
    const buffer = Buffer.from(base64Data, "base64");
    const file = new File([buffer], "input.png", { type: mimeType });

    // Upload the file to Replicate and get a URL
    const fileUrl = await replicate.files.create(file);

    const output = await replicate.run(
      "851-labs/background-remover:a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
      {
        input: {
          image: fileUrl.urls.get,
          format: "png",
          background_type: "rgba",
        },
      }
    );

    // output is a FileOutput — call .url() to get the URL string
    const outputUrl =
      typeof output === "string"
        ? output
        : output && typeof (output as { url: () => string }).url === "function"
          ? (output as { url: () => string }).url()
          : String(output);

    return NextResponse.json({ output: outputUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
