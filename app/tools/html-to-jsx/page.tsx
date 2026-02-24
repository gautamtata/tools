"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Copy, Check, Loader2 } from "lucide-react";

export default function HtmlToJsxPage() {
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleConvert() {
    if (!html.trim()) {
      setError("Please enter some HTML.");
      return;
    }

    setLoading(true);
    setError("");
    setOutput("");

    try {
      const res = await fetch("/api/html-to-jsx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, css }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Conversion failed");
      }
      setOutput(data.jsx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-7xl px-6 py-10">
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
            HTML to JSX Converter
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            Paste HTML and optional CSS to get JSX with Tailwind classes.
          </p>
        </div>

        {/* Input panels */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* HTML Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-orange-100 text-xs font-bold text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                  {"<>"}
                </span>
                HTML
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder={`<div class="container">\n  <h1>Hello World</h1>\n  <p>Some text here</p>\n</div>`}
                className="h-64 w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                spellCheck={false}
              />
            </CardContent>
          </Card>

          {/* CSS Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {"{ }"}
                </span>
                CSS
                <span className="text-xs font-normal text-zinc-400">(optional — enables Tailwind conversion)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={css}
                onChange={(e) => setCss(e.target.value)}
                placeholder={`.container {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 2rem;\n}\n\nh1 {\n  font-size: 2rem;\n  font-weight: bold;\n}`}
                className="h-64 w-full resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
                spellCheck={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Convert button */}
        <div className="my-6 flex justify-center">
          <Button
            onClick={handleConvert}
            disabled={loading || !html.trim()}
            size="lg"
            className="min-w-48"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {css.trim() ? "Converting with AI..." : "Converting..."}
              </>
            ) : (
              <>
                Convert
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Output */}
        {output && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-green-100 text-xs font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                    JSX
                  </span>
                  Output
                  {css.trim() && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      + Tailwind
                    </span>
                  )}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="max-h-96 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <code>{output}</code>
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
