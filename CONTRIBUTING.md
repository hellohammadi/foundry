# Contributing to Foundry

Thanks for helping people discover their business potential! 🎉 Foundry is a Hacktoberfest project, and first-time contributors are very welcome.

## Getting set up

```bash
git clone https://github.com/<your-username>/foundry.git
cd foundry
npm install
cp .env.example .env.local   # optional: add DNotifier credentials for AI output
npm run dev
```

You don't need DNotifier credentials to contribute. Without them Foundry runs in **demo mode**, and the domain and handle checks still work.

Before opening a pull request:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Good first contributions

### Write a playbook (no coding needed)
Foundry's Diagnosis agent is only as smart as its knowledge base. Add a Markdown playbook for a startup problem you understand to [`knowledge/`](knowledge/), following the format in [knowledge/README.md](knowledge/README.md). It's picked up automatically on the next diagnosis.

### Add a social platform (≈15 lines)
Open `src/lib/checks/handles.ts` and add an entry to `PLATFORMS`:

```ts
{
  name: "Threads",
  profileUrl: (h) => `https://www.threads.net/@${h}`,
  // Only add `check` if the platform has a reliable public lookup.
  // Without it, Foundry shows a manual "check" link instead.
},
```

Only add a `check()` if you've confirmed it reliably tells "taken" from "available". **Wrong "available" results are worse than no result.**

### Add a domain extension
`.com` and `.net` use RDAP (see `RDAP_ENDPOINTS` in `src/lib/checks/domains.ts`). If the registry for your TLD has a public RDAP endpoint, add it there. Otherwise the DNS fallback handles it. You can make it a default in `DEFAULT_TLDS`.

### Add a new agent
1. Create `src/lib/agents/<name>.ts` that exports an `Agent` (copy `strategy.ts` as a template).
2. Write a focused system prompt with an explicit JSON schema, plus a demo-mode template.
3. Add its output type to `src/lib/types.ts` and to `AgentId`.
4. Put it in a stage of `IDEA_TEAM` (`src/lib/agents/pipeline.ts`) or `DIAGNOSE_TEAM` (`src/lib/agents/diagnose.ts`). Agents in the same stage run in parallel.
5. Add it to `IDEA_AGENTS` or `DIAGNOSE_AGENTS` in `src/components/AgentProgress.tsx` and render its section in `ReportView.tsx`.

### Other ideas
- Country-specific business registration steps
- Better demo-mode templates
- Translations
- Accessibility improvements
- A logo concept generator

## Pull request guidelines

- Keep PRs focused on one change.
- Match the existing code style. ESLint runs in CI.
- Describe **what** changed and **why**, and add a screenshot for UI changes.
- Never commit `.env.local` or any real credentials.

## Code of conduct

Be kind, be patient, and assume good intent. Harassment of any kind is not tolerated.
