"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Upload, Download, X, Loader2, ImageIcon } from "lucide-react";

export default function BgRemoverPage() {
  const [dragActive, setDragActive] = useState(false);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      return;
    }
    setError("");
    setResultImage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
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

  async function removeBackground() {
    if (!originalImage) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bg-remover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: originalImage }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove background");
      }

      setResultImage(data.output);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function downloadImage() {
    if (!resultImage) return;
    const link = document.createElement("a");
    link.href = resultImage;
    link.download = "background-removed.png";
    link.click();
  }

  function reset() {
    setOriginalImage(null);
    setResultImage(null);
    setError("");
  }

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
            Background Remover
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Upload an image and remove its background instantly with AI.
          </p>
        </div>

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
                  or click to browse (PNG, JPG, WebP up to 10MB)
                </p>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>
            </CardContent>
          </Card>
        )}

        {/* Image workspace */}
        {originalImage && (
          <div className="space-y-6">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={reset}>
                <X className="mr-1.5 h-4 w-4" />
                Clear
              </Button>
              <div className="flex gap-2">
                {!resultImage && (
                  <Button onClick={removeBackground} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-1.5 h-4 w-4" />
                        Remove Background
                      </>
                    )}
                  </Button>
                )}
                {resultImage && (
                  <Button onClick={downloadImage}>
                    <Download className="mr-1.5 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>
            </div>

            {/* Images grid */}
            <div className={`grid gap-6 ${resultImage ? "md:grid-cols-2" : "md:grid-cols-1"}`}>
              {/* Original */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Original</CardTitle>
                  <CardDescription>Your uploaded image</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <img
                      src={originalImage}
                      alt="Original"
                      className="h-auto w-full object-contain"
                      style={{ maxHeight: "500px" }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Result */}
              {resultImage && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Result</CardTitle>
                    <CardDescription>Background removed</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800"
                      style={{
                        backgroundImage:
                          "linear-gradient(45deg, #e5e5e5 25%, transparent 25%), linear-gradient(-45deg, #e5e5e5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e5e5 75%), linear-gradient(-45deg, transparent 75%, #e5e5e5 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                      }}
                    >
                      <img
                        src={resultImage}
                        alt="Background removed"
                        className="h-auto w-full object-contain"
                        style={{ maxHeight: "500px" }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Loading overlay state */}
            {loading && (
              <div className="text-center text-sm text-zinc-500">
                This usually takes 5-15 seconds...
              </div>
            )}
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
