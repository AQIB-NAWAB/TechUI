"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  ArrowRight,
  Zap,
  Code2,
  Globe,
  Database,
  BookOpen,
  GraduationCap,
  FileText,
  Bot,
  Building2,
  Terminal,
  Package,
  Copy,
  Check,
  Sparkles,
  Network,
  Cloud,
  Container,
  GitBranch,
  Brain,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { NPM_PACKAGE, getAddCommand, getInitCommand } from "@/lib/techui-cli";

const STATS = [
  { value: "186+", label: "Components" },
  { value: "13", label: "Categories" },
  { value: "1", label: "CLI command to add" },
  { value: "0", label: "Runtime deps locked in" },
];

const USE_CASES = [
  {
    icon: BookOpen,
    title: "Technical documentation",
    desc: "Replace ASCII diagrams and bullet walls with live rate limiters, DNS traces, and JWT decoders readers can actually interact with.",
  },
  {
    icon: GraduationCap,
    title: "Courses & bootcamps",
    desc: "Drop a circuit breaker or CAP theorem card into any lesson. Students click, break things, and learn by doing.",
  },
  {
    icon: FileText,
    title: "Engineering blogs",
    desc: "Explain distributed systems, OAuth, or RAG pipelines with components that animate the concept as you scroll.",
  },
  {
    icon: Bot,
    title: "AI-generated content",
    desc: "Give LLM agents a visual vocabulary — they pick a component ID and your page renders an interactive explainer instead of prose.",
  },
  {
    icon: Building2,
    title: "Internal tools",
    desc: "Onboard new hires with visual runbooks: load balancers, K8s pods, CI pipelines — all in your design system.",
  },
  {
    icon: Sparkles,
    title: "Developer marketing",
    desc: "Product pages that show how your API, auth, or infra actually works — not stock illustrations.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Initialize",
    command: getInitCommand(),
    desc: "Creates techui.json with paths and registry URL. One time per project.",
  },
  {
    step: "02",
    title: "Add components",
    command: getAddCommand("rate-limiter circuit-breaker"),
    desc: "CLI copies source files into src/components/techui/. You own the code.",
  },
  {
    step: "03",
    title: "Import & ship",
    command: 'import { RateLimiter } from "@/components/techui/api/RateLimiter"',
    desc: "Use in any React or Next.js page. Tailwind + Zod props out of the box.",
  },
];

const CATEGORIES = [
  { icon: Globe, label: "API", count: 29 },
  { icon: GitBranch, label: "Architecture", count: 18 },
  { icon: Database, label: "Database", count: 22 },
  { icon: Shield, label: "Auth", count: 15 },
  { icon: Network, label: "Networking", count: 14 },
  { icon: Cloud, label: "Cloud", count: 12 },
  { icon: Container, label: "Containers", count: 10 },
  { icon: Zap, label: "Distributed", count: 24 },
  { icon: Code2, label: "Code", count: 16 },
  { icon: Terminal, label: "Dev Tools", count: 18 },
  { icon: Layers, label: "UI", count: 8 },
  { icon: Brain, label: "AI / ML", count: 12 },
];

const SHOWCASE = [
  {
    id: "rate-limiter",
    name: "Rate Limiter",
    tag: "API",
    image: "/showcase/rate-limiter.png",
    href: "/playground",
  },
  {
    id: "circuit-breaker",
    name: "Circuit Breaker",
    tag: "Distributed",
    image: "/showcase/circuit-breaker.png",
    href: "/playground",
  },
  {
    id: "dns-lookup",
    name: "DNS Lookup",
    tag: "Networking",
    image: "/showcase/dns-lookup.png",
    href: "/playground",
  },
  {
    id: "jwt-flow",
    name: "JWT Auth Flow",
    tag: "Auth",
    image: "/showcase/jwt-flow.png",
    href: "/playground",
  },
  {
    id: "ai-rag",
    name: "RAG Pipeline",
    tag: "AI / ML",
    image: "/showcase/ai-rag.png",
    href: "/playground",
  },
];

