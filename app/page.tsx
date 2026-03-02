"use client";

import { useState } from "react";
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
import { Lock } from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setError("");
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated) {
    return <ToolsPage />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <Lock className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Enter password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Checking..." : "Unlock"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const tools = [
  {
    title: "Background Image Remover",
    description: "Remove backgrounds from images instantly using AI.",
    href: "/tools/bg-remover",
    icon: "🖼️",
  },
  {
    title: "HTML to JSX",
    description: "Convert HTML markup to valid JSX code.",
    href: "/tools/html-to-jsx",
    icon: "🔄",
  },
  {
    title: "Image Converter",
    description: "Convert between HEIC, PNG, JPG, WebP and resize images to fit upload limits.",
    href: "/tools/image-converter",
    icon: "🖼️",
  },
];

function ToolsPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tools
        </h1>
        <p className="mb-8 text-zinc-500 dark:text-zinc-400">
          A collection of useful developer tools.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <a key={tool.href} href={tool.href}>
              <Card className="h-full transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <CardHeader>
                  <div className="mb-2 text-3xl">{tool.icon}</div>
                  <CardTitle>{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
