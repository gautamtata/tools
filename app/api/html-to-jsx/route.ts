import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { htmlToJsx } from "@/lib/html-to-jsx";

export async function POST(request: Request) {
  const { html, css } = await request.json();

  if (!html || !html.trim()) {
    return NextResponse.json({ error: "HTML input is required" }, { status: 400 });
  }

  // Step 1: Rule-based HTML → JSX conversion
  const jsx = htmlToJsx(html);

  // Step 2: If CSS provided, use Claude to merge CSS into Tailwind classes
  if (css && css.trim()) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `Convert the following JSX + CSS into JSX that uses Tailwind CSS utility classes instead.

Rules:
- Replace all CSS styles with equivalent Tailwind classes in className attributes
- If there are existing className values, merge the Tailwind classes into them
- Remove any class names that were only defined in the CSS (since they'll be replaced by Tailwind)
- Use modern Tailwind v4 classes
- Output ONLY the final JSX code, no explanations, no markdown fences, no extra text
- Preserve the exact JSX structure and content
- If a CSS property has no direct Tailwind equivalent, use arbitrary value syntax like \`[property:value]\`

JSX:
${jsx}

CSS:
${css}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const result = textBlock ? textBlock.text.trim() : jsx;

    // Strip markdown code fences if Claude included them despite instructions
    const cleaned = result
      .replace(/^```(?:jsx|tsx|html)?\n?/, "")
      .replace(/\n?```$/, "");

    return NextResponse.json({ jsx: cleaned });
  }

  return NextResponse.json({ jsx });
}
