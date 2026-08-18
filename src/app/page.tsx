import Link from "next/link";
import { Layers, ArrowRight, Zap, Code2, Globe, Database } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      <header className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-900 flex items-center gap-3">
        <div className="size-7 rounded-lg bg-zinc-950 dark:bg-white flex items-center justify-center">
          <Layers className="size-4 text-white dark:text-zinc-950" />
        </div>
        <span className="font-bold text-zinc-900 dark:text-zinc-100">TechUI</span>
        <nav className="ml-auto flex items-center gap-6">
          <Link
            href="/playground"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Open Playground <ArrowRight className="size-3.5" />
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 mb-8">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Visual components for technical content
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100 mb-6 leading-tight">
            Make technical content
            <br />
            <span className="text-zinc-400">actually visual</span>
          </h1>

          <p className="text-lg text-zinc-500 dark:text-zinc-400 mb-10 max-w-lg mx-auto leading-relaxed">
            A component library for AI-generated technical content. Replace walls of text with interactive, visual representations of APIs, architecture, databases, and more.
          </p>

          <Link
            href="/playground"
            className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors"
          >
            Explore Components <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-3xl w-full">
          {[
            { icon: Globe, label: "API Components", desc: "Request, response, status codes" },
            { icon: Zap, label: "Architecture", desc: "Diagrams, nodes, connections" },
            { icon: Database, label: "Database", desc: "Tables, schemas, queries" },
            { icon: Code2, label: "Dev Tools", desc: "Terminal, JWT, queues" },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-3 p-5 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 text-center"
            >
              <div className="size-9 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <Icon className="size-4 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
