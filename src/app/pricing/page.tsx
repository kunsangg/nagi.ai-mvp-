"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import {
  Check, Zap, Building2, GraduationCap, ArrowRight,
  Users, BookOpen, Network, Brain, Shield, BarChart3,
  Sparkles, Globe, Star, ChevronDown, ChevronUp
} from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    badge: null,
    price: { monthly: 0, annual: 0 },
    description: "For curious minds exploring research for the first time.",
    cta: "Start for free",
    ctaVariant: "outline",
    features: [
      "10 paper searches / month",
      "5 map generations",
      "3 literature reviews",
      "Basic citation finder",
      "Public papers only",
      "Community support",
    ],
    limits: {
      searches: "10/mo",
      maps: "5",
      ai: "Basic",
    },
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Most popular",
    price: { monthly: 19, annual: 15 },
    description: "For individual researchers, PhD students and academics.",
    cta: "Start 14-day trial",
    ctaVariant: "primary",
    features: [
      "Unlimited paper searches",
      "Unlimited research maps",
      "Full literature reviews",
      "Advanced citation network",
      "Research gap finder",
      "Evidence strength scoring",
      "AI paper explainer",
      "Nagi Writer (AI drafting)",
      "Export to PDF / BibTeX",
      "Priority support",
    ],
    limits: {
      searches: "Unlimited",
      maps: "Unlimited",
      ai: "GPT-4 powered",
    },
  },
  {
    id: "team",
    name: "Team",
    badge: "Best value",
    price: { monthly: 49, annual: 39 },
    description: "For research labs, departments and collaborative groups.",
    cta: "Start team trial",
    ctaVariant: "outline",
    features: [
      "Everything in Pro",
      "Up to 20 seats",
      "Shared team workspaces",
      "Collaborative maps",
      "Shared literature libraries",
      "Usage analytics dashboard",
      "SSO / SAML login",
      "Custom data exports",
      "Dedicated onboarding",
      "SLA support",
    ],
    limits: {
      searches: "Unlimited",
      maps: "Unlimited shared",
      ai: "GPT-4 + Claude",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    badge: null,
    price: { monthly: null, annual: null },
    description: "For universities, hospitals and large research organisations.",
    cta: "Contact sales",
    ctaVariant: "outline",
    features: [
      "Everything in Team",
      "Unlimited seats",
      "Private cloud deployment",
      "Custom integrations (EHR, PubMed, Scopus)",
      "Institutional paper access",
      "Compliance & audit logs",
      "Custom AI model tuning",
      "Dedicated success manager",
      "99.9% uptime SLA",
      "Volume pricing",
    ],
    limits: {
      searches: "Unlimited",
      maps: "Unlimited",
      ai: "Custom models",
    },
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. You can cancel your subscription at any time directly from your account settings. You'll keep access until the end of your billing period.",
  },
  {
    q: "Is there a student discount?",
    a: "Absolutely. We offer 50% off the Pro plan for verified students and academics. Reach out to us with your institutional email to unlock the discount.",
  },
  {
    q: "What AI models power Nagi?",
    a: "Nagi uses a combination of GPT-4, Claude, and our own fine-tuned models trained specifically on academic literature to ensure accuracy and citation integrity.",
  },
  {
    q: "Does Nagi access full-text papers?",
    a: "Nagi surfaces metadata, abstracts, and open-access full texts through integrations with Semantic Scholar, PubMed, and arXiv. For paywalled papers, we redirect to the original source.",
  },
  {
    q: "Is my research data private?",
    a: "Yes. Your research maps, notes, and queries are completely private and never used to train our models. Enterprise customers can opt for isolated cloud deployments.",
  },
  {
    q: "Do you offer institutional licensing?",
    a: "Yes. We work with universities and research hospitals to set up institution-wide access. Contact our sales team to discuss volume pricing and SSO integration.",
  },
];

const comparison = [
  { feature: "Paper search",         free: true,    pro: true,    team: true,    enterprise: true },
  { feature: "Research maps",        free: "5",     pro: "∞",     team: "∞",     enterprise: "∞" },
  { feature: "Literature review",    free: "3",     pro: "∞",     team: "∞",     enterprise: "∞" },
  { feature: "Citation finder",      free: "Basic", pro: "Full",  team: "Full",  enterprise: "Full" },
  { feature: "Gap finder",           free: false,   pro: true,    team: true,    enterprise: true },
  { feature: "Evidence scoring",     free: false,   pro: true,    team: true,    enterprise: true },
  { feature: "Nagi Writer (AI)",     free: false,   pro: true,    team: true,    enterprise: true },
  { feature: "Team workspaces",      free: false,   pro: false,   team: true,    enterprise: true },
  { feature: "Analytics dashboard",  free: false,   pro: false,   team: true,    enterprise: true },
  { feature: "SSO / SAML",           free: false,   pro: false,   team: true,    enterprise: true },
  { feature: "Private deployment",   free: false,   pro: false,   team: false,   enterprise: true },
  { feature: "Custom AI tuning",     free: false,   pro: false,   team: false,   enterprise: true },
];

