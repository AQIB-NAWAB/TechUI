"use client";

import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { HardDrive, Image, Video, FileText, Database, Archive, Globe, Lock, Copy, Check, ChevronDown, ChevronRight } from "lucide-react";

const ObjectSchema = z.object({
  key: z.string(),
  size: z.string(),
  type: z.enum(["image", "video", "doc", "data", "archive"]),
  public: z.boolean(),
});

export const BlobStorageSchema = z.object({
  provider: z.enum(["s3", "gcs", "azure"]).default("s3"),
  bucketName: z.string().default("freshmarket-assets"),
  objects: z.array(ObjectSchema).default([
    { key: "products/apple.jpg",        size: "284 KB", type: "image",   public: true  },
    { key: "products/banana.jpg",       size: "191 KB", type: "image",   public: true  },
    { key: "invoices/inv-2024-001.pdf", size: "43 KB",  type: "doc",     public: false },
    { key: "exports/orders-2024.csv",   size: "2.1 MB", type: "data",    public: false },
    { key: "videos/demo.mp4",           size: "48 MB",  type: "video",   public: true  },
  ]),
});

export type BlobStorageProps = z.infer<typeof BlobStorageSchema>;

type ExpiryOption = "15m" | "1h" | "24h";

const EXPIRY_SECONDS: Record<ExpiryOption, number> = {
  "15m": 900,
  "1h":  3600,
  "24h": 86400,
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  image:   Image,
  video:   Video,
  doc:     FileText,
  data:    Database,
  archive: Archive,
};

const TYPE_COLORS: Record<string, string> = {
  image:   "text-blue-500",
  video:   "text-violet-500",
  doc:     "text-amber-500",
  data:    "text-emerald-500",
  archive: "text-orange-500",
};

function getPublicUrl(provider: string, bucketName: string, key: string): string {
  if (provider === "s3")    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  if (provider === "gcs")   return `https://storage.googleapis.com/${bucketName}/${key}`;
  if (provider === "azure") return `https://${bucketName}.blob.core.windows.net/assets/${key}`;
  return `https://${bucketName}.example.com/${key}`;
}

function getPresignedUrl(provider: string, bucketName: string, key: string, expiry: ExpiryOption): string {
  const expires = EXPIRY_SECONDS[expiry];
  const sig = "a8f3b2c1d4e5f6a7b8c9d0e1f2a3b4c5";
  const date = "20260823T120000Z";
  const cred = "AKIAIOSFODNN7EXAMPLE";

  if (provider === "s3") {
    return `https://${bucketName}.s3.amazonaws.com/${key}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${cred}%2F20260823%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=${date}&X-Amz-Expires=${expires}&X-Amz-Signature=${sig.slice(0, 16)}...`;
  }
  if (provider === "gcs") {
    return `https://storage.googleapis.com/${bucketName}/${key}?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=service%40project.iam.gserviceaccount.com&X-Goog-Date=${date}&X-Goog-Expires=${expires}&X-Goog-Signature=${sig.slice(0, 16)}...`;
  }
  return `https://${bucketName}.blob.core.windows.net/assets/${key}?sv=2024-01-01&se=2026-08-23T13%3A00%3A00Z&sr=b&sp=r&spr=https&sig=${sig.slice(0, 16)}...`;
}

const PROVIDER_LABELS: Record<string, string> = { s3: "AWS S3", gcs: "Google Cloud Storage", azure: "Azure Blob" };

