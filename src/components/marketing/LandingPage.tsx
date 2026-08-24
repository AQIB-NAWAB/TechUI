"use client";

import Link from "next/link";
import Image from "next/image";
import { Layers, ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { NPM_PACKAGE, getAddCommand, getInitCommand, getAddUtilsCommand } from "@/lib/techui-cli";

const SHOWCASE = [
  { id: "rate-limiter", name: "Rate Limiter", image: "/showcase/rate-limiter.png" },
  { id: "circuit-breaker", name: "Circuit Breaker", image: "/showcase/circuit-breaker.png" },
  { id: "dns-lookup", name: "DNS Lookup", image: "/showcase/dns-lookup.png" },
  { id: "jwt-flow", name: "JWT Auth Flow", image: "/showcase/jwt-flow.png" },
  { id: "ai-rag", name: "RAG Pipeline", image: "/showcase/ai-rag.png" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900"
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function LandingPage() {
  const installBlock = `${getInitCommand()}
${getAddUtilsCommand()}
${getAddCommand("rate-limiter")}`;

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <header className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-zinc-900">
              <Layers className="size-3.5 text-white" />
            </div>
            <span className="font-semibold">TechUI</span>
          </Link>
          <nav className="ml-auto flex items-center gap-5 text-sm text-zinc-600">
            <a
              href={`https://www.npmjs.com/package/${NPM_PACKAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900"
            >
              npm
            </a>
            <a
              href="https://github.com/AQIB-NAWAB/TechUI"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900"
            >
              GitHub
            </a>
            <Link
              href="/playground"
              className="inline-flex items-center gap-1.5 font-medium text-zinc-900 hover:underline underline-offset-4"
            >
              Playground <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6">
        <section className="py-16 sm:py-20 border-b border-zinc-200">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight text-zinc-950 mb-5">
            Interactive components for explaining how software works.
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed mb-8 max-w-2xl">
            Rate limiters, circuit breakers, DNS lookups, JWT flows, and 180+ more.
            Copy the source into your Next.js app with a CLI — same idea as shadcn/ui.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Open playground
            </Link>
            <a
              href={`https://www.npmjs.com/package/${NPM_PACKAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              {NPM_PACKAGE}
            </a>
          </div>
        </section>

        <section className="py-14 border-b border-zinc-200">
          <h2 className="text-lg font-semibold mb-2">Install</h2>
          <p className="text-sm text-zinc-600 mb-4 leading-relaxed">
            Run these in your project. Files land in{" "}
            <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">src/components/techui/</code>.
            In the playground, each component has an <strong>Add to project</strong> button with the exact command.
          </p>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 bg-white">
              <span className="text-xs text-zinc-500">terminal</span>
              <CopyButton text={installBlock} />
            </div>
            <pre className="p-4 text-sm font-mono text-zinc-800 leading-relaxed overflow-x-auto">
              {installBlock}
            </pre>
          </div>
        </section>

        <section className="py-14 border-b border-zinc-200">
          <h2 className="text-lg font-semibold mb-2">Good for</h2>
          <ul className="space-y-3 text-sm text-zinc-600 leading-relaxed">
            <li>Docs and internal wikis where a diagram is not enough</li>
            <li>Course material — students can click through the concept</li>
            <li>Blog posts about APIs, auth, networking, or distributed systems</li>
            <li>Onboarding pages for new engineers on your team</li>
          </ul>
        </section>

        <section className="py-14 border-b border-zinc-200">
          <div className="flex items-baseline justify-between gap-4 mb-8">
            <h2 className="text-lg font-semibold">Some components</h2>
            <Link href="/playground" className="text-sm text-zinc-600 hover:text-zinc-900 shrink-0">
              View all →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {SHOWCASE.map(({ id, name, image }) => (
              <Link
                key={id}
                href="/playground"
                className="rounded-lg border border-zinc-200 overflow-hidden hover:border-zinc-400 transition-colors"
              >
                <div className="relative aspect-[5/3] bg-zinc-100">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-contain p-3"
                    sizes="(max-width: 640px) 100vw, 384px"
                  />
                </div>
                <div className="px-3 py-2.5 border-t border-zinc-200 bg-white">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">{id}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="py-14">
          <p className="text-sm text-zinc-600 leading-relaxed">
            186 components across API, architecture, database, auth, networking, cloud, containers,
            distributed systems, code tools, devtools, UI, and AI. MIT licensed.
          </p>
        </section>
      </main>

      <footer className="border-t border-zinc-200 py-6">
        <div className="mx-auto max-w-3xl px-6 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
          <span>TechUI</span>
          <div className="flex gap-4">
            <Link href="/playground" className="hover:text-zinc-800">Playground</Link>
            <a href="https://github.com/AQIB-NAWAB/TechUI" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-800">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
