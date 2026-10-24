// Pro features shown in pricing and as locked report steps. There is no payment backend
// yet: the previews are illustrative placeholders, blurred until Pro launches.

export type ProFeature = { icon: string; title: string; description: string; preview: string[] };

export const PRO_PRICE = "₹499";

export const IDEA_PRO: ProFeature[] = [
  { icon: "📊", title: "Market snapshot", description: "Market size, growth rate and trends for your industry, with sources.", preview: ["Market size: ₹12,400 Cr, growing 14% a year", "Fastest-growing segment: premium subscriptions", "Top trend: home delivery of artisanal products"] },
  { icon: "💰", title: "Money check", description: "Startup costs, pricing, margins, break-even and a 12-month forecast.", preview: ["Startup cost: ₹2.4L – ₹3.1L", "Suggested price: ₹899 / box at 58% margin", "Break-even: month 7 at 340 subscribers"] },
  { icon: "🥊", title: "Competitor deep-dive", description: "Real competitors, their pricing, strengths, weaknesses and the gap you can own.", preview: ["Competitor A: ₹999, strong brand, slow delivery", "Competitor B: ₹649, cheap, poor reviews", "Your gap: fresh blends + next-day delivery"] },
  { icon: "🎯", title: "Customer personas", description: "2–3 detailed personas: goals, frustrations, where they scroll and what makes them buy.", preview: ["Priya, 29: product manager, misses home chai", "Buys on Instagram after 3+ touchpoints", "Objection: 'Is it worth it vs. café chai?'"] },
  { icon: "⚖️", title: "Legal & registration", description: "Country-specific checklist: registration, licences, tax and compliance.", preview: ["1. Register as sole proprietor or LLP", "2. GST registration above ₹40L turnover", "3. FSSAI basic licence for food products"] },
  { icon: "🚀", title: "Funding options", description: "Bootstrapping, grants, government schemes and investors that fit your stage.", preview: ["Best fit now: bootstrap + pre-orders", "Eligible schemes: Startup India Seed Fund", "Angel readiness: after 500 paying customers"] },
  { icon: "📈", title: "90-day growth playbook", description: "Week-by-week growth plan after launch, with weekly targets.", preview: ["Weeks 1–4: 100 customers via referrals", "Weeks 5–8: launch corporate gifting", "Weeks 9–12: 2 retail partnerships"] },
  { icon: "📣", title: "Ad campaign planner", description: "Ready-to-run ad sets: audiences, budgets, creatives and expected cost per customer.", preview: ["Audience: office workers 25–40, metro cities", "Budget: ₹500/day for 14 days", "Expected cost per customer: ₹180–₹260"] },
];

export const DIAGNOSE_PRO: ProFeature[] = [
  { icon: "💸", title: "Cash-flow forecast", description: "13-week cash forecast built from your numbers, with warning weeks flagged.", preview: ["Week 6: cash dips below 2 weeks of costs", "Biggest drain: supplier payments on day 5", "Fix: move to 30-day supplier terms"] },
  { icon: "📏", title: "Benchmark vs. peers", description: "How your margins, churn and growth compare with similar businesses.", preview: ["Your margin: 18% · peers: 32%", "Your repeat rate: 21% · peers: 35%", "Biggest gap: pricing and delivery costs"] },
  { icon: "🤝", title: "Weekly accountability check-ins", description: "An AI coach checks your plan progress every week and adapts the next steps.", preview: ["Monday check-in: 3 of 4 tasks done", "Adjusted: move price test to week 3", "Streak: 4 weeks on plan"] },
  { icon: "🧾", title: "Investor-ready turnaround plan", description: "A polished turnaround plan you can share with investors, lenders or partners.", preview: ["Situation · root cause · 90-day fix", "Financial impact: +₹1.8L monthly profit", "Milestones and owner for each action"] },
];

export const PLANS = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    tagline: "Everything you need to start.",
    features: ["Start a business & Fix my business", "6 AI agents on DNotifier", "Live domain & handle checks", "Social funnel with verified facts", "30-day action plans & reminders", "Compare up to 6 cases"],
    cta: "Current plan",
    highlight: false,
  },
  {
    name: "Pro",
    price: PRO_PRICE,
    period: "per month",
    tagline: "Every strategy, in full depth.",
    features: ["Everything in Free", "8 Pro strategies for every idea", "4 Pro deep-dives for every diagnosis", "Unlimited saved cases", "PDF report export", "Priority, faster AI models"],
    cta: "Upgrade to Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "₹1,999",
    period: "per month",
    tagline: "For incubators and co-founders.",
    features: ["Everything in Pro", "5 team seats", "Shared workspace for cases", "Investor pitch deck outline", "Branded reports for clients", "Email support"],
    cta: "Contact us",
    highlight: false,
  },
];