export function BlobStorage({
  provider: initialProvider = "s3",
  bucketName = "freshmarket-assets",
  objects = [
    { key: "products/apple.jpg",        size: "284 KB", type: "image" as const,   public: true  },
    { key: "products/banana.jpg",       size: "191 KB", type: "image" as const,   public: true  },
    { key: "invoices/inv-2024-001.pdf", size: "43 KB",  type: "doc" as const,     public: false },
    { key: "exports/orders-2024.csv",   size: "2.1 MB", type: "data" as const,    public: false },
    { key: "videos/demo.mp4",           size: "48 MB",  type: "video" as const,   public: true  },
  ],
}: BlobStorageProps) {
  const [provider, setProvider] = useState(initialProvider);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<ExpiryOption>("15m");
  const [presignedVisible, setPresignedVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectedObj = objects.find((o) => o.key === selectedKey);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const urlToShow = selectedObj
    ? selectedObj.public
      ? getPublicUrl(provider, bucketName, selectedObj.key)
      : presignedVisible
        ? getPresignedUrl(provider, bucketName, selectedObj.key, expiry)
        : null
    : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <HardDrive className="size-4 text-zinc-400 shrink-0" />
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex-1">Blob Storage</span>
        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]">
          {PROVIDER_LABELS[provider]}: {bucketName}
        </span>
      </div>

      {/* Provider tabs */}
      <div className="px-4 pt-3 pb-2 flex gap-1.5">
        {(["s3", "gcs", "azure"] as const).map((p) => (
          <button
            key={p}
            onClick={() => { setProvider(p); setPresignedVisible(false); }}
            className={cn(
              "px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all duration-500 cursor-pointer uppercase",
              provider === p
                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400"
            )}
          >
            {p === "s3" ? "S3" : p === "gcs" ? "GCS" : "Azure"}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Store files in the cloud. Public objects have a permanent URL; private objects need a time-limited presigned link.
        </p>
      </div>

      {/* Object list */}
      <div className="min-h-[280px] px-4 pb-4 pt-3 space-y-1">
        {objects.map((obj) => {
          const IconComp = TYPE_ICONS[obj.type] ?? FileText;
          const iconColor = TYPE_COLORS[obj.type] ?? "text-zinc-400";
          const isSelected = selectedKey === obj.key;

          return (
            <div key={obj.key} className="rounded-lg overflow-hidden border border-transparent transition-all duration-500">
              <button
                onClick={() => {
                  setSelectedKey(isSelected ? null : obj.key);
                  setPresignedVisible(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-500 cursor-pointer",
                  isSelected
                    ? "bg-zinc-100 dark:bg-zinc-800 ring-1 ring-zinc-300 dark:ring-zinc-600"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                )}
              >
                <IconComp className={cn("size-4 shrink-0", iconColor)} />
                <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 flex-1 truncate">{obj.key}</span>
                <span className="text-[10px] font-mono text-zinc-400 shrink-0">{obj.size}</span>
                <span className={cn(
                  "flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                  obj.public
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                )}>
                  {obj.public ? <Globe className="size-3" /> : <Lock className="size-3" />}
                  {obj.public ? "Public" : "Private"}
                </span>
                {isSelected ? <ChevronDown className="size-3.5 text-zinc-400 shrink-0" /> : <ChevronRight className="size-3.5 text-zinc-400 shrink-0" />}
              </button>

              {/* Expanded detail — always reserve space when selected */}
              <div className={cn(
                "overflow-hidden transition-all duration-500",
                isSelected ? "max-h-[140px] opacity-100" : "max-h-0 opacity-0"
              )}>
              {isSelected && selectedObj && (
                <div className="px-3 pb-3 pt-1 space-y-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-b-lg border-t border-zinc-100 dark:border-zinc-800">
                  {selectedObj.public ? (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-1">Public URL</div>
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 break-all flex-1 bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1.5 border border-blue-100 dark:border-blue-900">
                          {getPublicUrl(provider, bucketName, selectedObj.key)}
                        </span>
                        <button
                          onClick={() => handleCopy(getPublicUrl(provider, bucketName, selectedObj.key))}
                          className="shrink-0 p-1.5 rounded border border-zinc-200 dark:border-zinc-700 hover:opacity-80 transition-opacity"
                        >
                          {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 text-zinc-400" />}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wide text-zinc-400 mb-1.5">Generate Presigned URL</div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-zinc-500">Expires in:</span>
                        {(["15m", "1h", "24h"] as ExpiryOption[]).map((e) => (
                          <button
                            key={e}
                            onClick={() => { setExpiry(e); setPresignedVisible(false); }}
                            className={cn(
                              "px-2 py-0.5 rounded border text-[10px] font-mono transition-all duration-500 cursor-pointer",
                              expiry === e
                                ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white"
                                : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-zinc-400"
                            )}
                          >
                            {e}
                          </button>
                        ))}
                        <button
                          onClick={() => setPresignedVisible(true)}
                          className="ml-auto border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-lg px-3 py-1 text-[11px] font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all duration-500 cursor-pointer"
                        >
                          Preview
                        </button>
                      </div>
                      {presignedVisible && (
                        <div>
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 break-all flex-1 bg-amber-50 dark:bg-amber-900/20 rounded px-2 py-1.5 border border-amber-100 dark:border-amber-900">
                              {getPresignedUrl(provider, bucketName, selectedObj.key, expiry)}
                            </span>
                            <button
                              onClick={() => handleCopy(getPresignedUrl(provider, bucketName, selectedObj.key, expiry))}
                              className="shrink-0 p-1.5 rounded border border-zinc-200 dark:border-zinc-700 hover:opacity-80 transition-opacity"
                            >
                              {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3 text-zinc-400" />}
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-1">Expires in {expiry} · GET only · No credentials needed</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          );
        })}

        {/* Key insight */}
        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-100 dark:border-zinc-800 px-3 py-2 mt-3">
          Presigned URLs let you share private objects for a limited time without making them public — the signature expires automatically.
        </div>
      </div>

      <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900/30">
        <span className="text-sm text-zinc-500 dark:text-zinc-400 flex-1 truncate">
          {!selectedObj
            ? "Select a file to get its URL"
            : selectedObj.public
            ? "Public URL ready to copy"
            : presignedVisible
            ? `Presigned link expires in ${expiry}`
            : "Generate a time-limited link for this private file"}
        </span>
        <button
          type="button"
          disabled={!selectedObj}
          onClick={() => {
            if (!selectedObj) return;
            if (selectedObj.public) {
              handleCopy(getPublicUrl(provider, bucketName, selectedObj.key));
            } else {
              setPresignedVisible(true);
              handleCopy(getPresignedUrl(provider, bucketName, selectedObj.key, expiry));
            }
          }}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all duration-500 disabled:opacity-40 shrink-0 flex items-center gap-1.5"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {!selectedObj ? "Select File" : selectedObj.public ? "Copy URL" : "Generate Link"}
        </button>
      </div>
    </div>
  );
}
