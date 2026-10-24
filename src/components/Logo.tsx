export const REPO_URL = "https://github.com/hellohammadi/foundry";

// Foundry brand mark: a flame rising from an anvil, on the accent colour.
export function FoundryMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--accent)" />
      <path
        d="M16.4 5.5c1.6 3.4 5.4 5.6 5.4 10.3a5.8 5.8 0 0 1-11.6 0c0-2.3 1.1-4 2.5-5.2.2 1.8 1.1 2.9 2.4 3.4-.1-3.3.3-6 1.3-8.5z"
        fill="var(--accent-ink)"
      />
      <path d="M8.5 23.5h15l-1.6 2.6h-11.8z" fill="var(--accent-ink)" opacity="0.85" />
    </svg>
  );
}

export function FoundryLogo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <FoundryMark size={size} />
      <span className="text-lg font-semibold tracking-tight">Foundry</span>
    </span>
  );
}

// "Powered by DNotifier" attribution. Uses a neutral text wordmark; drop DNotifier's
// official logo into /public and swap it in here if you have permission to use it.
export function PoweredByDNotifier({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href="https://www.dnotifier.com"
      target="_blank"
      rel="noreferrer"
      className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm transition-colors hover:border-accent"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent" aria-hidden="true">
        <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
      </svg>
      {!compact && <span className="text-muted">Powered by</span>}
      <span className="font-semibold">DNotifier</span>
    </a>
  );
}

export function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}
