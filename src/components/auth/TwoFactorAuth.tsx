"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { ShieldCheck, Smartphone, Mail, Clock, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

export const TwoFactorAuthSchema = z.object({
  method: z.enum(["totp", "sms", "email"]).default("totp"),
  username: z.string().default("alice@example.com"),
  issuer: z.string().optional().default("FreshMarket"),
});

export type TwoFactorAuthProps = z.infer<typeof TwoFactorAuthSchema>;

function getWindow30s() {
  return Math.floor(Date.now() / 30000);
}

function windowToCode(w: number): string {
  const code = (w * 7919 + 12345) % 1000000;
  return String(code).padStart(6, "0");
}

function getSecondsLeft() {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

// --- TOTP Tab ---
function TotpTab({ issuer = "FreshMarket" }: { issuer?: string }) {
  const [secsLeft, setSecsLeft] = useState(getSecondsLeft);
  const [windowId, setWindowId] = useState(getWindow30s);
  const [inputDigits, setInputDigits] = useState(["", "", "", "", "", ""]);
  const [verifyState, setVerifyState] = useState<"idle" | "checking" | "success" | "error">("idle");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const id = setInterval(() => {
      const s = getSecondsLeft();
      setSecsLeft(s);
      const w = getWindow30s();
      if (w !== windowId) setWindowId(w);
    }, 1000);
    return () => clearInterval(id);
  }, [windowId]);

  const code = windowToCode(windowId);
  const digits = code.split("");
  const progress = ((30 - secsLeft) / 30) * 100;

  function handleDigitChange(i: number, val: string) {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...inputDigits];
    next[i] = d;
    setInputDigits(next);
    if (d && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleDigitKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !inputDigits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handleVerify() {
    const entered = inputDigits.join("");
    setVerifyState("checking");
    setTimeout(() => {
      setVerifyState(entered === code ? "success" : "error");
    }, 900);
  }

  function handleReset() {
    setInputDigits(["", "", "", "", "", ""]);
    setVerifyState("idle");
  }

  return (
    <div className="space-y-4">
      {/* Steps header */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="inline-flex size-4 rounded-full bg-emerald-500 items-center justify-center text-white text-[10px]">✓</span>
          Login with password
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">→</span>
        <span className="font-semibold text-zinc-700 dark:text-zinc-200">Enter TOTP code</span>
        <span className="text-zinc-300 dark:text-zinc-600">→</span>
        <span className="text-zinc-400 dark:text-zinc-500">Access granted</span>
      </div>

      {/* Code display */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">{issuer} Authenticator</span>
          <span className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <Clock className="size-3" />
            {secsLeft}s
          </span>
        </div>

        {/* Big digits */}
        <div className="flex gap-1.5 justify-center mb-3">
          {digits.map((d, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex size-9 rounded-md border text-lg font-mono font-bold items-center justify-center transition-all duration-500",
                secsLeft <= 5
                  ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                  : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
              )}
            >
              {d}
            </span>
          ))}
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
            <span>Code valid for</span>
            <span>{secsLeft}s remaining</span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                secsLeft <= 5 ? "bg-red-500" : secsLeft <= 10 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${100 - progress}%` }}
            />
          </div>
        </div>

        <p className="mt-2 text-center text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
          HMAC-SHA1(secret, floor(time ÷ 30))
        </p>
      </div>

      {/* Input + verify */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {inputDigits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleDigitKeyDown(i, e)}
              maxLength={1}
              className={cn(
                "size-8 rounded border text-center text-sm font-mono font-bold focus:outline-none focus:ring-2 transition-all duration-300",
                "bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200",
                verifyState === "success"
                  ? "border-emerald-400 dark:border-emerald-500 ring-emerald-300 dark:ring-emerald-700"
                  : verifyState === "error"
                    ? "border-red-400 dark:border-red-500 ring-red-300 dark:ring-red-700"
                    : "border-zinc-300 dark:border-zinc-600 focus:ring-blue-300 dark:focus:ring-blue-700"
              )}
            />
          ))}
        </div>

        {verifyState === "idle" || verifyState === "checking" ? (
          <button
            onClick={handleVerify}
            disabled={verifyState === "checking" || inputDigits.some((d) => !d)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
          >
            {verifyState === "checking" ? (
              <RefreshCw className="size-3.5 animate-spin" />
            ) : null}
            Verify
          </button>
        ) : verifyState === "success" ? (
          <button onClick={handleReset} className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 px-3 py-2">
            <CheckCircle2 className="size-4" /> Success — reset
          </button>
        ) : (
          <button onClick={handleReset} className="flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400 px-3 py-2">
            <XCircle className="size-4" /> Wrong code — try again
          </button>
        )}
      </div>

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Tip: enter the code shown above to see success, or any other digits to see failure.
      </p>
    </div>
  );
}

// --- SMS Tab ---
function SmsTab({ username }: { username: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [resendCount, setResendCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    if (step < 1) return;
    setTimeLeft(300);
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [step, resendCount]);

  const phone = username.includes("@") ? "+1-555-****-7890" : "+1-555-****-7890";
  const mins = Math.floor(timeLeft / 60);
  const secs = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="inline-flex size-4 rounded-full bg-emerald-500 items-center justify-center text-white text-[10px]">✓</span>
          Password verified
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">→</span>
        <span className={cn("font-semibold", step >= 1 ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400")}>SMS sent</span>
        <span className="text-zinc-300 dark:text-zinc-600">→</span>
        <span className={cn("font-semibold", step >= 2 ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400")}>Verified</span>
      </div>

      {step === 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            A verification code will be sent to:
          </p>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-md px-3 py-2">
            <Smartphone className="size-4 text-zinc-400" />
            <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{phone}</span>
          </div>
          <button
            onClick={() => setStep(1)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Send SMS Code
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-3">
            <div className="flex items-start gap-2">
              <Smartphone className="size-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">SMS from FreshMarket</p>
                <p className="text-sm text-zinc-800 dark:text-zinc-200">
                  Your verification code is <span className="font-mono font-bold">482 917</span>. Valid for {mins}:{secs}.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Clock className="size-3" />
            <span>Expires in {mins}:{secs}</span>
            <span className="mx-1">·</span>
            <button
              onClick={() => setResendCount((c) => c + 1)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Resend {resendCount > 0 ? `(${resendCount})` : ""}
            </button>
          </div>
          <button
            onClick={() => setStep(2)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Enter Code
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">SMS Verified</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Access granted to alice@example.com</p>
          </div>
          <button onClick={() => { setStep(0); setResendCount(0); }} className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">reset</button>
        </div>
      )}

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        SMS codes are simpler but vulnerable to SIM-swap attacks. TOTP is preferred.
      </p>
    </div>
  );
}

// --- Email Tab ---
function EmailTab({ username }: { username: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const maskedEmail = username.includes("@")
    ? username.split("@")[0]!.slice(0, 2) + "***@" + username.split("@")[1]
    : "al***@example.com";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="inline-flex size-4 rounded-full bg-emerald-500 items-center justify-center text-white text-[10px]">✓</span>
          Password verified
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">→</span>
        <span className={cn("font-semibold", step >= 1 ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400")}>Email sent</span>
        <span className="text-zinc-300 dark:text-zinc-600">→</span>
        <span className={cn("font-semibold", step >= 2 ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400")}>Verified</span>
      </div>

      {step === 0 && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 space-y-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            A magic link will be sent to:
          </p>
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 rounded-md px-3 py-2">
            <Mail className="size-4 text-zinc-400" />
            <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{maskedEmail}</span>
          </div>
          <button
            onClick={() => setStep(1)}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Send Magic Link
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          {/* Email mockup */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <div className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-zinc-400" />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">From: noreply@freshmarket.com · To: {maskedEmail}</span>
              </div>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">Your sign-in link for FreshMarket</p>
            </div>
            <div className="p-3 bg-white dark:bg-zinc-900 space-y-2">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Click the button below to sign in. This link expires in 15 minutes.</p>
              <button
                onClick={() => setStep(2)}
                className="block w-full text-center bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Sign in to FreshMarket
              </button>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Or use code: <span className="font-mono font-bold">738-291</span></p>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-4">
          <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Email Verified</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Magic link used — access granted</p>
          </div>
          <button onClick={() => setStep(0)} className="ml-auto text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">reset</button>
        </div>
      )}

      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
        Magic links skip passwords entirely. No secret stored server-side beyond the token.
      </p>
    </div>
  );
}

// --- Main Component ---
export function TwoFactorAuth({
  method = "totp",
  username = "alice@example.com",
  issuer = "FreshMarket",
}: TwoFactorAuthProps) {
  const [activeMethod, setActiveMethod] = useState<"totp" | "sms" | "email">(method);

  const tabs = [
    { id: "totp" as const, label: "TOTP", icon: <ShieldCheck className="size-3.5" /> },
    { id: "sms" as const,  label: "SMS",  icon: <Smartphone className="size-3.5" /> },
    { id: "email" as const, label: "Email", icon: <Mail className="size-3.5" /> },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-zinc-600 dark:text-zinc-400" />
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Two-Factor Auth</span>
        </div>
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMethod(tab.id)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-300",
                activeMethod === tab.id
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                  : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body — fixed height */}
      <div className="min-h-[280px] p-4">
        {activeMethod === "totp" && <TotpTab issuer={issuer} />}
        {activeMethod === "sms"  && <SmsTab username={username} />}
        {activeMethod === "email" && <EmailTab username={username} />}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center">
          {activeMethod === "totp"  && "Time-based · changes every 30s · no server state required"}
          {activeMethod === "sms"   && "Server sends OTP · expires in 5 min · requires phone number"}
          {activeMethod === "email" && "Magic link · single-use token · expires in 15 min"}
        </p>
      </div>
    </div>
  );
}
