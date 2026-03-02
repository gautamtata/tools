"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  Upload,
  Download,
  X,
  Loader2,
  ImageIcon,
  ArrowRight,
} from "lucide-react";

type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

const FORMAT_OPTIONS: { label: string; value: OutputFormat; ext: string }[] = [
  { label: "JPG", value: "image/jpeg", ext: "jpg" },
  { label: "PNG", value: "image/png", ext: "png" },
  { label: "WebP", value: "image/webp", ext: "webp" },
];

type ResizeMode = "none" | "dimensions" | "filesize";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImageConverterPage() {
  const [dragActive, setDragActive] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [originalName, setOriginalName] = useState("");
  const [originalSize, setOriginalSize] = useState(0);
  const [originalDimensions, setOriginalDimensions] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultDimensions, setResultDimensions] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Options
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("image/jpeg");
  const [quality, setQuality] = useState(85);
  const [resizeMode, setResizeMode] = useState<ResizeMode>("none");
  const [targetWidth, setTargetWidth] = useState("");
  const [targetHeight, setTargetHeight] = useState("");
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [targetFileSize, setTargetFileSize] = useState(""); // in KB

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic") && !file.name.toLowerCase().endsWith(".heif")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Image must be under 50MB.");
      return;
    }

    setError("");
    setResultBlob(null);
    setResultUrl(null);
    setResultDimensions(null);
    setOriginalName(file.name);
    setOriginalSize(file.size);

    try {
      let imageBlob: Blob = file;

      // Convert HEIC/HEIF to PNG for display
      const isHeic =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      if (isHeic) {
        const heic2any = (await import("heic2any")).default;
        const converted = await heic2any({
          blob: file,
          toType: "image/png",
          quality: 1,
        });
        imageBlob = Array.isArray(converted) ? converted[0] : converted;
      }

      const url = URL.createObjectURL(imageBlob);

      // Get dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ w: img.naturalWidth, h: img.naturalHeight });
        setTargetWidth(String(img.naturalWidth));
        setTargetHeight(String(img.naturalHeight));
      };
      img.src = url;

      setOriginalImage(url);
    } catch {
      setError("Failed to read image. If this is a HEIC file, it may not be supported in this browser.");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  function handleWidthChange(val: string) {
    setTargetWidth(val);
    if (lockAspectRatio && originalDimensions && val) {
      const w = parseInt(val);
      if (!isNaN(w)) {
        const ratio = originalDimensions.h / originalDimensions.w;
        setTargetHeight(String(Math.round(w * ratio)));
      }
    }
  }

  function handleHeightChange(val: string) {
    setTargetHeight(val);
    if (lockAspectRatio && originalDimensions && val) {
      const h = parseInt(val);
      if (!isNaN(h)) {
        const ratio = originalDimensions.w / originalDimensions.h;
        setTargetWidth(String(Math.round(h * ratio)));
      }
    }
  }

  async function convertImage() {
    if (!originalImage) return;
    setLoading(true);
    setError("");

    try {
      const img = new Image();
      img.src = originalImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext("2d")!;

      let drawWidth = img.naturalWidth;
      let drawHeight = img.naturalHeight;

      if (resizeMode === "dimensions") {
        const w = parseInt(targetWidth);
        const h = parseInt(targetHeight);
        if (!isNaN(w) && w > 0) drawWidth = w;
        if (!isNaN(h) && h > 0) drawHeight = h;
      }

      canvas.width = drawWidth;
      canvas.height = drawHeight;

      // For JPG output, fill white background (no transparency)
      if (outputFormat === "image/jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, drawWidth, drawHeight);
      }

      ctx.drawImage(img, 0, 0, drawWidth, drawHeight);

      if (resizeMode === "filesize") {
        const targetKB = parseInt(targetFileSize);
        if (isNaN(targetKB) || targetKB <= 0) {
          setError("Please enter a valid target file size.");
          setLoading(false);
          return;
        }
        const targetBytes = targetKB * 1024;

        // Binary search for the right quality
        let lo = 0.01;
        let hi = 1.0;
        let bestBlob: Blob | null = null;

        // Use lossy format for file size targeting
        const fmt =
          outputFormat === "image/png" ? "image/jpeg" : outputFormat;

        for (let i = 0; i < 20; i++) {
          const mid = (lo + hi) / 2;
          const blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), fmt, mid)
          );
          if (blob.size <= targetBytes) {
            bestBlob = blob;
            lo = mid;
          } else {
            hi = mid;
          }
        }

        // If even lowest quality is too large, progressively scale down
        if (!bestBlob) {
          let scale = 0.9;
          while (scale > 0.1) {
            const sw = Math.round(drawWidth * scale);
            const sh = Math.round(drawHeight * scale);
            canvas.width = sw;
            canvas.height = sh;
            if (fmt === "image/jpeg") {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(0, 0, sw, sh);
            }
            ctx.drawImage(img, 0, 0, sw, sh);
            const blob = await new Promise<Blob>((resolve) =>
              canvas.toBlob((b) => resolve(b!), fmt, 0.7)
            );
            if (blob.size <= targetBytes) {
              bestBlob = blob;
              break;
            }
            scale -= 0.1;
          }
        }

        if (!bestBlob) {
          setError(
            "Could not compress to the target size. Try a larger target."
          );
          setLoading(false);
          return;
        }

        if (resultUrl) URL.revokeObjectURL(resultUrl);
        const url = URL.createObjectURL(bestBlob);
        setResultBlob(bestBlob);
        setResultUrl(url);

        // Get result dimensions
        const rImg = new Image();
        rImg.onload = () =>
          setResultDimensions({ w: rImg.naturalWidth, h: rImg.naturalHeight });
        rImg.src = url;
      } else {
        // Standard conversion
        const q = quality / 100;
        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), outputFormat, q)
        );

        if (resultUrl) URL.revokeObjectURL(resultUrl);
        const url = URL.createObjectURL(blob);
        setResultBlob(blob);
        setResultUrl(url);
        setResultDimensions({ w: drawWidth, h: drawHeight });
      }
    } catch {
      setError("Failed to convert image.");
    } finally {
      setLoading(false);
    }
  }

  function downloadResult() {
    if (!resultBlob || !resultUrl) return;
    const ext =
      FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.ext ?? "jpg";
    const baseName = originalName.replace(/\.[^.]+$/, "");
    const link = document.createElement("a");
    link.href = resultUrl;
    link.download = `${baseName}-converted.${ext}`;
    link.click();
  }

  function reset() {
    if (originalImage) URL.revokeObjectURL(originalImage);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setOriginalImage(null);
    setOriginalName("");
    setOriginalSize(0);
    setOriginalDimensions(null);
    setResultBlob(null);
    setResultUrl(null);
    setResultDimensions(null);
    setError("");
    setResizeMode("none");
    setQuality(85);
  }

  const selectedFormatInfo = FORMAT_OPTIONS.find(
    (f) => f.value === outputFormat
  )!;
  const isLossyFormat = outputFormat !== "image/png";

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tools
          </a>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Image Converter
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Convert between image formats (HEIC, PNG, JPG, WebP) and resize to
            fit your needs.
          </p>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Upload area */}
        {!originalImage && (
          <Card>
            <CardContent className="p-0">
              <label
                htmlFor="file-upload"
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 transition-colors ${
                  dragActive
                    ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                    : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <Upload className="h-7 w-7 text-zinc-400" />
                </div>
                <p className="mb-1 text-lg font-medium text-zinc-700 dark:text-zinc-300">
                  Drop your image here
                </p>
                <p className="text-sm text-zinc-500">
                  Supports HEIC, PNG, JPG, WebP, GIF, BMP, TIFF (up to 50MB)
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </CardContent>
          </Card>
        )}

        {/* Workspace */}
        {originalImage && (
          <div className="space-y-6">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={reset}>
                <X className="mr-1.5 h-4 w-4" />
                Clear
              </Button>
              <div className="flex gap-2">
                <Button onClick={convertImage} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="mr-1.5 h-4 w-4" />
                      Convert
                    </>
                  )}
                </Button>
                {resultBlob && (
                  <Button variant="outline" onClick={downloadResult}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Download ({formatBytes(resultBlob.size)})
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Settings panel */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Settings</CardTitle>
                  <CardDescription>
                    {originalName} ({formatBytes(originalSize)})
                    {originalDimensions &&
                      ` \u2022 ${originalDimensions.w}\u00d7${originalDimensions.h}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Output format */}
                  <div className="space-y-2">
                    <Label>Output Format</Label>
                    <div className="flex gap-2">
                      {FORMAT_OPTIONS.map((fmt) => (
                        <button
                          key={fmt.value}
                          onClick={() => setOutputFormat(fmt.value)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            outputFormat === fmt.value
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quality (for lossy formats) */}
                  {isLossyFormat && resizeMode !== "filesize" && (
                    <div className="space-y-2">
                      <Label>Quality: {quality}%</Label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        className="w-full accent-zinc-900 dark:accent-zinc-100"
                      />
                      <div className="flex justify-between text-xs text-zinc-400">
                        <span>Smaller file</span>
                        <span>Higher quality</span>
                      </div>
                    </div>
                  )}

                  {/* Resize mode */}
                  <div className="space-y-2">
                    <Label>Resize</Label>
                    <div className="flex gap-2">
                      {(
                        [
                          { label: "None", value: "none" },
                          { label: "Dimensions", value: "dimensions" },
                          { label: "File Size", value: "filesize" },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setResizeMode(opt.value)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                            resizeMode === opt.value
                              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                              : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-zinc-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dimension inputs */}
                  {resizeMode === "dimensions" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Width (px)</Label>
                          <Input
                            type="number"
                            value={targetWidth}
                            onChange={(e) => handleWidthChange(e.target.value)}
                            min="1"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Height (px)</Label>
                          <Input
                            type="number"
                            value={targetHeight}
                            onChange={(e) => handleHeightChange(e.target.value)}
                            min="1"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={lockAspectRatio}
                          onChange={(e) => setLockAspectRatio(e.target.checked)}
                          className="accent-zinc-900 dark:accent-zinc-100"
                        />
                        Lock aspect ratio
                      </label>
                    </div>
                  )}

                  {/* File size target */}
                  {resizeMode === "filesize" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Target size (KB)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 500"
                        value={targetFileSize}
                        onChange={(e) => setTargetFileSize(e.target.value)}
                        min="1"
                      />
                      <p className="text-xs text-zinc-400">
                        Image will be compressed (and scaled down if needed) to
                        fit under this size.
                        {outputFormat === "image/png" &&
                          " PNG will be converted to JPG for size targeting."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preview area */}
              <div className="space-y-4 lg:col-span-2">
                {/* Original preview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Original</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                      <img
                        src={originalImage}
                        alt="Original"
                        className="h-auto w-full object-contain"
                        style={{ maxHeight: "350px" }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Result preview */}
                {resultUrl && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Converted ({selectedFormatInfo.label})
                          </CardTitle>
                          <CardDescription>
                            {resultBlob && formatBytes(resultBlob.size)}
                            {resultDimensions &&
                              ` \u2022 ${resultDimensions.w}\u00d7${resultDimensions.h}`}
                            {resultBlob && originalSize > 0 && (
                              <span
                                className={
                                  resultBlob.size < originalSize
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-amber-600 dark:text-amber-400"
                                }
                              >
                                {" "}
                                (
                                {resultBlob.size < originalSize ? "-" : "+"}
                                {Math.abs(
                                  Math.round(
                                    ((resultBlob.size - originalSize) /
                                      originalSize) *
                                      100
                                  )
                                )}
                                %)
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <ImageIcon className="h-5 w-5 text-zinc-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div
                        className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
                        style={
                          outputFormat === "image/png"
                            ? {
                                backgroundImage:
                                  "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
                                backgroundSize: "20px 20px",
                                backgroundPosition:
                                  "0 0, 0 10px, 10px -10px, -10px 0px",
                              }
                            : undefined
                        }
                      >
                        <img
                          src={resultUrl}
                          alt="Converted"
                          className="h-auto w-full object-contain"
                          style={{ maxHeight: "350px" }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
