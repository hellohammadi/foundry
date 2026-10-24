"use client";

import { FoundryLogo, GitHubIcon, PoweredByDNotifier, REPO_URL } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { comingSoon } from "@/components/Toast";
import { useState } from "react";

type Mode = "idea" | "diagnose";

export function Navbar({ onMode }: { onMode: (mode: Mode) => void }) {
  const [open, setOpen] = useState(false);

  const links: { label: string; href: string; mode?: Mode }[] = [
    { label: "Start a business", href: "#app", mode: "idea" },
    { label: "Fix my business", href: "#app", mode: "diagnose" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "History", href: "#history" },
  ];

  const go = (mode?: Mode) => {
    if (mode) onMode(mode);
    setOpen(false);
  };

  // Accounts aren't built yet; the buttons are placeholders that say so.
  const account = (what: "Log in" | "Sign up") => {
    setOpen(false);
    comingSoon(what === "Log in" ? "Logging in" : "Creating an account");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <a href="#top" aria-label="Foundry home" onClick={() => go()}>
          <FoundryLogo />
        </a>

        <div className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={() => go(l.mode)} className="rounded-lg px-2.5 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="hidden xl:inline-flex"><PoweredByDNotifier compact /></span>
          <ThemeToggle />
          <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="Foundry on GitHub" className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-accent">
            <GitHubIcon />
          </a>
          <button onClick={() => account("Log in")} className="rounded-full px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface">
            Log in
          </button>
          <button onClick={() => account("Sign up")} className="btn-primary rounded-full px-4 py-1.5 text-sm font-semibold">
            Sign up
          </button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            className="rounded-lg border border-line p-2"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-line bg-surface-2 px-4 pb-4 lg:hidden">
          {links.map((l) => (
            <a key={l.label} href={l.href} onClick={() => go(l.mode)} className="block border-b border-line py-3 text-ink">
              {l.label}
            </a>
          ))}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={() => account("Log in")} className="rounded-xl border border-line bg-surface py-2.5 text-sm font-medium">Log in</button>
            <button onClick={() => account("Sign up")} className="btn-primary rounded-xl py-2.5 text-sm font-semibold">Sign up</button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <PoweredByDNotifier />
            <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-bg">
              <GitHubIcon /> GitHub
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