function CopyButton({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
        "bg-zinc-800 hover:bg-zinc-700 text-zinc-300",
        className
      )}
    >
      {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-white">
              <Layers className="size-4 text-zinc-950" />
            </div>
            <span className="font-bold tracking-tight">TechUI</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            <a href="#use-cases" className="hover:text-white transition-colors">Use cases</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#showcase" className="hover:text-white transition-colors">Components</a>
            <a
              href={`https://www.npmjs.com/package/${NPM_PACKAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              npm
            </a>
          </nav>
          <Link
            href="/playground"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors"
          >
            Playground <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-28 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-emerald-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: "64px 64px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 mb-8">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {NPM_PACKAGE} · shadcn-style CLI · 186 interactive components
          </div>

          <h1 className="max-w-4xl text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            Engineering concepts,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
              visually obvious
            </span>
          </h1>

          <p className="max-w-2xl text-lg sm:text-xl text-zinc-400 leading-relaxed mb-10">
            Interactive React components for rate limiters, circuit breakers, DNS, JWT, RAG pipelines, and 180+ more.
            Add to any Next.js project with one command — like shadcn, but for teaching software engineering.
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-16">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2.5 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-all hover:scale-[1.02]"
            >
              Explore playground <ArrowRight className="size-4" />
            </Link>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-xs text-zinc-300">
              <Terminal className="size-3.5 text-emerald-400 shrink-0" />
              <span>{getAddCommand("rate-limiter")}</span>
              <CopyButton text={getAddCommand("rate-limiter")} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4 text-center"
              >
                <p className="text-3xl font-bold text-white mb-0.5">{value}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section id="use-cases" className="px-6 py-24 border-t border-white/5 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">Use cases</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Where teams use TechUI
          </h2>
          <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed">
            Anywhere you explain how software works — docs, courses, blogs, onboarding, or AI-generated pages.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl border border-white/8 bg-zinc-950/50 p-6 hover:border-white/15 hover:bg-zinc-900/50 transition-all"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-4 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-colors">
                  <Icon className="size-5 text-zinc-300 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-3">How it works</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Three commands. You own the code.
          </h2>
          <p className="text-zinc-400 max-w-2xl mb-12 leading-relaxed">
            No opaque npm dependency. The CLI copies component source into{" "}
            <code className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded text-sm">src/components/techui/</code>{" "}
            — fully editable, same pattern as shadcn/ui.
          </p>

          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {STEPS.map(({ step, title, command, desc }) => (
              <div
                key={step}
                className="rounded-2xl border border-white/8 bg-zinc-900/40 p-6 flex flex-col"
              >
                <span className="text-4xl font-black text-white/10 mb-4">{step}</span>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-zinc-500 mb-4 flex-1 leading-relaxed">{desc}</p>
                <div className="relative rounded-lg bg-zinc-950 border border-white/8 p-3">
                  <pre className="text-[11px] font-mono text-zinc-300 overflow-x-auto whitespace-pre-wrap break-all">
                    {command}
                  </pre>
                  <CopyButton text={command} className="absolute top-2 right-2" />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-950 p-8">
            <div className="flex items-start gap-4 flex-wrap">
              <Package className="size-8 text-emerald-400 shrink-0 mt-1" />
              <div className="flex-1 min-w-[200px]">
                <h3 className="text-xl font-bold text-white mb-2">Folder structure after install</h3>
                <p className="text-sm text-zinc-400 mb-4">
                  Components stay namespaced under <code className="text-zinc-300">techui/</code> so they never collide with your app code.
                </p>
                <pre className="text-xs font-mono text-zinc-400 leading-relaxed bg-zinc-950 rounded-xl p-4 border border-white/5 overflow-x-auto">
{`your-project/
├── techui.json
└── src/
    ├── components/
    │   └── techui/          ← all TechUI components
    │       ├── api/
    │       │   └── RateLimiter.tsx
    │       ├── distributed/
    │       │   └── CircuitBreaker.tsx
    │       └── networking/
    │           └── DnsLookup.tsx
    └── lib/
        └── utils.ts         ← cn() helper`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="px-6 py-24 border-t border-white/5 bg-zinc-900/30">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-3">Showcase</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Interactive, not illustrative
              </h2>
              <p className="text-zinc-400 mt-3 max-w-xl leading-relaxed">
                Every component has live controls, animations, and plain-English descriptions. Click &quot;Add to project&quot; in the playground for copy-paste CLI instructions.
              </p>
            </div>
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Browse all 186 <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SHOWCASE.map(({ id, name, tag, image }) => (
              <Link
                key={id}
                href="/playground"
                className="group rounded-2xl border border-white/8 bg-zinc-950 overflow-hidden hover:border-white/15 transition-all hover:-translate-y-1"
              >
                <div className="relative aspect-[4/3] bg-[#f4f4f5] overflow-hidden">
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-contain p-4 group-hover:scale-[1.02] transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-t border-white/5">
                  <div>
                    <p className="font-semibold text-white text-sm">{name}</p>
                    <p className="text-[11px] text-zinc-500 font-mono">{id}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 bg-white/5 px-2 py-1 rounded">
                    {tag}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Categories</p>
          <h2 className="text-3xl font-bold tracking-tight mb-10">Every layer of the stack</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CATEGORIES.map(({ icon: Icon, label, count }) => (
              <Link
                key={label}
                href="/playground"
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 hover:border-white/15 hover:bg-white/[0.04] transition-colors"
              >
                <Icon className="size-4 text-zinc-500 shrink-0" />
                <span className="text-sm font-medium text-zinc-300 flex-1">{label}</span>
                <span className="text-xs text-zinc-600">{count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 border-t border-white/5">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Start building visually
          </h2>
          <p className="text-zinc-400 mb-8 leading-relaxed">
            Open the playground, pick a component, hit &quot;Add to project&quot;, and paste the CLI command. Takes 30 seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/playground"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-zinc-950 hover:bg-zinc-100 transition-colors"
            >
              Open playground <ArrowRight className="size-4" />
            </Link>
            <a
              href={`https://www.npmjs.com/package/${NPM_PACKAGE}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-8 py-3.5 text-sm font-medium text-zinc-300 hover:text-white hover:border-white/25 transition-colors"
            >
              <Package className="size-4" /> {NPM_PACKAGE}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <Layers className="size-4" />
            <span>TechUI · MIT License</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/playground" className="hover:text-zinc-300 transition-colors">Playground</Link>
            <a href="https://github.com/AQIB-NAWAB/TechUI" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">GitHub</a>
            <a href={`https://www.npmjs.com/package/${NPM_PACKAGE}`} target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">npm</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
