import { cn } from "@/lib/utils";
import { z } from "zod";

export const StatusCodeSchema = z.object({
  code: z.number().default(200),
  showText: z.boolean().default(true),
  size: z.enum(["sm", "md", "lg"]).default("md"),
});

export type StatusCodeProps = z.infer<typeof StatusCodeSchema>;

const STATUS_MAP: Record<number, { text: string; range: "2xx" | "3xx" | "4xx" | "5xx" | "1xx" }> = {
  100: { text: "Continue", range: "1xx" },
  101: { text: "Switching Protocols", range: "1xx" },
  200: { text: "OK", range: "2xx" },
  201: { text: "Created", range: "2xx" },
  202: { text: "Accepted", range: "2xx" },
  204: { text: "No Content", range: "2xx" },
  206: { text: "Partial Content", range: "2xx" },
  301: { text: "Moved Permanently", range: "3xx" },
  302: { text: "Found", range: "3xx" },
  304: { text: "Not Modified", range: "3xx" },
  307: { text: "Temporary Redirect", range: "3xx" },
  308: { text: "Permanent Redirect", range: "3xx" },
  400: { text: "Bad Request", range: "4xx" },
  401: { text: "Unauthorized", range: "4xx" },
  403: { text: "Forbidden", range: "4xx" },
  404: { text: "Not Found", range: "4xx" },
  405: { text: "Method Not Allowed", range: "4xx" },
  409: { text: "Conflict", range: "4xx" },
  410: { text: "Gone", range: "4xx" },
  422: { text: "Unprocessable Entity", range: "4xx" },
  429: { text: "Too Many Requests", range: "4xx" },
  500: { text: "Internal Server Error", range: "5xx" },
  501: { text: "Not Implemented", range: "5xx" },
  502: { text: "Bad Gateway", range: "5xx" },
  503: { text: "Service Unavailable", range: "5xx" },
  504: { text: "Gateway Timeout", range: "5xx" },
};

const RANGE_STYLES = {
  "1xx": "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700",
  "2xx": "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900",
  "3xx": "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900",
  "4xx": "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900",
  "5xx": "bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900",
};

const SIZE_STYLES = {
  sm: "px-2 py-0.5 text-[11px] gap-1.5",
  md: "px-2.5 py-1 text-xs gap-2",
  lg: "px-3 py-1.5 text-sm gap-2.5",
};

export function StatusCode({ code = 200, showText = true, size = "md" }: StatusCodeProps) {
  const digit = String(code)[0] ?? "2";
  const range = (`${digit}xx` as keyof typeof RANGE_STYLES) in RANGE_STYLES
    ? (`${digit}xx` as keyof typeof RANGE_STYLES)
    : "2xx";
  const info = STATUS_MAP[code];
  const text = info?.text ?? "Unknown";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border font-mono font-semibold",
        RANGE_STYLES[range],
        SIZE_STYLES[size]
      )}
    >
      <span>{code}</span>
      {showText && info && (
        <span className="font-normal opacity-75 font-sans">{text}</span>
      )}
    </span>
  );
}
