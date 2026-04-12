"use client";

import { useState, useEffect, type FormEvent } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  apiUrl: string;
  placeholder: string;
  submitLabel: string;
  submittingLabel: string;
  successHeading: string;
  successBody: string;
  alreadySignedUp: string;
  errorGeneric: string;
  errorInvalidEmail: string;
  errorRateLimit: string;
  socialProofSuffix: string;
  fallbackCount: string;
};

type Status = "idle" | "submitting" | "success" | "already" | "error";

const FALLBACK_COLORS = ["#8B6CAE", "#5B8DB8", "#5FA886", "#D4A846"];

export function WaitlistForm(props: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [count, setCount] = useState<string>(props.fallbackCount);
  const [avatars, setAvatars] = useState<string[]>([]);

  useEffect(() => {
    fetch(props.apiUrl, { method: "GET" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.count === "number" && d.count > 0) setCount(String(d.count));
        if (Array.isArray(d.avatars) && d.avatars.length > 0) setAvatars(d.avatars);
      })
      .catch(() => {});
  }, [props.apiUrl]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setErrorMsg(props.errorInvalidEmail);
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(props.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (res.status === 429) {
        setStatus("error");
        setErrorMsg(props.errorRateLimit);
        return;
      }

      const data = await res.json();

      if (data.already_signed_up) {
        setStatus("already");
        return;
      }

      if (data.success) {
        setStatus("success");
        setCount((prev) => {
          const n = parseInt(prev, 10);
          return isNaN(n) ? prev : String(n + 1);
        });
        return;
      }

      setStatus("error");
      setErrorMsg(data.error === "Invalid email" ? props.errorInvalidEmail : props.errorGeneric);
    } catch {
      setStatus("error");
      setErrorMsg(props.errorGeneric);
    }
  }

  if (status === "success" || status === "already") {
    return (
      <div className="space-y-5">
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-maak-primary/10">
            <svg className="h-6 w-6 text-maak-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-maak-foreground">
            {status === "already" ? props.alreadySignedUp : props.successHeading}
          </h3>
          {status === "success" && (
            <p className="text-sm leading-relaxed text-maak-muted-fg">
              {props.successBody}
            </p>
          )}
        </div>
        <SocialProof count={count} suffix={props.socialProofSuffix} avatars={avatars} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="flex items-center gap-0 rounded-full border border-maak-border bg-white p-1.5 shadow-sm transition focus-within:border-maak-primary/40 focus-within:shadow-md">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          placeholder={props.placeholder}
          required
          className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-maak-foreground placeholder:text-maak-muted-fg/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="shrink-0 rounded-full bg-gradient-to-r from-maak-primary to-maak-primary-mid px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:opacity-60"
        >
          {status === "submitting" ? props.submittingLabel : props.submitLabel}
        </button>
      </form>

      {status === "error" && errorMsg && (
        <p className="text-center text-xs text-maak-coral">{errorMsg}</p>
      )}

      <SocialProof count={count} suffix={props.socialProofSuffix} avatars={avatars} />
    </div>
  );
}

function SocialProof({
  count,
  suffix,
  avatars,
}: {
  count: string;
  suffix: string;
  avatars: string[];
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex -space-x-2.5">
        {avatars.length > 0
          ? avatars.map((hash) => (
              <img
                key={hash}
                src={`https://www.gravatar.com/avatar/${hash}?s=64&d=mp`}
                alt=""
                className="inline-block h-8 w-8 rounded-full object-cover ring-2 ring-white"
              />
            ))
          : FALLBACK_COLORS.map((bg) => (
              <span
                key={bg}
                className="inline-block h-8 w-8 rounded-full ring-2 ring-white"
                style={{ backgroundColor: bg }}
              />
            ))}
      </div>
      <p className="text-sm text-maak-muted-fg">
        {count}{!count.includes("+") && "+"} {suffix}
      </p>
    </div>
  );
}
