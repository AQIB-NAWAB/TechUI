"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Database, RotateCcw, FileText } from "lucide-react";

export const WalWriteAheadLogSchema = z.object({
  title: z.string().optional().default("Write-Ahead Log (WAL)"),
  tableName: z.string().optional().default("accounts"),
  interactive: z.boolean().optional().default(true),
});

export type WalWriteAheadLogProps = z.infer<typeof WalWriteAheadLogSchema>;

type WalEntry = {
  id: number;
  op: string;
  detail: string;
  committed: boolean;
};

type DbRow = { id: number; name: string; balance: number };

const TX_PRESETS = [
  { op: "UPDATE", detail: "SET balance = 900 WHERE id = 1", row: { id: 1, name: "Alice", balance: 900 } },
  { op: "INSERT", detail: "INTO accounts (id, name, balance) VALUES (3, 'Carol', 500)", row: { id: 3, name: "Carol", balance: 500 } },
  { op: "UPDATE", detail: "SET balance = 1150 WHERE id = 2", row: { id: 2, name: "Bob", balance: 1150 } },
  { op: "DELETE", detail: "FROM accounts WHERE id = 3", row: null as DbRow | null },
];

let _txId = 0;

export function WalWriteAheadLog({
  title = "Write-Ahead Log (WAL)",
  tableName = "accounts",
  interactive = true,
}: WalWriteAheadLogProps) {
  const [wal, setWal] = useState<WalEntry[]>([]);
  const [rows, setRows] = useState<DbRow[]>([
    { id: 1, name: "Alice", balance: 1000 },
    { id: 2, name: "Bob", balance: 750 },
  ]);
  const [phase, setPhase] = useState<"idle" | "wal-write" | "db-apply" | "done">("idle");
  const [txIdx, setTxIdx] = useState(0);
  const [status, setStatus] = useState("Commit a transaction — WAL is written before the database changes.");
  const [crashed, setCrashed] = useState(false);

  async function commitTransaction() {
    if (phase !== "idle" || txIdx >= TX_PRESETS.length) return;
    const tx = TX_PRESETS[txIdx];
    const id = ++_txId;

    setPhase("wal-write");
    setStatus(`Step 1: Append ${tx.op} to WAL before touching ${tableName}…`);
    const entry: WalEntry = { id, op: tx.op, detail: tx.detail, committed: false };
    setWal((prev) => [...prev, entry]);

    await new Promise((r) => setTimeout(r, 1200));

    setPhase("db-apply");
    setStatus(`Step 2: Apply change to ${tableName} table…`);

    await new Promise((r) => setTimeout(r, 1200));

    setWal((prev) => prev.map((e) => (e.id === id ? { ...e, committed: true } : e)));
    if (tx.op === "UPDATE" && tx.row) {
      setRows((prev) => prev.map((r) => (r.id === tx.row!.id ? tx.row! : r)));
    } else if (tx.op === "INSERT" && tx.row) {
      setRows((prev) => [...prev, tx.row!]);
    } else if (tx.op === "DELETE") {
      setRows((prev) => prev.filter((r) => r.id !== 3));
    }

    setTxIdx((i) => i + 1);
    setPhase("done");
    setStatus(`Committed — WAL entry marked durable, ${tableName} updated.`);
    setTimeout(() => setPhase("idle"), 800);
  }

  async function simulateCrash() {
    if (phase !== "idle") return;
    setCrashed(true);
    setStatus("Crash! Database lost in-memory state — replaying WAL to recover…");
    setRows([
      { id: 1, name: "Alice", balance: 1000 },
      { id: 2, name: "Bob", balance: 750 },
    ]);

    await new Promise((r) => setTimeout(r, 1200));

    const committed = wal.filter((e) => e.committed);
    let recovered: DbRow[] = [
      { id: 1, name: "Alice", balance: 1000 },
      { id: 2, name: "Bob", balance: 750 },
    ];
    for (const entry of committed) {
      const tx = TX_PRESETS.find((t) => t.detail === entry.detail);
      if (!tx) continue;
      if (entry.op === "UPDATE" && tx.row) {
        recovered = recovered.map((r) => (r.id === tx.row!.id ? tx.row! : r));
      } else if (entry.op === "INSERT" && tx.row) {
        if (!recovered.find((r) => r.id === tx.row!.id)) recovered = [...recovered, tx.row!];
      } else if (entry.op === "DELETE") {
        recovered = recovered.filter((r) => r.id !== 3);
      }
    }
    setRows(recovered);
    setStatus(`Recovered ${committed.length} committed transaction${committed.length !== 1 ? "s" : ""} from WAL.`);
    setTimeout(() => setCrashed(false), 1500);
  }

  function reset() {
    setWal([]);
    setRows([
      { id: 1, name: "Alice", balance: 1000 },
      { id: 2, name: "Bob", balance: 750 },
    ]);
    setPhase("idle");
    setTxIdx(0);
    setStatus("Commit a transaction — WAL is written before the database changes.");
    setCrashed(false);
    _txId = 0;
  }

  const allDone = txIdx >= TX_PRESETS.length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Database className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">{title}</span>
        <span
          className={cn(
            "text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all duration-500",
            phase === "wal-write"
              ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
              : phase === "db-apply"
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400"
              : crashed
              ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}
        >
          {phase === "wal-write" ? "Writing WAL" : phase === "db-apply" ? "Applying" : crashed ? "Recovering" : "Ready"}
        </span>
        {interactive && (
          <button
            type="button"
            onClick={simulateCrash}
            disabled={phase !== "idle" || wal.length === 0}
            className="text-[10px] font-semibold px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 transition-all duration-500"
            title="Simulate crash and WAL recovery"
          >
            Simulate Crash
          </button>
        )}
        {interactive && (
          <button type="button" onClick={reset} className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-500">
            <RotateCcw className="size-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        The write-ahead log (WAL) records every change on disk before updating tables — after a crash, the database replays the log to recover committed work.
      </p>

      <div className="min-h-[260px] px-4 pt-3 pb-2 grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <FileText className="size-3.5 text-amber-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">WAL (disk)</span>
          </div>
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/50 min-h-[160px] flex flex-col gap-1">
            {wal.length === 0 && (
              <span className="text-xs text-zinc-400 italic pt-2">Empty — no transactions logged yet</span>
            )}
            {wal.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "rounded-lg border px-2 py-1.5 font-mono text-[10px] transition-all duration-500",
                  entry.committed
                    ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                    : phase === "wal-write" && entry.id === wal[wal.length - 1]?.id
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 ring-2 ring-amber-400"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400"
                )}
              >
                <span className="font-bold">{entry.op}</span> {entry.detail}
                {entry.committed && <span className="ml-1 text-emerald-600">✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Database className="size-3.5 text-blue-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{tableName}</span>
          </div>
          <div className="border border-zinc-100 dark:border-zinc-800 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-800/50 min-h-[160px]">
            <div className="grid grid-cols-3 gap-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-400 mb-1.5 px-1">
              <span>id</span>
              <span>name</span>
              <span>balance</span>
            </div>
            <div className="space-y-1 min-h-[120px]">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={cn(
                    "grid grid-cols-3 gap-1 rounded px-1 py-1 font-mono text-[10px] transition-all duration-500",
                    phase === "db-apply" ? "bg-blue-50 dark:bg-blue-950/30" : "bg-white dark:bg-zinc-900"
                  )}
                >
                  <span className="text-zinc-500">{row.id}</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{row.name}</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{row.balance}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {interactive && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30 min-h-[52px]">
          <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">{status}</span>
          <button
            type="button"
            onClick={commitTransaction}
            disabled={phase !== "idle" || allDone}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 disabled:opacity-40 shrink-0"
          >
            {phase !== "idle" ? "Committing…" : allDone ? "All Done" : "Commit Transaction"}
          </button>
        </div>
      )}
    </div>
  );
}
