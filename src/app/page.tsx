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
  Sparkles,
  BarChart3,
  Users,
  Building2,
  Lock,
  Eye,
  Scale,
  Brain,
  Radar,
  Download,
  LineChart,
  Store,
  Briefcase,
  Megaphone,
  UserCheck,
  Layers,
  Gauge,
} from 'lucide-react';
import Link from 'next/link';
import SiteNav from '@/components/marketing/SiteNav';
import SiteFooter from '@/components/marketing/SiteFooter';
import JsonLd from '@/components/seo/JsonLd';
import VideoModal from '@/components/marketing/VideoModal';
import {
  faqSchema,
  organizationSchema,
  softwareApplicationSchema,
  websiteSchema,
} from '@/lib/seo';

const scanLogs = [
  'Querying Google Maps listings for "fitness · Dallas, TX"…',
  'Resolving 47 business profiles + domain records…',
  'AK Fitness Gym & Boxing — no registered website found',
  'Comparing review velocity vs top 5 local competitors…',
  'Scoring revenue leak across web, reviews & GBP signals…',
  'Drafting tailored outreach for the highest-fit gap…',
];

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [pitchTab, setPitchTab] = useState<'email' | 'dm' | 'proposal' | 'audit'>('email');

  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [scanLogIndex, setScanLogIndex] = useState(0);
  const [counterValue, setCounterValue] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);

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

  const whyCards = [
    { icon: Target, title: 'AI Opportunity Score', desc: 'Rank every local business 0–100 by how much digital revenue they are leaving on the table.' },
    { icon: Mail, title: 'AI Outreach Generator', desc: 'Cold emails, DMs, and proposals written around each business’s real gaps—not generic templates.' },
    { icon: MapPin, title: 'Google Business Analysis', desc: 'Profile completeness, review signals, and listing health pulled from public Google Business data.' },
    { icon: BarChart3, title: 'Competitor Benchmarking', desc: 'See how a target stacks up against nearby peers so your pitch is specific and credible.' },
    { icon: Star, title: 'Review Intelligence', desc: 'Spot reply gaps, rating pressure, and reputation issues that open a sales conversation.' },
    { icon: LineChart, title: 'Revenue Leak Detection', desc: 'Surface missing websites, weak booking paths, and SEO gaps that cost local customers.' },
    { icon: Zap, title: 'Fast Scanning', desc: 'Enter a niche and city. LocalRadar scans the market and ranks opportunities in seconds.' },
    { icon: Building2, title: 'Agency Ready', desc: 'Save leads, export lists, run audits, and scale outreach across client pipelines.' },
  ];

  const steps = [
    { icon: MapPin, kicker: '01', title: 'Enter City or Business', desc: 'Choose a niche and target city—or focus on a market you already serve.' },
    { icon: Search, kicker: '02', title: 'AI Scans Google Maps', desc: 'LocalRadar pulls public business listings, reviews, websites, and profile signals.' },
    { icon: Gauge, kicker: '03', title: 'LocalRadar Scores Opportunities', desc: 'Each business gets a scored opportunity profile so you know who is worth contacting first.' },
    { icon: Megaphone, kicker: '04', title: 'Generate Outreach & Close Clients', desc: 'Draft personalized audits and messages, then move qualified leads into your sales process.' },
  ];

  const featureCards = [
    { icon: Target, title: 'Opportunity Score', desc: 'Prioritize leads with a transparent multi-signal score.' },
    { icon: Star, title: 'Review Analysis', desc: 'Ratings, volume gaps, and unanswered review patterns.' },
    { icon: Radar, title: 'SEO Health', desc: 'Local SEO signals that affect discovery and demand.' },
    { icon: MapPin, title: 'Google Profile Audit', desc: 'Listing completeness and profile hygiene checks.' },
    { icon: Globe, title: 'Website Analysis', desc: 'Missing, weak, or high-friction web presence.' },
    { icon: Users, title: 'Competitor Analysis', desc: 'Local peer comparison for sharper pitches.' },
    { icon: Mail, title: 'Email Generator', desc: 'Ready-to-edit cold outreach from live findings.' },
    { icon: Sparkles, title: 'AI Recommendations', desc: 'Suggested services and entry angles per lead.' },
    { icon: FileText, title: 'Local SEO Report', desc: 'Audit-style output you can attach to proposals.' },
    { icon: Download, title: 'Lead Export', desc: 'Export qualified lists on paid plans for CRM workflows.' },
  ];

  const audiences = [
    { icon: Briefcase, tag: 'Marketing Agencies', line: 'Fill the pipeline with local businesses that need web, SEO, or automation work.' },
    { icon: UserCheck, tag: 'Freelancers', line: 'Stop cold-pitching blindly—start with scored, research-backed prospects.' },
    { icon: TrendingUp, tag: 'SEO Experts', line: 'Find listings with ranking and reputation gaps before competitors do.' },
    { icon: Layers, tag: 'Lead Generation Agencies', line: 'Scale market scans and hand clients qualified opportunity boards.' },
    { icon: Building2, tag: 'Consultants', line: 'Turn public Maps data into advisory conversations that close.' },
    { icon: Megaphone, tag: 'Growth Agencies', line: 'Systematize prospecting for multi-location and multi-niche campaigns.' },
  ];

  const useCases = [
    'Dentists', 'Law Firms', 'Roofers', 'Gyms',
    'Restaurants', 'Salons', 'Real Estate', 'Medical Clinics',
  ];

  const aiPoints = [
    { title: 'Analyze Google Business Profiles', desc: 'Read public listing signals at scale so every pitch starts from real data.' },
    { title: 'Find revenue opportunities', desc: 'Detect missing websites, weak reviews, and conversion friction that cost bookings.' },
    { title: 'Score businesses', desc: 'Rank who to contact first with a clear opportunity score—not gut feel.' },
    { title: 'Generate personalized outreach', desc: 'Produce emails, DMs, and proposals grounded in that business’s specific gaps.' },
    { title: 'Prioritize leads', desc: 'Focus team time on high-probability, high-value local opportunities.' },
  ];

  const securityPoints = [
    { icon: Lock, title: 'Encrypted Data', desc: 'Sensitive credentials and account data are handled with encryption in transit and at rest where configured.' },
    { icon: ShieldCheck, title: 'Secure Authentication', desc: 'Modern auth flows with session protection so only authorized users access workspaces.' },
    { icon: Eye, title: 'Privacy First', desc: 'We collect what we need to run the product—not sell customer lists or invent social proof.' },
    { icon: Scale, title: 'GDPR Ready', desc: 'Designed with privacy rights in mind. See our Privacy Policy for how data is processed and controlled.' },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      desc: 'Test the workflow on real local listings.',
      features: ['20 scan credits / month', 'Opportunity scoring', 'Saved leads', 'Upgrade anytime'],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Pro',
      monthlyPrice: '$29',
      yearlyPrice: '$23',
      desc: 'For solo consultants and freelancers.',
      features: ['1,000 scan credits / month', 'Full score breakdown', 'Audits & AI outreach', 'CSV / PDF exports'],
      cta: 'Start Free',
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
      name: 'Agency Plus',
      monthlyPrice: '$149',
      yearlyPrice: '$119',
      desc: 'BYOK, higher limits, and advanced integrations.',
      features: ['10,000 scan credits / month', 'Bring Your Own Keys (BYOK)', 'Higher throughput', 'Dedicated onboarding'],
      cta: 'Get Agency Plus',
      popular: false,
    },
  ];

  const faqItems = [
    { q: 'How does LocalRadar find leads?', a: 'It queries publicly available Google place data and related local signals for the city and niche you choose, then surfaces ratings, websites, and review activity for matching businesses.' },
    { q: 'What is the opportunity score?', a: 'A 0–100 index built from signals such as website presence, review patterns, local SEO indicators, and Google Business profile health. Lower digital readiness often means a stronger sales opening for agencies and consultants.' },
    { q: 'Is there a contract?', a: 'No long-term lock-in on standard plans. Upgrade, downgrade, or cancel according to your plan terms—see Terms of Service for details.' },
    { q: 'Can I export my lists?', a: 'Yes. Paid plans support exporting lead lists (names, addresses, ratings, phone numbers, and domains where available) to CSV for CRM workflows.' },
    { q: 'Can I use my own AI keys?', a: 'On eligible plans, you can bring your own keys in Settings to run generation through your preferred provider configuration.' },
    { q: 'Which markets are supported?', a: 'United States, India, Canada, the United Kingdom, and Australia, with expansion planned based on demand.' },
    { q: 'Do you sell customer data?', a: 'No. LocalRadar is a software product for authorized business prospecting. We do not sell your account data or invent customer logos for marketing.' },
  ];

  return (
    <div className="grain relative min-h-screen overflow-hidden bg-[#08090A] font-sans text-white selection:bg-[#2DD4A7]/25 selection:text-[#2DD4A7]">
      <JsonLd data={organizationSchema()} />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={websiteSchema()} />
      <JsonLd data={faqSchema(faqItems)} />

      <div className="pointer-events-none absolute -top-40 left-1/2 z-0 h-[520px] w-[120vw] max-w-[1400px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(45,212,167,0.16),transparent_65%)] blur-2xl" />

      <SiteNav />

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
          AI-first local growth intelligence
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="hero-display mx-auto max-w-4xl text-4xl font-semibold leading-[1.08] tracking-[-0.035em] text-[#F4F4F5] sm:text-6xl lg:text-7xl"
        >
          Turn Google Maps Into Your{' '}
          <span className="hero-accent italic font-medium text-[#2DD4A7]">Smartest</span> Sales Channel
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed tracking-[-0.011em] text-[#A1A1AA] sm:text-lg"
        >
          AI Opportunity Scoring · Google Business Analysis · Lead Qualification · Personalized Outreach · Revenue Growth—
          so agencies and SMBs spend time closing, not prospecting.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/signup"
            className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2DD4A7] px-7 py-3.5 text-sm font-semibold text-[#04130E] shadow-[0_0_40px_-8px_rgba(45,212,167,0.5)] transition-all hover:bg-[#3ee2b6] sm:w-auto"
          >
            Start Free — no card
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.02] px-7 py-3.5 text-sm font-medium text-white/80 transition-all hover:bg-white/[0.06] sm:w-auto cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Watch Demo
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-white/40"
        >
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2DD4A7]" aria-hidden /> No Credit Card Required</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2DD4A7]" aria-hidden /> 20 Free Scans</span>
          <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#2DD4A7]" aria-hidden /> AI Powered</span>
        </motion.p>

        {/* Trust badges — capability signals only, no fake logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-2"
        >
          {[
            { icon: Sparkles, label: 'AI Powered' },
            { icon: Scale, label: 'GDPR Ready' },
            { icon: ShieldCheck, label: 'Secure Authentication' },
            { icon: Building2, label: 'Built for Agencies' },
            { icon: Check, label: 'No Credit Card Required' },
          ].map((b) => (
            <span
              key={b.label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-2xs font-medium text-white/55"
            >
              <b.icon className="h-3 w-3 text-[#2DD4A7]" aria-hidden />
              {b.label}
            </span>
          ))}
        </motion.div>
      </header>

      {/* ───── Live scanner demo ───── */}
      <section id="demo" className="relative z-10 mx-auto max-w-4xl scroll-mt-24 px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E0F11] p-5 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] sm:p-7"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2DD4A7]/50 to-transparent" />

          <div className="mb-5 flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div className="flex items-center gap-2 font-mono text-2xs uppercase tracking-[0.18em] text-white/45">
              <MapPin className="h-3.5 w-3.5 text-[#2DD4A7]" />
              Live opportunity scanner
            </div>
            <span className="rounded-md border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-2xs text-white/40">
              Example · Dallas, TX
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
                  <p className="mx-auto max-w-xs font-mono text-2xs text-white/35">Illustrative demo of the product workflow</p>
                </motion.div>
              )}

              {scanStep === 'scanning' && (
                <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mx-auto w-full max-w-md space-y-3 py-4 text-left font-mono">
                  <div className="flex items-center gap-3 text-xs text-white/55">
                    <Loader2 className="h-4 w-4 animate-spin text-[#2DD4A7]" />
                    Resolving local business registries…
                  </div>
                  <div className="space-y-2 rounded-xl border border-white/[0.07] bg-black/40 p-4 text-2xs text-white/45">
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
                      <span className="font-mono text-2xs uppercase tracking-[0.15em] text-[#2DD4A7]">Sample match</span>
                      <h4 className="mt-1 text-lg font-semibold text-white">AK Fitness Gym &amp; Boxing</h4>
                      <p className="mt-0.5 font-mono text-2xs text-white/40">Illustrative listing · Dallas, TX</p>
                    </div>
                    <div className="space-y-2.5 border-t border-white/[0.07] pt-3.5 text-sm">
                      <Row label="Google rating" value="Below local average" warn />
                      <Row label="Website" value="None detected" bad />
                      <Row label="Biggest gap" value="No mobile booking funnel" bad />
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/40 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between font-mono text-2xs text-white/40">
                        <span>OPPORTUNITY</span>
                        <span className="font-semibold text-[#2DD4A7]">High fit</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-semibold text-[#2DD4A7]">{counterValue}</span>
                        <span className="text-sm text-white/35">/ 100</span>
                      </div>
                      <div className="flex justify-between border-t border-white/[0.07] pt-2.5 font-mono text-2xs text-white/40">
                        <span>Est. deal range</span>
                        <span className="font-semibold text-white">Varies by service</span>
                      </div>
                    </div>
                    <Link href="/login" className="mt-4 block rounded-lg bg-[#2DD4A7] py-2 text-center text-xs font-semibold text-[#04130E] transition-all hover:bg-[#3ee2b6]">
                      Start Free
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Truthful capability strip — no fake vanity metrics */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-white/[0.06] pt-7 text-center sm:grid-cols-3">
          <Stat value="AI-scored" label="Opportunity ranking" />
          <Stat value="Maps-based" label="Public listing signals" />
          <Stat value="Agency-ready" label="Export & outreach" accent />
        </div>
      </section>

      {/* ───── Why LocalRadar ───── */}
      <section id="why" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8">
        <SectionHead
          eyebrow="Why LocalRadar?"
          title="Built for serious local growth teams"
          sub="Enterprise-ready workflows without the enterprise theater—clear product capability, not invented logos or fake funding claims."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {whyCards.map((c) => (
            <div key={c.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-6 transition-colors hover:border-white/15 hover:bg-white/[0.03]">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-[#2DD4A7]/20 bg-[#2DD4A7]/10 text-[#2DD4A7]">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── How it works ───── */}
      <section id="how" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8">
        <SectionHead
          eyebrow="How it works"
          title="From a city name to a closable conversation"
          sub="A four-step workflow designed for speed, clarity, and repeatable pipeline creation."
        />
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] md:grid-cols-2 lg:grid-cols-4">
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

      {/* ───── Features ───── */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8">
        <SectionHead
          eyebrow="Features"
          title="Everything you need to qualify and convert local demand"
          sub="A focused feature set for scanning, scoring, auditing, and outreach—without bloated CRM noise."
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {featureCards.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/[0.08] bg-[#0B0C0D] p-5 transition-colors hover:border-white/15">
              <f.icon className="h-5 w-5 text-[#2DD4A7]" />
              <h3 className="mt-3 text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-white/45">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Product showcase: outreach ───── */}
      <section id="product" className="relative z-10 mx-auto max-w-5xl scroll-mt-24 px-5 py-12 sm:px-8">
        <SectionHead
          eyebrow="The output"
          title="Outreach that sounds like you did the homework"
          sub="Every business can come with a ready-to-edit audit and message—written around its exact weaknesses, not a template dump."
        />

        <div className="mt-12 grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-3">
            {[
              { id: 'email', name: 'Cold email', icon: Mail, note: 'Specific, short, references their real gap.' },
              { id: 'dm', name: 'Cold DM', icon: MessageSquare, note: 'Casual opener for Instagram / LinkedIn.' },
              { id: 'proposal', name: 'Proposal', icon: FileText, note: 'Scoped deliverables with pricing placeholders.' },
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
              <span className="ml-3 font-mono text-2xs text-white/35">Sample · Dallas Dental Clinic — 42/100</span>
            </div>
            <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap px-5 py-5 text-left font-mono text-sm leading-relaxed text-white/70 select-all">
{pitchTab === 'email' &&
`Subject: A quick note about your clinic's website

Hi team,

Found Dallas Dental on Google Maps — solid rating,
but there's no website linked to the listing.

That's quietly costing you bookings. Your local search
visibility scored 42/100, mainly because of:
  • no mobile-responsive booking page
  • reviews sitting with no reply

We build conversion-focused sites for local dental
practices. Worth a 5-minute call this week?

Best,
[Your name]`}
{pitchTab === 'dm' &&
`Hey team at Dallas Dental 👋

Love the maps presence. Noticed several patient
reviews without a reply — Google often rewards
listings that engage reviews.

I put together a short fix-list to improve the
map pack. Cool if I drop the link here?`}
{pitchTab === 'proposal' &&
`Web Redesign & Local Rankings — Proposal
Prepared for: Dallas Dental Clinic

Issues identified
  • No website linked on the Maps profile
  • Incomplete Google Business metadata

Scope & pricing (example)
  1. Responsive site + appointment capture
  2. Maps optimization + review workflow

Approved by: _____________________`}
{pitchTab === 'audit' &&
`Technical Website & SEO Audit
Target: Dallas Dental Clinic
Status: HIGH OPPORTUNITY — 42/100

  • Website link ......... MISSING
  • Review engagement .... Weak
  • Google Business ....... Incomplete signals`}
            </pre>
            <div className="flex items-center gap-2 border-t border-white/[0.07] px-5 py-3 font-mono text-2xs text-white/35">
              <ShieldCheck className="h-3.5 w-3.5 text-[#2DD4A7]" />
              Sample output — always review and edit before sending.
            </div>
          </div>
        </div>
      </section>

      {/* ───── Who Uses LocalRadar ───── */}
      <section id="audience" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8">
        <SectionHead
          eyebrow="Who uses LocalRadar"
          title="Built for operators who sell to local businesses"
          sub="No invented customer logos. If you sell web, SEO, ads, automation, or consulting to SMBs, LocalRadar helps you find who needs it most."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {audiences.map((a) => (
            <div key={a.tag} className="rounded-2xl border border-white/[0.08] bg-white/[0.015] p-6 transition-colors hover:border-white/15">
              <a.icon className="h-5 w-5 text-[#2DD4A7]" />
              <h4 className="mt-4 text-sm font-semibold text-white">{a.tag}</h4>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{a.line}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── Use cases ───── */}
      <section id="use-cases" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8">
        <SectionHead
          eyebrow="Use cases"
          title="High-intent verticals that buy local services"
          sub="Scan any niche you serve. These categories consistently show digital gaps agencies can monetize."
        />
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {useCases.map((u) => (
            <span
              key={u}
              className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-sm text-white/70"
            >
              <Store className="h-3.5 w-3.5 text-[#2DD4A7]" />
              {u}
            </span>
          ))}
        </div>
      </section>

      {/* ───── AI ───── */}
      <section id="ai" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-[#0F1311] to-[#0A0B0C] p-8 sm:p-12">
          <div className="grid items-start gap-12 lg:grid-cols-2">
            <div>
              <span className="type-overline text-primary">Powered by AI</span>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
                Intelligence that turns public data into pipeline
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/50">
                LocalRadar uses AI to analyze markets and accelerate research—not to replace your judgment.
                You stay in control of outreach, pricing, and client relationships.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#2DD4A7]/25 bg-[#2DD4A7]/10 px-3 py-1.5 font-mono text-2xs text-[#2DD4A7]">
                <Brain className="h-3.5 w-3.5" />
                Configurable generation · Human review recommended
              </div>
            </div>
            <ul className="space-y-4">
              {aiPoints.map((p) => (
                <li key={p.title} className="flex gap-3 rounded-xl border border-white/[0.07] bg-black/20 p-4">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#2DD4A7]" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">{p.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">{p.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───── Security ───── */}
      <section id="security" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-12 sm:px-8">
        <SectionHead
          eyebrow="Enterprise security"
          title="Security posture built for agency workflows"
          sub="Encryption, secure auth, and privacy-first defaults. Full details in our Security Policy — no invented certifications."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {securityPoints.map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/[0.08] bg-[#0B0C0D] p-6">
              <s.icon className="h-5 w-5 text-[#2DD4A7]" />
              <h3 className="mt-4 text-sm font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-white/45">
          <Link href="/security-policy" className="text-[#2DD4A7] hover:underline">Security Policy</Link>
          <span className="text-white/20">·</span>
          <Link href="/privacy" className="text-[#2DD4A7] hover:underline">Privacy Policy</Link>
          <span className="text-white/20">·</span>
          <Link href="/ai-usage" className="text-[#2DD4A7] hover:underline">AI Usage Policy</Link>
        </div>
      </section>

      {/* ───── Pricing ───── */}
      <section id="pricing" className="relative z-10 mx-auto max-w-6xl scroll-mt-24 px-5 py-24 sm:px-8">
        <SectionHead eyebrow="Pricing" title="Close one client and it pays for itself" sub="Start free. Upgrade when the pipeline does. No invented discounts or fake countdown timers." />

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
            <span className="rounded-full border border-[#2DD4A7]/25 bg-[#2DD4A7]/10 px-2 py-0.5 font-mono text-2xs uppercase text-[#2DD4A7]">Save 20%</span>
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
                <span className="absolute -top-2.5 left-6 rounded-full bg-[#2DD4A7] px-2.5 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wide text-[#04130E]">
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
              <ul className="mt-5 flex-1 space-y-3 text-sm text-white/55">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2DD4A7]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={tier.name === 'Agency Plus' ? '/signup' : '/signup'}
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
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4A7] rounded"
                aria-expanded={activeFaq === idx}
                aria-controls={`faq-panel-${idx}`}
                id={`faq-button-${idx}`}
              >
                {item.q}
                <ChevronDown className={`h-4 w-4 shrink-0 text-white/40 transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              <AnimatePresence>
                {activeFaq === idx && (
                  <motion.div
                    id={`faq-panel-${idx}`}
                    role="region"
                    aria-labelledby={`faq-button-${idx}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
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
            Your next client is already <span className="font-normal italic text-[#2DD4A7]">on the map.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-sm text-white/50 sm:text-base">
            Find local businesses with real digital gaps—score them, personalize outreach, and grow with a product built for operators.
          </p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-full bg-[#2DD4A7] px-7 py-3.5 text-sm font-semibold text-[#04130E] shadow-[0_0_40px_-8px_rgba(45,212,167,0.5)] transition-all hover:bg-[#3ee2b6]"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-7 py-3.5 text-sm font-medium text-white/80 transition-all hover:bg-white/[0.06]"
            >
              Watch demo
            </Link>
          </div>
          <p className="relative mt-5 text-xs text-white/35">No credit card · 20 free scans · Cancel anytime on paid plans</p>
        </div>
      </section>

      <SiteFooter />

      <VideoModal
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        title="LocalRadar product demo"
        description="Walkthrough of scan, score, and outreach"
      />
    </div>
  );
}

/* ───── Small presentational helpers ───── */

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <span className="type-overline text-primary">{eyebrow}</span>
      <h2 className="section-title type-h1 mt-3 sm:text-4xl">{title}</h2>
      {sub && <p className="section-sub type-body-lg mx-auto mt-3 text-center">{sub}</p>}
    </div>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`type-metric text-xl sm:text-2xl ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</div>
      <div className="type-overline mt-1">{label}</div>
    </div>
  );
}

function Row({ label, value, warn, bad }: { label: string; value: string; warn?: boolean; bad?: boolean }) {
  return (
    <div className="type-mono flex items-center justify-between text-sm">
      <span className="text-secondary-text">{label}</span>
      <span className={`font-semibold tabular-nums ${bad ? 'text-danger-fg' : warn ? 'text-warning-fg' : 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}
