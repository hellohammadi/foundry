import { FoundryLogo, GitHubIcon, PoweredByDNotifier, REPO_URL } from "@/components/Logo";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Start a business", href: "#app" },
      { label: "Fix my business", href: "#app" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Pricing", href: "#pricing" },
      { label: "History & reminders", href: "#history" },
    ],
  },
  {
    title: "Open source",
    links: [
      { label: "GitHub repository", href: REPO_URL },
      { label: "Architecture", href: `${REPO_URL}/blob/main/docs/ARCHITECTURE.md` },
      { label: "Contributing", href: `${REPO_URL}/blob/main/CONTRIBUTING.md` },
      { label: "Write a playbook", href: `${REPO_URL}/blob/main/knowledge/README.md` },
    ],
  },
  {
    title: "Built with",
    links: [
      { label: "DNotifier", href: "https://www.dnotifier.com" },
      { label: "DNotifier docs", href: "https://dnotifier.gitbook.io/product-docs" },
      { label: "Next.js", href: "https://nextjs.org" },
      { label: "n8n (automation exports)", href: "https://n8n.io" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <FoundryLogo />
          <p className="max-w-xs text-sm text-muted">
            An open-source team of AI agents that helps founders discover their business potential: start a business, or fix one.
          </p>
          <PoweredByDNotifier />
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="mb-3 text-sm font-semibold">{col.title}</h2>
            <ul className="space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    {...(l.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="text-sm text-muted transition-colors hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-muted">
          <span>© 2026 Foundry contributors · MIT licensed · Built for Hacktoberfest 2026</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
            <GitHubIcon /> Star us on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
