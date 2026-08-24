"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Table2 } from "lucide-react";

export const DatabaseNormalizationSchema = z.object({
  normalForm: z.enum(["denormalized", "1nf", "2nf", "3nf"]).default("denormalized"),
});

export type DatabaseNormalizationProps = z.infer<typeof DatabaseNormalizationSchema>;

// ── Table helper ──────────────────────────────────────────────────────────────

interface TableDef {
  name: string;
  columns: Array<{ name: string; type: string; highlight?: "pk" | "fk" | "problem" | "new" }>;
  rows: Array<Record<string, string | number>>;
}

function MiniTable({ table, compact }: { table: TableDef; compact?: boolean }) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden text-[10px] font-mono">
      {/* Table name */}
      <div className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 font-bold text-zinc-700 dark:text-zinc-200 border-b border-zinc-200 dark:border-zinc-700">
        {table.name}
      </div>
      {/* Columns */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
        {table.columns.map((col) => (
          <div
            key={col.name}
            className={cn(
              "px-2 py-0.5 border-r border-zinc-200 dark:border-zinc-700 last:border-r-0 flex-1 min-w-0 truncate",
              col.highlight === "pk"      && "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
              col.highlight === "fk"      && "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300",
              col.highlight === "problem" && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
              col.highlight === "new"     && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
              !col.highlight              && "text-zinc-600 dark:text-zinc-400",
            )}
            title={col.name}
          >
            {col.highlight === "pk" && <span className="mr-0.5">🔑</span>}
            {col.highlight === "fk" && <span className="mr-0.5">🔗</span>}
            {col.name}
          </div>
        ))}
      </div>
      {/* Rows */}
      {!compact && table.rows.map((row, ri) => (
        <div key={ri} className="flex border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
          {table.columns.map((col) => {
            const val = String(row[col.name] ?? "");
            return (
              <div
                key={col.name}
                className={cn(
                  "px-2 py-0.5 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 flex-1 min-w-0 truncate text-zinc-600 dark:text-zinc-400",
                  col.highlight === "problem" && "bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-300"
                )}
                title={val}
              >
                {val}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Data definitions ──────────────────────────────────────────────────────────

const DENORMALIZED: TableDef = {
  name: "orders (denormalized)",
  columns: [
    { name: "OrderID", type: "int", highlight: "pk" },
    { name: "CustomerName", type: "varchar", highlight: "problem" },
    { name: "CustomerEmail", type: "varchar", highlight: "problem" },
    { name: "Product", type: "varchar", highlight: "problem" },
    { name: "Category", type: "varchar", highlight: "problem" },
    { name: "Supplier", type: "varchar", highlight: "problem" },
  ],
  rows: [
    { OrderID: 1001, CustomerName: "Alice", CustomerEmail: "alice@ex.com", Product: "Apple", Category: "Fruit", Supplier: "FarmCo" },
    { OrderID: 1002, CustomerName: "Bob",   CustomerEmail: "bob@ex.com",   Product: "Apple", Category: "Fruit", Supplier: "FarmCo" },
    { OrderID: 1003, CustomerName: "Alice", CustomerEmail: "alice@ex.com", Product: "Banana", Category: "Fruit", Supplier: "TropCo" },
  ],
};

const NF1_BEFORE: TableDef = {
  name: "contacts (before 1NF)",
  columns: [
    { name: "ID", type: "int", highlight: "pk" },
    { name: "Name", type: "varchar" },
    { name: "Tags", type: "varchar", highlight: "problem" },
  ],
  rows: [
    { ID: 1, Name: "Alice", Tags: "apple, fruit, fresh" },
    { ID: 2, Name: "Bob",   Tags: "banana, tropical" },
  ],
};

const NF1_AFTER: TableDef = {
  name: "contacts_tags (after 1NF — atomic)",
  columns: [
    { name: "ID", type: "int", highlight: "pk" },
    { name: "Name", type: "varchar" },
    { name: "Tag", type: "varchar", highlight: "new" },
  ],
  rows: [
    { ID: 1, Name: "Alice", Tag: "apple" },
    { ID: 1, Name: "Alice", Tag: "fruit" },
    { ID: 1, Name: "Alice", Tag: "fresh" },
    { ID: 2, Name: "Bob",   Tag: "banana" },
    { ID: 2, Name: "Bob",   Tag: "tropical" },
  ],
};

const NF2_ORDERS: TableDef = {
  name: "orders",
  columns: [
    { name: "OrderID", type: "int", highlight: "pk" },
    { name: "CustomerID", type: "int", highlight: "fk" },
    { name: "ProductID",  type: "int", highlight: "fk" },
    { name: "Qty", type: "int" },
  ],
  rows: [
    { OrderID: 1001, CustomerID: 1, ProductID: 10, Qty: 2 },
    { OrderID: 1002, CustomerID: 2, ProductID: 10, Qty: 1 },
    { OrderID: 1003, CustomerID: 1, ProductID: 11, Qty: 3 },
  ],
};

const NF2_PRODUCTS: TableDef = {
  name: "products",
  columns: [
    { name: "ProductID", type: "int", highlight: "pk" },
    { name: "Name", type: "varchar" },
    { name: "Category", type: "varchar", highlight: "problem" },
    { name: "SupplierID", type: "int", highlight: "fk" },
  ],
  rows: [
    { ProductID: 10, Name: "Apple",  Category: "Fruit", SupplierID: 100 },
    { ProductID: 11, Name: "Banana", Category: "Fruit", SupplierID: 101 },
  ],
};

const NF2_CUSTOMERS: TableDef = {
  name: "customers",
  columns: [
    { name: "CustomerID", type: "int", highlight: "pk" },
    { name: "Name", type: "varchar" },
    { name: "Email", type: "varchar" },
  ],
  rows: [
    { CustomerID: 1, Name: "Alice", Email: "alice@ex.com" },
    { CustomerID: 2, Name: "Bob",   Email: "bob@ex.com" },
  ],
};

const NF3_ORDERS: TableDef = {
  name: "orders",
  columns: [
    { name: "OrderID", type: "int", highlight: "pk" },
    { name: "CustomerID", type: "int", highlight: "fk" },
    { name: "ProductID", type: "int", highlight: "fk" },
    { name: "Qty", type: "int" },
  ],
  rows: [
    { OrderID: 1001, CustomerID: 1, ProductID: 10, Qty: 2 },
    { OrderID: 1002, CustomerID: 2, ProductID: 10, Qty: 1 },
  ],
};

const NF3_PRODUCTS: TableDef = {
  name: "products",
  columns: [
    { name: "ProductID", type: "int", highlight: "pk" },
    { name: "Name", type: "varchar" },
    { name: "CategoryID", type: "int", highlight: "fk" },
    { name: "SupplierID", type: "int", highlight: "fk" },
  ],
  rows: [
    { ProductID: 10, Name: "Apple",  CategoryID: 1, SupplierID: 100 },
    { ProductID: 11, Name: "Banana", CategoryID: 1, SupplierID: 101 },
  ],
};

const NF3_CATEGORIES: TableDef = {
  name: "categories",
  columns: [
    { name: "CategoryID", type: "int", highlight: "pk" },
    { name: "Name", type: "varchar", highlight: "new" },
  ],
  rows: [
    { CategoryID: 1, Name: "Fruit" },
    { CategoryID: 2, Name: "Vegetable" },
  ],
};

const NF3_SUPPLIERS: TableDef = {
  name: "suppliers",
  columns: [
    { name: "SupplierID", type: "int", highlight: "pk" },
    { name: "Name", type: "varchar", highlight: "new" },
  ],
  rows: [
    { SupplierID: 100, Name: "FarmCo" },
    { SupplierID: 101, Name: "TropCo" },
  ],
};

// ── Problem / fix badges ──────────────────────────────────────────────────────

function IssueBadge({ type, label }: { type: "problem" | "fix"; label: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold",
      type === "problem"
        ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
    )}>
      {type === "problem" ? "✗" : "✓"} {label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DatabaseNormalization({ normalForm = "denormalized" }: DatabaseNormalizationProps) {
  const [tab, setTab] = useState<"denormalized" | "1nf" | "2nf" | "3nf">(normalForm);

  const tabs = [
    { id: "denormalized" as const, label: "Raw" },
    { id: "1nf"          as const, label: "1NF" },
    { id: "2nf"          as const, label: "2NF" },
    { id: "3nf"          as const, label: "3NF" },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <Table2 className="size-4 text-blue-500 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">DB Normalization</span>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-2 py-1 rounded text-[11px] font-semibold transition-all duration-500",
                tab === t.id
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        Split wide tables into smaller ones to eliminate duplicate data and update anomalies.
      </p>

      <div className="min-h-[220px] px-4 pt-3 pb-3 flex flex-col gap-3">

        {/* ── Denormalized ── */}
        {tab === "denormalized" && (
          <>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
              All data in one table — 🔴 highlighted columns have problems
            </div>
            <MiniTable table={DENORMALIZED} />
            <div className="flex flex-wrap gap-1.5 mt-1">
              <IssueBadge type="problem" label="Update anomaly: change Alice's email → must update 2 rows" />
              <IssueBadge type="problem" label="Delete anomaly: delete last Apple order → lose FarmCo supplier" />
              <IssueBadge type="problem" label="Insert anomaly: can't add supplier without an order" />
              <IssueBadge type="problem" label="Data duplication: Apple + FarmCo repeated" />
            </div>
          </>
        )}

        {/* ── 1NF ── */}
        {tab === "1nf" && (
          <>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
              1NF: No repeating groups — each cell must be atomic (single value)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-red-600 dark:text-red-400 font-semibold mb-1">Before — multi-valued column</div>
                <MiniTable table={NF1_BEFORE} />
              </div>
              <div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mb-1">After — atomic values (split rows)</div>
                <MiniTable table={NF1_AFTER} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <IssueBadge type="fix" label="No multi-value cells (Tags split into rows)" />
              <IssueBadge type="fix" label="Each row uniquely identifiable" />
              <IssueBadge type="problem" label="Still has partial dependencies — needs 2NF" />
            </div>
          </>
        )}

        {/* ── 2NF ── */}
        {tab === "2nf" && (
          <>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
              2NF: Remove partial dependencies — non-key columns must depend on the <em>whole</em> primary key
            </div>
            <div className="grid grid-cols-1 gap-2">
              <MiniTable table={NF2_ORDERS} />
              <div className="grid grid-cols-2 gap-2">
                <MiniTable table={NF2_CUSTOMERS} />
                <MiniTable table={NF2_PRODUCTS} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <IssueBadge type="fix" label="Customer info moved to customers table" />
              <IssueBadge type="fix" label="Product info moved to products table" />
              <IssueBadge type="problem" label="Category still depends on SupplierID — transitive dep → needs 3NF" />
            </div>
          </>
        )}

        {/* ── 3NF ── */}
        {tab === "3nf" && (
          <>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">
              3NF: Remove transitive dependencies — non-key columns must depend only on the primary key
            </div>
            <div className="flex flex-col gap-2">
              <MiniTable table={NF3_ORDERS} />
              <div className="grid grid-cols-2 gap-2">
                <MiniTable table={NF3_PRODUCTS} />
                <div className="flex flex-col gap-2">
                  <MiniTable table={NF3_CATEGORIES} compact />
                  <MiniTable table={NF3_SUPPLIERS} compact />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <IssueBadge type="fix" label="Category → categories table" />
              <IssueBadge type="fix" label="Supplier → suppliers table" />
              <IssueBadge type="fix" label="No update/delete/insert anomalies" />
              <IssueBadge type="fix" label="Data stored once, referenced everywhere" />
            </div>
          </>
        )}

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg px-3 py-2 mt-auto">
          {tab === "denormalized" && <>Raw data has duplication and anomalies. Every update risks inconsistency — one row says &quot;alice@old.com&quot;, another says &quot;alice@new.com&quot;.</>}
          {tab === "1nf" && <><strong className="text-zinc-600 dark:text-zinc-300">1NF:</strong> Atomic values mean no comma-separated lists, no arrays, no nested groups. Each cell = one value.</>}
          {tab === "2nf" && <><strong className="text-zinc-600 dark:text-zinc-300">2NF:</strong> Partial dependency = column depends on part of composite key. Fix: extract into its own table with full PK.</>}
          {tab === "3nf" && <><strong className="text-zinc-600 dark:text-zinc-300">Normalization eliminates redundancy</strong> — data stored once, referenced everywhere. Update in one place, reflects everywhere.</>}
        </div>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1">
          {tab === "denormalized" && "Raw table — duplication causes update/delete/insert anomalies"}
          {tab === "1nf" && "1NF — each cell holds a single atomic value"}
          {tab === "2nf" && "2NF — non-key columns depend on the whole primary key"}
          {tab === "3nf" && "3NF — no transitive dependencies between non-key columns"}
        </span>
        <button
          onClick={() => {
            const order = ["denormalized", "1nf", "2nf", "3nf"] as const;
            const idx = order.indexOf(tab);
            setTab(order[(idx + 1) % order.length]!);
          }}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500"
        >
          Next Form
        </button>
      </div>
    </div>
  );
}
