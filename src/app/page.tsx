'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  Play,
  Loader2,
  Check,
  ChevronDown,
  TrendingUp,
  Mail,
  MessageSquare,
  FileText,
  Globe,
  Target,
  Zap,
  Star,
  ShieldCheck,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';

const scanLogs = [
  'Querying Google Maps listings for "fitness · Dallas, TX"…',
  'Resolving 47 business profiles + domain records…',
  'AK Fitness Gym & Boxing — no registered website found',
  'Comparing review velocity vs top 5 local competitors…',
  'Scoring revenue leak across web, reviews & GBP signals…',
  'Drafting tailored outreach for the highest-fit gap…',
];

function Logo() {
  return (
    <span className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#2DD4A7]/12 ring-1 ring-[#2DD4A7]/25">
        <svg className="h-4 w-4 text-[#2DD4A7]" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
          <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
          <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" opacity="0.55" />
          <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
        </svg>
      </span>
      LocalRadar
    </span>
  );
}

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [pitchTab, setPitchTab] = useState<'email' | 'dm' | 'proposal' | 'audit'>('email');

  // Live scanner simulation
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [scanLogIndex, setScanLogIndex] = useState(0);
  const [counterValue, setCounterValue] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scanStep === 'idle') {
      timer = setTimeout(() => {
        setScanLogIndex(0);
        setScanStep('scanning');
      }, 1600);
    } else if (scanStep === 'scanning') {
      const logInterval = setInterval(() => {
        setScanLogIndex((prev) => {
          if (prev >= scanLogs.length - 1) {
            clearInterval(logInterval);
            setTimeout(() => {
              setCounterValue(0);
              setScanStep('results');
            }, 600);
            return prev;
          }
          return prev + 1;
        });
      }, 550);
      return () => clearInterval(logInterval);
    } else if (scanStep === 'results') {
      const scoreInterval = setInterval(() => {
        setCounterValue((prev) => {
          if (prev >= 90) {
            clearInterval(scoreInterval);
            return 90;
          }
          return prev + 3;
        });
      }, 16);
      timer = setTimeout(() => setScanStep('idle'), 8000);
      return () => {
        clearInterval(scoreInterval);
        clearTimeout(timer);
      };
    }
    return () => clearTimeout(timer);
  }, [scanStep]);

  const steps = [
    {
      icon: Search,
      kicker: '01',
      title: 'Scan a market',
      desc: 'Type a city and a niche. LocalRadar pulls every local business, their reviews, websites and Google Business data in seconds.',
    },
    {
      icon: Target,
      kicker: '02',
      title: 'Score the opportunity',
      desc: 'Each business gets a 0–100 score for how much revenue it is leaking online — so you only chase the ones worth chasing.',
    },
    {
      icon: Mail,
      kicker: '03',
      title: 'Generate the pitch',
      desc: 'Get a ready-to-send audit, cold email, DM and proposal — each one written around that business’s exact weaknesses.',
    },
  ];

  const audiences = [
    { icon: Globe, tag: 'Web designers', line: 'Find listings with no site or a broken one, and pitch a redesign.' },
    { icon: TrendingUp, tag: 'SEO agencies', line: 'Surface businesses bleeding rankings from review and GBP gaps.' },
    { icon: Zap, tag: 'AI automation', line: 'Target high-rated shops with no booking or scheduling system.' },
    { icon: Star, tag: 'Reputation consultants', line: 'Spot sub-4.0 profiles and pitch a review-acquisition engine.' },
  ];

  const results = [
    { agency: 'Solo SEO consultant', leads: 124, meetings: 11, closed: 3, revenue: '₹2.4L' },
    { agency: 'Web design studio', leads: 89, meetings: 7, closed: 2, revenue: '₹1.7L' },
    { agency: 'AI automation agency', leads: 205, meetings: 18, closed: 4, revenue: '₹3.1L' },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      desc: 'Test the workflow on real local listings.',
      features: ['20 scan credits / month', 'Opportunity scoring', 'Basic audit + outreach drafts'],
      cta: 'Start free',
      popular: false,
    },
    {
      name: 'Pro',
      monthlyPrice: '$29',
      yearlyPrice: '$23',
      desc: 'For solo consultants and freelancers.',
      features: ['1,000 scan credits / month', 'Full score breakdown', 'Custom SEO & web audits', 'CSV exports'],
      cta: 'Start 7-day trial',
      popular: false,
    },
    {
      name: 'Agency',
      monthlyPrice: '$79',
      yearlyPrice: '$63',
      desc: 'Built for high-volume outreach teams.',
      features: ['5,000 scan credits / month', 'Up to 5 team seats', 'AI proposal generator', 'Priority support'],
      cta: 'Get Agency',
      popular: true,
    },
    {
      name: 'Enterprise',
      monthlyPrice: 'Custom',
      yearlyPrice: 'Custom',
      desc: 'Dedicated limits and white-label.',
      features: ['Unlimited scans', 'White-labeled audits', 'Custom API access', 'Dedicated support'],
      cta: 'Talk to sales',
      popular: false,
    },
  ];

  const faqItems = [
    { q: 'How does LocalRadar find leads?', a: 'It queries Google place data, domain registries and local indexes for the city and niche you choose, then extracts contact info, ratings, websites and review activity for every match.' },
    { q: 'What exactly is the opportunity score?', a: 'A 0–100 index from website responsiveness (25%), review velocity (25%), local SEO signals (20%), Google Business records (15%) and social presence (15%). Lower score = bigger gap = better prospect for you.' },
    { q: 'Is there a contract?', a: 'No. Every plan is month-to-month or annual. Upgrade, downgrade or cancel in one click, anytime.' },
    { q: 'Can I export my lists?', a: 'Yes. Pro and Agency plans export full lists — names, addresses, ratings, phone numbers and domains — to CSV in one click.' },
    { q: 'Can I use my own AI keys?', a: 'Yes. Add your OpenRouter key in Settings to run models like DeepSeek directly and bypass monthly credit limits.' },
    { q: 'Which countries are supported?', a: 'The United States, India, Canada, the United Kingdom and Australia, with more being added.' },
  ];

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-[#08090A] font-sans text-white selection:bg-[#2DD4A7]/25 selection:text-[#2DD4A7]">
      {/* Ambient hero glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[520px] w-[120vw] max-w-[1400px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(45,212,167,0.16),transparent_65%)] blur-2xl" />

      {/* ───── Nav ───── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08090A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/"><Logo /></Link>
          <div className="hidden items-center gap-8 text-sm text-white/55 md:flex">
            <a href="#how" className="transition-colors hover:text-white">How it works</a>
            <a href="#product" className="transition-colors hover:text-white">Product</a>
            <a href="#proof" className="transition-colors hover:text-white">Results</a>
            <a href="#pricing" className="transition-colors hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-white/65 transition-colors hover:text-white sm:block">
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[#2DD4A7] px-4 py-2 text-sm font-semibold text-[#04130E] transition-all hover:bg-[#3ee2b6]"
            >
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <header className="relative z-10 mx-auto max-w-5xl px-5 pb-10 pt-20 text-center sm:px-8 sm:pt-28">
        <div className="grid-faint pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]" />

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/70"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2DD4A7] opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#2DD4A7]" />
          </span>
          Local lead-gen, fully automated
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mx-auto max-w-4xl text-[2.6rem] font-semibold leading-[1.04] tracking-[-0.03em] sm:text-7xl"
        >
          Turn Google Maps into a
          <br className="hidden sm:block" />{' '}
          pipeline of <span className="font-serif font-normal italic text-[#2DD4A7]">qualified</span> clients.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg"
        >
          LocalRadar scans any city, scores every business by how much revenue it&apos;s
          leaking online, and writes the outreach — so you spend your time closing, not prospecting.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/login"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2DD4A7] px-7 py-3.5 text-sm font-semibold text-[#04130E] shadow-[0_0_40px_-8px_rgba(45,212,167,0.5)] transition-all hover:bg-[#3ee2b6] sm:w-auto"
          >
            Start scanning free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.02] px-7 py-3.5 text-sm font-medium text-white/80 transition-all hover:bg-white/[0.06] sm:w-auto"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Watch 90-sec demo
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-white/40"
        >
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2DD4A7]" /> No card required</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2DD4A7]" /> 20 free scans</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2DD4A7]" /> Cancel anytime</span>
        </motion.p>
      </header>

      {/* ───── Live scanner console ───── */}
      <section id="product" className="relative z-10 mx-auto max-w-4xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E0F11] p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-7"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2DD4A7]/50 to-transparent" />

          <div className="mb-5 flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">
              <MapPin className="h-3.5 w-3.5 text-[#2DD4A7]" />
              Live opportunity scanner
            </div>
            <span className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] text-white/40">
              Dallas, TX
            </span>
          </div>

          <div className="flex min-h-[230px] flex-col justify-center">
            <AnimatePresence mode="wait">
              {scanStep === 'idle' && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 py-10 text-center">
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-black/40 text-[#2DD4A7]">
                    <Search className="h-5 w-5 animate-pulse" />
                  </div>
                  <p className="font-mono text-sm text-white/80">Ready to scan a local market</p>
                  <p className="mx-auto max-w-xs font-mono text-[11px] text-white/35">Standby — initializing local database query…</p>
                </motion.div>
              )}

              {scanStep === 'scanning' && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto w-full max-w-md space-y-3 py-4 text-left font-mono">
                  <div className="flex items-center gap-3 text-xs text-white/55">
                    <Loader2 className="h-4 w-4 animate-spin text-[#2DD4A7]" />
                    Resolving local business registries…
                  </div>
                  <div className="space-y-2 rounded-xl border border-white/[0.07] bg-black/40 p-4 text-[11px] text-white/45">
                    {scanLogs.slice(0, scanLogIndex + 1).map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-[#2DD4A7]">▸</span>
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {scanStep === 'results' && (
                <motion.div key="results" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 gap-5 text-left md:grid-cols-3">
                  <div className="space-y-3 md:col-span-2">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#2DD4A7]">Top match</span>
                      <h4 className="mt-1 text-lg font-semibold text-white">AK Fitness Gym &amp; Boxing</h4>
                      <p className="mt-0.5 font-mono text-[11px] text-white/40">102 N Peak St, Dallas, TX 75226</p>
                    </div>
                    <div className="space-y-2.5 border-t border-white/[0.07] pt-3.5 text-[13px]">
                      <Row label="Google rating" value="3.8 — below local average" warn />
                      <Row label="Website" value="None detected" bad />
                      <Row label="Biggest gap" value="No mobile booking funnel" bad />
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between font-mono text-[10px] text-white/40">
                        <span>OPPORTUNITY</span>
                        <span className="font-semibold text-[#2DD4A7]">74% close rate</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-semibold text-[#2DD4A7]">{counterValue}</span>
                        <span className="text-sm text-white/35">/ 100</span>
                      </div>
                      <div className="flex justify-between border-t border-white/[0.07] pt-2.5 font-mono text-[11px] text-white/40">
                        <span>Est. deal value</span>
                        <span className="font-semibold text-white">₹55k–₹2.3L</span>
                      </div>
                    </div>
                    <Link href="/login" className="mt-4 block rounded-lg bg-[#2DD4A7] py-2 text-center text-xs font-semibold text-[#04130E] transition-all hover:bg-[#3ee2b6]">
                      Generate pitch
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Quiet trust strip */}
        <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-7 text-center">
          <Stat value="4,200+" label="Businesses analyzed" />
          <Stat value="312" label="Agencies onboard" />
          <Stat value="₹4.7Cr+" label="Pipeline surfaced" accent />
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <SectionHead eyebrow="How it works" title="From a city name to a closed client" sub="Three steps. No spreadsheets, no copy-pasting profiles, no guessing who to pitch." />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.kicker} className="group bg-[#0B0C0D] p-7 transition-colors hover:bg-[#0F1113]">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl border border-[#2DD4A7]/20 bg-[#2DD4A7]/10 text-[#2DD4A7]">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="font-mono text-sm text-white/20">{s.kicker}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Product showcase: outreach generator ───── */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <SectionHead eyebrow="The output" title="Outreach that sounds like you did the homework" sub="Every business comes with a ready-to-send audit and message — written around its exact weaknesses, not a template." />

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            {[
              { id: 'email', name: 'Cold email', icon: Mail, note: 'Specific, short, references their real gap.' },
              { id: 'dm', name: 'Cold DM', icon: MessageSquare, note: 'Casual opener for Instagram / LinkedIn.' },
              { id: 'proposal', name: 'Proposal', icon: FileText, note: 'Scoped deliverables with pricing.' },
              { id: 'audit', name: 'Website audit', icon: Globe, note: 'The technical report you attach.' },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = pitchTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setPitchTab(tab.id as typeof pitchTab)}
                  className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                    active ? 'border-[#2DD4A7]/40 bg-[#2DD4A7]/[0.07]' : 'border-white/[0.07] bg-white/[0.01] hover:border-white/15'
                  }`}
                >
                  <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${active ? 'text-[#2DD4A7]' : 'text-white/40'}`} />
                  <span>
                    <span className={`block text-sm font-semibold ${active ? 'text-white' : 'text-white/70'}`}>{tab.name}</span>
                    <span className="mt-0.5 block text-xs text-white/40">{tab.note}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0E0F11]">
            <div className="flex items-center gap-1.5 border-b border-white/[0.07] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-3 font-mono text-[11px] text-white/35">Dallas Dental Clinic — 42/100</span>
            </div>
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap px-5 py-5 text-left font-mono text-[12.5px] leading-relaxed text-white/70 select-all">
{pitchTab === 'email' &&
`Subject: A quick note about your clinic's website

Hi team,

Found Dallas Dental on Google Maps — solid 3.8 rating,
but there's no website linked to the listing.

That's quietly costing you bookings. Your local search
visibility scored 42/100, mainly because of:
  • no mobile-responsive booking page
  • 12 reviews sitting with no reply

We build conversion-focused sites for Dallas dental
practices. Worth a 5-minute call this Thursday?

Best,
[Your name]`}
{pitchTab === 'dm' &&
`Hey team at Dallas Dental 👋

Love the maps presence. Noticed 12 of your patient
reviews don't have a reply yet — Google quietly
down-ranks listings that ignore reviews.

I put together a 5-minute fix-list to climb the
map pack. Cool if I drop the link here?`}
{pitchTab === 'proposal' &&
`Web Redesign & Local Rankings — Proposal
Prepared for: Dallas Dental Clinic

Issues identified
  • No website linked on the Maps profile
  • Unclaimed Google Business metadata

Scope & pricing
  1. Responsive site + appointment capture .... ₹2,500
  2. Maps optimization + review replies ........ ₹499/mo

Approved by: _____________________`}
{pitchTab === 'audit' &&
`Technical Website & SEO Audit
Target: Dallas Dental Clinic
Status: HIGH OPPORTUNITY — 42/100

  • Website link ......... MISSING
      ↳ ~85% of mobile organic traffic lost
  • Review gap vs top 5 ... -224 reviews
  • Google Business ....... 12 unanswered reviews`}
            </pre>
            <div className="flex items-center gap-2 border-t border-white/[0.07] px-5 py-3 font-mono text-[11px] text-white/35">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2DD4A7]" />
              Generated from live Maps data — edit and send.
            </div>
          </div>
        </div>
      </section>

      {/* ───── Who it's for ───── */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <SectionHead eyebrow="Who it's for" title="One tool, every local play" sub="If you sell anything to local businesses, LocalRadar tells you who needs it most." />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {audiences.map((a) => (
            <div key={a.tag} className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-6 transition-colors hover:border-white/15">
              <a.icon className="h-5 w-5 text-[#2DD4A7]" />
              <h4 className="mt-4 text-sm font-semibold text-white">{a.tag}</h4>
              <p className="mt-2 text-[13px] leading-relaxed text-white/50">{a.line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Proof ───── */}
      <section id="proof" className="relative z-10 mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <SectionHead eyebrow="Results" title="Real pipeline, from real users" sub="A snapshot of what operators built in their first 30 days." />
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {results.map((r) => (
            <div key={r.agency} className="rounded-2xl border border-white/[0.08] bg-[#0B0C0D] p-6">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/35">{r.agency}</span>
              <div className="mt-5 grid grid-cols-2 gap-4 border-y border-white/[0.07] py-5">
                <Metric value={`${r.leads}`} label="Leads scanned" />
                <Metric value={`${r.meetings}`} label="Meetings set" />
                <Metric value={`${r.closed}`} label="Deals closed" accent />
                <Metric value={r.revenue} label="New revenue" accent />
              </div>
              <div className="flex items-center gap-2 pt-4 text-xs text-white/45">
                <TrendingUp className="h-3.5 w-3.5 text-[#2DD4A7]" />
                Pipeline generated in 30 days
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <SectionHead eyebrow="Pricing" title="Close one client and it pays for itself" sub="Start free. Upgrade when the pipeline does." />

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-sm ${billingPeriod === 'monthly' ? 'text-white' : 'text-white/40'}`}>Monthly</span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
            className="relative h-6 w-11 rounded-full border border-white/12 bg-white/[0.06] p-0.5"
            aria-label="Toggle billing period"
          >
            <span className={`block h-4.5 w-4.5 rounded-full bg-[#2DD4A7] transition-transform ${billingPeriod === 'yearly' ? 'translate-x-5' : ''}`} />
          </button>
          <span className={`flex items-center gap-2 text-sm ${billingPeriod === 'yearly' ? 'text-white' : 'text-white/40'}`}>
            Yearly
            <span className="rounded-full border border-[#2DD4A7]/25 bg-[#2DD4A7]/10 px-2 py-0.5 font-mono text-[10px] uppercase text-[#2DD4A7]">Save 20%</span>
          </span>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-6 transition-all ${
                tier.popular ? 'border-[#2DD4A7]/50 bg-[#2DD4A7]/[0.04]' : 'border-white/[0.08] bg-[#0B0C0D] hover:border-white/15'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-[#2DD4A7] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#04130E]">
                  Most popular
                </span>
              )}
              <h4 className="text-sm font-semibold text-white">{tier.name}</h4>
              <p className="mt-1 text-xs leading-relaxed text-white/45">{tier.desc}</p>
              <div className="mt-5 flex items-baseline gap-1 border-b border-white/[0.07] pb-5">
                <span className="text-4xl font-semibold tracking-tight text-white">
                  {billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                </span>
                {tier.monthlyPrice !== 'Custom' && <span className="text-xs text-white/40">/mo</span>}
              </div>
              <ul className="mt-5 flex-1 space-y-3 text-[13px] text-white/55">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2DD4A7]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className={`mt-7 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  tier.popular ? 'bg-[#2DD4A7] text-[#04130E] hover:bg-[#3ee2b6]' : 'border border-white/12 text-white hover:bg-white/[0.06]'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ───── FAQ ───── */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <SectionHead eyebrow="FAQ" title="Questions, answered" />
        <div className="mt-12 divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {faqItems.map((item, idx) => (
            <div key={idx}>
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-medium text-white"
              >
                {item.q}
                <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <p className="pb-5 text-sm leading-relaxed text-white/50">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Final CTA ───── */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 py-24 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0F1311] to-[#0A0B0C] px-6 py-16 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[80%] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(45,212,167,0.18),transparent_70%)] blur-2xl" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Your next client is already <span className="font-serif font-normal italic text-[#2DD4A7]">on the map.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm text-white/50 sm:text-base">
            Find the local businesses losing customers right now — before your competitor does.
          </p>
          <div className="relative mt-8 flex justify-center">
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 rounded-full bg-[#2DD4A7] px-7 py-3.5 text-sm font-semibold text-[#04130E] shadow-[0_0_40px_-8px_rgba(45,212,167,0.5)] transition-all hover:bg-[#3ee2b6]"
            >
              Start scanning free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 sm:flex-row sm:px-8">
          <Logo />
          <p className="font-mono text-[11px] text-white/30">© 2026 LocalRadar. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* ───── Small presentational helpers ───── */

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#2DD4A7]">{eyebrow}</span>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-[15px] leading-relaxed text-white/50">{sub}</p>}
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`text-xl font-semibold sm:text-2xl ${accent ? 'text-[#2DD4A7]' : 'text-white'}`}>{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-white/40">{label}</div>
    </div>
  );
}

function Metric({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`text-lg font-semibold ${accent ? 'text-[#2DD4A7]' : 'text-white'}`}>{value}</div>
      <div className="mt-0.5 text-[11px] text-white/40">{label}</div>
    </div>
  );
}

function Row({ label, value, warn, bad }: { label: string; value: string; warn?: boolean; bad?: boolean }) {
  return (
    <div className="flex items-center justify-between font-mono">
      <span className="text-white/40">{label}</span>
      <span className={`font-semibold ${bad ? 'text-[#F87171]' : warn ? 'text-[#FBBF24]' : 'text-white/70'}`}>{value}</span>
    </div>
  );
}
