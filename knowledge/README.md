# Foundry playbook knowledge base

These Markdown files are Foundry's open knowledge base of **startup problem → solution playbooks**. The Diagnosis agent searches them semantically (DNotifier RAG) to find the root cause of a founder's problem, and the Solution agent uses their fixes to build a 30-day plan.

Foundry loads any playbook missing from your DNotifier knowledge base automatically on the first diagnosis.

## Add a playbook (great first contribution!)

Create `knowledge/<short-slug>.md` using exactly this structure. The section names matter, because the agents read them.

```markdown
# Problem title, in the founder's words
topic: pricing | cash flow | marketing | retention | operations | hiring | strategy | traction

## Symptoms
- What the founder notices

## Root causes
- The most common underlying cause first

## How to confirm
- A quick check or calculation that proves the root cause

## Fixes
- Concrete actions, not advice

## 30-day starter plan
- Week 1: ...
- Week 2: ...
- Week 3: ...
- Week 4: ...

## Metrics
- What to measure
```

Guidelines:
- Write for a first-time founder: plain words, no jargon without explanation.
- Be practical: every fix should be something they can start this week.
- Keep it under about 60 lines. Focus beats completeness.
- One problem per file. If two problems share fixes, link them in a Fixes bullet.

Ideas for new playbooks: co-founder conflict, pricing a new product, raising a first round, choosing a sales channel, B2B sales cycles that drag on, seasonal revenue swings, legal and compliance basics.