function PlanIcon({ id }: { id: string }) {
  if (id === "free")       return <GraduationCap size={18} className="text-[#64748b]" />;
  if (id === "pro")        return <Zap size={18} className="text-[#3bc9db]" />;
  if (id === "team")       return <Users size={18} className="text-[#6366f1]" />;
  return                          <Building2 size={18} className="text-[#f59e0b]" />;
}

function CellValue({ val }: { val: boolean | string }) {
  if (val === true)  return <Check size={15} className="text-[#10b981] mx-auto" />;
  if (val === false) return <span className="block w-4 h-[1.5px] bg-[#2a2a2a] mx-auto rounded-full" />;
  return <span className="text-[12px] text-[#94a3b8]">{val}</span>;
}

export default function BusinessPage() {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="w-full h-full flex overflow-hidden bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

        {/* ── Hero ── */}
        <div className="relative pt-20 pb-16 px-6 text-center border-b border-[#1a1a1a] overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#3bc9db]/[0.04] blur-3xl rounded-full" />
          </div>

          <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#1f1f1f] bg-[#111111] text-[11px] font-[500] text-[#64748b] mb-6">
            <Sparkles size={11} className="text-[#3bc9db]" />
            Simple, transparent pricing
          </div>

          <h1 className="text-[38px] font-[650] text-[#e2e8f0] tracking-tight leading-tight mb-4">
            The research OS for<br />
            <span className="text-[#3bc9db]">serious academics.</span>
          </h1>
          <p className="text-[15px] text-[#64748b] max-w-lg mx-auto leading-relaxed mb-10">
            From solo PhD students to entire research institutions — Nagi scales with your ambition.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-[#111111] border border-[#1f1f1f] rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-[500] transition-all duration-200 ${!annual ? "bg-[#1f1f1f] text-[#e2e8f0]" : "text-[#64748b]"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-[500] transition-all duration-200 flex items-center gap-2 ${annual ? "bg-[#1f1f1f] text-[#e2e8f0]" : "text-[#64748b]"}`}
            >
              Annual
              <span className="text-[10px] bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 px-1.5 py-0.5 rounded-full font-[600]">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* ── Pricing cards ── */}
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {plans.map((plan) => {
              const isPro = plan.id === "pro";
              const price = annual ? plan.price.annual : plan.price.monthly;
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-xl border p-6 transition-all duration-200 ${
                    isPro
                      ? "border-[#3bc9db]/40 bg-[#3bc9db]/[0.04]"
                      : "border-[#1f1f1f] bg-[#111111] hover:border-[#2a2a2a]"
                  }`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-[700] tracking-wider border whitespace-nowrap ${
                      isPro
                        ? "bg-[#3bc9db] text-[#0a0a0a] border-transparent"
                        : "bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/20"
                    }`}>
                      {plan.badge.toUpperCase()}
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <PlanIcon id={plan.id} />
                    <span className="text-[14px] font-[600] text-[#e2e8f0]">{plan.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    {price !== null ? (
                      <div className="flex items-end gap-1">
                        <span className="text-[32px] font-[700] text-[#e2e8f0] leading-none">${price}</span>
                        <span className="text-[13px] text-[#64748b] mb-1">/mo</span>
                      </div>
                    ) : (
                      <span className="text-[22px] font-[600] text-[#e2e8f0]">Custom</span>
                    )}
                    {annual && price !== null && price > 0 && (
                      <p className="text-[11px] text-[#64748b] mt-0.5">billed annually</p>
                    )}
                  </div>

                  <p className="text-[12.5px] text-[#64748b] leading-relaxed mb-5">{plan.description}</p>

                  {/* CTA */}
                  <button className={`w-full py-2 rounded-lg text-[13px] font-[500] transition-all duration-200 mb-6 ${
                    plan.ctaVariant === "primary"
                      ? "bg-[#3bc9db] text-[#0a0a0a] hover:bg-[#22b8cf]"
                      : "bg-transparent border border-[#2a2a2a] text-[#e2e8f0] hover:bg-[#1a1a1a]"
                  }`}>
                    {plan.cta}
                  </button>

                  {/* Features */}
                  <div className="flex flex-col gap-2.5">
                    {plan.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <Check size={13} className={`mt-0.5 shrink-0 ${isPro ? "text-[#3bc9db]" : "text-[#10b981]"}`} />
                        <span className="text-[12.5px] text-[#94a3b8] leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Social proof strip ── */}
        <div className="border-y border-[#1a1a1a] bg-[#0d0d0d] py-8 px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { stat: "12,000+", label: "Researchers" },
              { stat: "340k+",   label: "Papers mapped" },
              { stat: "98%",     label: "Satisfaction" },
              { stat: "180+",    label: "Institutions" },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="text-[26px] font-[700] text-[#e2e8f0] tracking-tight">{stat}</div>
                <div className="text-[12px] text-[#64748b] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature comparison table ── */}
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-[22px] font-[650] text-[#e2e8f0] mb-2">Full plan comparison</h2>
          <p className="text-[13px] text-[#64748b] mb-8">Everything you get at each tier.</p>

          <div className="rounded-xl border border-[#1f1f1f] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-5 bg-[#111111] border-b border-[#1f1f1f]">
              <div className="p-4 text-[11px] font-[600] text-[#64748b] uppercase tracking-wider">Feature</div>
              {["Free", "Pro", "Team", "Enterprise"].map((h, i) => (
                <div key={h} className={`p-4 text-center text-[12px] font-[600] ${i === 1 ? "text-[#3bc9db]" : "text-[#e2e8f0]"}`}>
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {comparison.map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-5 border-b border-[#131313] ${idx % 2 === 0 ? "bg-[#0a0a0a]" : "bg-[#0d0d0d]"} hover:bg-[#111111] transition-colors`}
              >
                <div className="p-3.5 px-4 text-[12.5px] text-[#94a3b8]">{row.feature}</div>
                {[row.free, row.pro, row.team, row.enterprise].map((val, i) => (
                  <div key={i} className="p-3.5 text-center flex items-center justify-center">
                    <CellValue val={val} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div className="bg-[#0d0d0d] border-y border-[#1a1a1a] py-14 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-[20px] font-[650] text-[#e2e8f0] mb-8 text-center">Trusted by researchers worldwide</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  quote: "Nagi saved me weeks of work on my systematic review. The citation network visualisation alone is worth the subscription.",
                  name: "Dr. Priya Mehta",
                  role: "Neuroscience PhD, Stanford",
                  stars: 5,
                },
                {
                  quote: "We switched our entire lab to Nagi Team. Collaborative maps have completely changed how we track the literature.",
                  name: "Prof. Lars Jensen",
                  role: "Cardiology Lab, Copenhagen",
                  stars: 5,
                },
                {
                  quote: "The gap finder identified a research gap that became the core of my grant proposal. Absolutely phenomenal tool.",
                  name: "Aiko Tanaka",
                  role: "MD/PhD Candidate, Tokyo Medical",
                  stars: 5,
                },
              ].map(({ quote, name, role, stars }) => (
                <div key={name} className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                    ))}
                  </div>
                  <p className="text-[13px] text-[#94a3b8] leading-relaxed flex-1">&ldquo;{quote}&rdquo;</p>
                  <div>
                    <div className="text-[13px] font-[500] text-[#e2e8f0]">{name}</div>
                    <div className="text-[11px] text-[#64748b]">{role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-[22px] font-[650] text-[#e2e8f0] mb-2 text-center">Frequently asked questions</h2>
          <p className="text-[13px] text-[#64748b] mb-10 text-center">Can&apos;t find your answer? <a href="mailto:hello@nagi.ai" className="text-[#3bc9db] hover:underline">Email us.</a></p>

          <div className="flex flex-col gap-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-[#1f1f1f] rounded-lg overflow-hidden bg-[#0d0d0d]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="text-[13.5px] font-[500] text-[#e2e8f0]">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={15} className="text-[#64748b] shrink-0" />
                    : <ChevronDown size={15} className="text-[#64748b] shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-[13px] text-[#64748b] leading-relaxed border-t border-[#1a1a1a] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div className="relative border-t border-[#1a1a1a] py-20 px-6 text-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#3bc9db]/[0.05] blur-3xl rounded-full" />
          </div>
          <div className="relative">
            <h2 className="text-[28px] font-[650] text-[#e2e8f0] tracking-tight mb-3">Start researching smarter today.</h2>
            <p className="text-[14px] text-[#64748b] mb-8 max-w-md mx-auto">
              No credit card required. Full Pro access for 14 days, cancel anytime.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#3bc9db] hover:bg-[#22b8cf] text-[#0a0a0a] text-[13.5px] font-[600] rounded-lg transition-all duration-200">
                Get started free <ArrowRight size={14} />
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 border border-[#2a2a2a] hover:bg-[#111111] text-[#e2e8f0] text-[13.5px] font-[500] rounded-lg transition-all duration-200">
                Talk to sales <Globe size={14} />
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
