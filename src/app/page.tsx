'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Search,
  ArrowRight, 
  Play, 
  Globe, 
  Star, 
  Phone, 
  AlertCircle, 
  Loader2, 
  Check, 
  ChevronDown,
  Building,
  UserCheck,
  TrendingUp,
  Mail,
  MessageSquare,
  FileText,
  Copy,
  Lock,
  ArrowUpRight,
  Zap,
  Target,
  DollarSign,
  Users,
  Clock,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

export default function RedesignedLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [pitchTab, setPitchTab] = useState<'email' | 'dm' | 'proposal' | 'audit'>('email');
  
  // LIVE OPPORTUNITY SCANNER STATES
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [scanLogIndex, setScanLogIndex] = useState(0);
  const [counterValue, setCounterValue] = useState(0);
  
  const scanLogs = [
    'Initializing Google Maps crawler for local listings...',
    'Scraping coordinates for business profiles...',
    'Analyzing domain registry for "AK Fitness"...',
    'Heuristic test failed: NO registered domain detected.',
    'Calculating review deficit vs top 5 gyms...',
    'Running closing probability algorithm...',
    'Generating optimal service proposal fit...'
  ];

  // Auto-run scanner simulation on loop
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (scanStep === 'idle') {
      timer = setTimeout(() => {
        setScanStep('scanning');
      }, 1500);
    } else if (scanStep === 'scanning') {
      setScanLogIndex(0);
      const logInterval = setInterval(() => {
        setScanLogIndex((prev) => {
          if (prev >= scanLogs.length - 1) {
            clearInterval(logInterval);
            setTimeout(() => {
              setScanStep('results');
            }, 500);
            return prev;
          }
          return prev + 1;
        });
      }, 500);
    } else if (scanStep === 'results') {
      // Animate score count up
      setCounterValue(0);
      const scoreInterval = setInterval(() => {
        setCounterValue(prev => {
          if (prev >= 90) {
            clearInterval(scoreInterval);
            return 90;
          }
          return prev + 3;
        });
      }, 15);

      timer = setTimeout(() => {
        setScanStep('idle');
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [scanStep]);

  const pricingTiers = [
    {
      name: 'Free Starter',
      monthlyPrice: '$0',
      yearlyPrice: '$0',
      desc: 'Test the workflow on local listings.',
      features: ['20 scan credits / month', 'Basic audit templates', 'Outreach copy draft limits'],
      cta: 'Start Free Trial',
      popular: false,
    },
    {
      name: 'Pro Finder',
      monthlyPrice: '$29',
      yearlyPrice: '$23',
      desc: 'For individual consultants and solo prospectors.',
      features: ['1,000 scan credits / month', 'AI Opportunity Score breakdown', 'Custom SEO & Web audits', 'CSV list exports'],
      cta: 'Upgrade to Pro',
      popular: false,
    },
    {
      name: 'Agency Scale',
      monthlyPrice: '$79',
      yearlyPrice: '$63',
      desc: 'Designed for high-growth cold outreach agencies.',
      features: ['5,000 scan credits / month', 'Team accounts (up to 5 seats)', 'AI Pitch proposals generator', 'CSV data exports'],
      cta: 'Get Agency Access',
      popular: true,
    },
    {
      name: 'Enterprise Custom',
      monthlyPrice: 'Custom',
      yearlyPrice: 'Custom',
      desc: 'High-frequency dedicated API limits.',
      features: ['Unlimited monthly scan runs', 'White-labeled audit widgets', 'Custom API proxy servers', '24/7 account support'],
      cta: 'Talk to Sales',
      popular: false,
    }
  ];

  const faqItems = [
    { q: 'How does LocalRadar discover leads?', a: 'We scan Google place APIs, domain registers, and local index lists based on your targets to extract contact info, reviews ratings, and layout parameters.' },
    { q: 'Is there a contract required?', a: 'No. All plans are billed month-to-month or annually and you can downgrade, cancel, or switch accounts in one click.' },
    { q: 'What is the LocalRadar Score?', a: 'It is an AI-driven index from 0 to 100 calculated by cross-analyzing website responsiveness (25%), reviews velocity (25%), local SEO tags (20%), GBP map records (15%), and social links (15%).' },
    { q: 'How does the AI Audit generate advice?', a: 'Our engine runs raw scraped metadata through custom DeepSeek GPT prompts to structure custom proposals listing code errors and copy pitches.' },
    { q: 'Can I export lists in CSV formats?', a: 'Yes! Pro and Agency tiers support one-click exports containing addresses, ratings, phone numbers, and domains.' },
    { q: 'Can I plug in my own OpenRouter / DeepSeek keys?', a: 'Yes. In the Settings tab, you can input your OpenRouter API key to call models like DeepSeek v4 Flash directly, bypassing monthly credit restrictions.' },
    { q: 'Does it support international locations?', a: 'Yes, LocalRadar queries places databases across the United States, India, Canada, the United Kingdom, and Australia.' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0E0C] p-3 sm:p-6 md:p-10 lg:p-14 font-sans selection:bg-[#0B7A5E]/20 selection:text-[#0B7A5E] relative overflow-hidden flex items-center justify-center">
      {/* Ambient depth — warm pine glow, not a flat neon gradient */}
      <div className="pointer-events-none absolute -top-1/4 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-[radial-gradient(ellipse_at_center,rgba(11,122,94,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 w-[50vw] h-[50vh] bg-[radial-gradient(ellipse_at_bottom_right,rgba(40,30,18,0.45),transparent_70%)]" />

      {/* Centered Website Container - Framed Layout */}
      <div className="w-full max-w-7xl bg-[#FBFAF7] text-[#0F0F11] rounded-[24px] sm:rounded-[36px] lg:rounded-[48px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.5)] ring-1 ring-black/5 border border-white/40 overflow-hidden relative flex flex-col min-h-screen">
        
        {/* Navbar */}
        <nav className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-[#E5E5E8] z-50 px-6 py-4 flex-shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#0F0F11]">
              <svg className="w-5 h-5 text-[#0B7A5E]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="7" height="7" rx="2" fill="currentColor" />
                <rect x="14" y="3" width="7" height="7" rx="2" fill="currentColor" />
                <rect x="3" y="14" width="7" height="7" rx="2" fill="currentColor" />
                <rect x="14" y="14" width="7" height="7" rx="2" fill="currentColor" />
              </svg>
              <span className="font-serif italic font-extrabold tracking-wide text-xl">LocalRadar</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8 text-[11px] font-bold text-[#5C5C64] tracking-widest uppercase">
              <a href="#scanner" className="hover:text-[#0F0F11] transition-colors">Scanner</a>
              <a href="#how-it-works" className="hover:text-[#0F0F11] transition-colors">Workflow</a>
              <a href="#results" className="hover:text-[#0F0F11] transition-colors">Results</a>
              <a href="#pricing" className="hover:text-[#0F0F11] transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-[#0F0F11] transition-colors">FAQ</a>
            </div>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-[#5C5C64] hover:text-[#0F0F11] text-xs font-bold transition-colors">
                Login
              </Link>
              <Link 
                href="/login" 
                className="bg-[#0B7A5E] hover:bg-[#075E48] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all cursor-pointer shadow-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* SECTION 1: Massive Hero */}
        <header className="px-6 pt-20 pb-12 max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 bg-[#0B7A5E]/10 border border-[#0B7A5E]/20 px-4 py-1.5 rounded-full text-[10px] font-bold text-[#0B7A5E] tracking-widest uppercase mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI-POWERED LOCAL OUTREACH ENGINE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-7xl font-serif font-light text-[#0F0F11] tracking-tight leading-[1.05] max-w-4xl mx-auto"
          >
            Find local businesses <br />
            <span className="bg-gradient-to-r from-[#0B7A5E] to-[#15A37B] bg-clip-text text-transparent font-normal italic">losing customers</span> online.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#5C5C64] text-xs sm:text-sm max-w-xl mx-auto mt-6 leading-relaxed font-sans"
          >
            LocalRadar scans local markets to identify businesses with critical revenue leaks, designs custom service packages, and drafts response-optimized pitches in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-8"
          >
            <Link 
              href="/login" 
              className="bg-[#0B7A5E] hover:bg-[#075E48] text-white text-xs font-bold px-7 py-3.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer group shadow-lg"
            >
              Start Scanning Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/login"
              className="bg-transparent hover:bg-zinc-50 border border-[#E5E5E8] text-[#0F0F11] text-xs font-bold px-7 py-3.5 rounded-full transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-[#0F0F11] text-[#0F0F11]" />
              Book Growth Demo
            </Link>
          </motion.div>

          {/* Social Proof Badges under CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto border-t border-zinc-100 pt-8 mt-10 text-xs font-mono"
          >
            <div className="text-center">
              <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Join Velocity</span>
              <span className="text-[#0F0F11] font-bold">312 agencies joined this month</span>
            </div>
            <div className="text-center border-x border-zinc-100">
              <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Analysis Pool</span>
              <span className="text-[#0F0F11] font-bold">4,200+ businesses analyzed</span>
            </div>
            <div className="text-center">
              <span className="text-zinc-400 block text-[9px] uppercase tracking-wider">Pipeline Discovered</span>
              <span className="text-emerald-600 font-extrabold">₹4.7Cr+ pipeline found</span>
            </div>
          </motion.div>
        </header>

        {/* SECTION 2: LIVE OPPORTUNITY SCANNER (Replacing empty product frame) */}
        <section id="scanner" className="px-6 py-6 max-w-4xl mx-auto relative z-10 w-full">
          <div className="bg-[#141517] border border-[#26282D] rounded-3xl p-6 shadow-2xl relative overflow-hidden text-white min-h-[360px] flex flex-col justify-between">
            {/* Top green header banner */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#0B7A5E]/40 to-transparent" />
            
            {/* Console Header */}
            <div className="flex items-center justify-between border-b border-[#26282D] pb-4 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B7A5E]/60 animate-ping" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B7A5E] absolute" />
                <span className="text-[10px] text-zinc-400 font-bold tracking-widest ml-3 uppercase font-mono">
                  Live Opportunity Scanner
                </span>
              </div>
              <div className="text-[9px] bg-[#0B0B0C] border border-[#26282D] px-2.5 py-0.5 rounded font-mono text-[#9CA3AF]">
                GPS: ACTIVE SCAN
              </div>
            </div>

            {/* Screen Content Wrapper */}
            <div className="flex-1 flex flex-col justify-center min-h-[200px]">
              <AnimatePresence mode="wait">
                {scanStep === 'idle' && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-10 space-y-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#0B0B0C] border border-[#26282D] flex items-center justify-center mx-auto text-[#0B7A5E]">
                      <Search className="w-5 h-5 animate-pulse" />
                    </div>
                    <h4 className="text-sm font-bold font-mono text-white">READY TO DIAGNOSE LOCAL MARKET</h4>
                    <p className="text-[#9CA3AF] text-[10px] font-mono max-w-sm mx-auto">
                      Standing by... Initializing local database query coordinates.
                    </p>
                  </motion.div>
                )}

                {scanStep === 'scanning' && (
                  <motion.div 
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-md mx-auto space-y-3.5 py-4 w-full text-left font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-4 h-4 text-[#0B7A5E] animate-spin" />
                      <span className="text-xs text-[#9CA3AF]">Resolving local business registries...</span>
                    </div>
                    
                    <div className="bg-[#0B0B0C] border border-[#26282D] p-4 rounded-xl space-y-2 text-[10px] text-zinc-400 shadow-inner">
                      {scanLogs.slice(0, scanLogIndex + 1).map((log, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[#0B7A5E] font-bold">▶</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {scanStep === 'results' && (
                  <motion.div 
                    key="results"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left font-mono"
                  >
                    {/* Leads details */}
                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <span className="text-[8px] font-bold text-[#0B7A5E] uppercase tracking-wider">Identified Target</span>
                        <h4 className="text-base font-serif font-extrabold text-white mt-0.5">AK Fitness Gym & Boxing</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">102 N Peak St, Dallas, TX 75226</p>
                      </div>

                      <div className="border-t border-[#26282D] pt-3.5 space-y-2.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Google Rating Check:</span>
                          <span className="text-[#F59E0B] font-bold">⭐ 3.8 (Low Rating)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Website Status:</span>
                          <span className="text-[#EF4444] font-bold">No Website Detected</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Top Vulnerability:</span>
                          <span className="text-[#EF4444] font-bold">Missing Mobile Booking Funnel</span>
                        </div>
                      </div>
                    </div>

                    {/* Score detail card */}
                    <div className="bg-[#0B0B0C] border border-[#26282D] p-4 rounded-xl flex flex-col justify-between">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-zinc-500">OPPORTUNITY</span>
                          <span className="text-[9px] text-[#22C55E] font-bold">74% CLOSE RATE</span>
                        </div>

                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-[#0B7A5E]">{counterValue}</span>
                          <span className="text-[10px] text-zinc-500">/ 100</span>
                        </div>

                        <div className="space-y-1 text-[9px] border-t border-[#26282D] pt-2.5">
                          <div className="flex justify-between text-zinc-500">
                            <span>Est. Deal Value</span>
                            <span className="text-white font-bold">₹55k - ₹2.3L</span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href="/login"
                        className="w-full text-center bg-[#0B7A5E] hover:bg-[#075E48] text-white text-[10px] font-bold py-2 rounded-lg mt-4 block transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                      >
                        Generate AI Pitch
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Bottom bar indicator */}
            <div className="border-t border-[rgba(255,255,255,0.05)] pt-3 text-[9px] text-zinc-500 font-mono flex items-center justify-between mt-4">
              <span>GPS Crawler: Dallas, TX Range</span>
              <span>System: 100% Deterministic Signals</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: Pain Section */}
        <section id="how-it-works" className="px-6 py-20 text-center max-w-5xl mx-auto space-y-8 relative z-10 border-t border-[#E5E5E8]">
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-[#0B7A5E] uppercase tracking-widest">PROSPECTING IS BROKEN</p>
            <h2 className="text-3xl sm:text-6xl font-serif text-[#0F0F11] tracking-tight leading-[1.1] max-w-3xl mx-auto">
              Opening Google Maps <span className="text-zinc-400">again.</span> <br />
              Checking websites <span className="text-zinc-400">again.</span> <br />
              Copying emails <span className="text-zinc-400">again.</span> <br />
              Getting ignored <span className="text-zinc-400">again.</span>
            </h2>
          </div>

          {/* Pain Stats Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto pt-6 text-xs font-mono">
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 p-4 rounded-xl">
              <Clock className="w-5 h-5 text-[#EF4444] mx-auto mb-2" />
              <span className="text-[#0F0F11] font-bold block">15+ Hours Wasted</span>
              <span className="text-zinc-500 text-[10px] mt-1 block">Spent copy-pasting profiles into lists.</span>
            </div>
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 p-4 rounded-xl">
              <DollarSign className="w-5 h-5 text-[#EF4444] mx-auto mb-2" />
              <span className="text-[#0F0F11] font-bold block">₹1.8L Revenue Lost</span>
              <span className="text-zinc-500 text-[10px] mt-1 block">Due to pitches targeting the wrong fits.</span>
            </div>
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 p-4 rounded-xl">
              <Users className="w-5 h-5 text-[#EF4444] mx-auto mb-2" />
              <span className="text-[#0F0F11] font-bold block">90% Clients Missed</span>
              <span className="text-zinc-500 text-[10px] mt-1 block">Ignoring hot leads that need site redesigns.</span>
            </div>
          </div>
        </section>

        {/* SECTION 4: Before vs After Workflow */}
        <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 relative z-10 border-t border-[#E5E5E8]">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-[#0B7A5E] uppercase tracking-widest">OUTREACH PARADIGM SHIFT</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#0F0F11] tracking-tight">Manual Guesswork vs Automated Intelligence</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
            {/* Before: Manual */}
            <div className="bg-[#EF4444]/5 border border-[#EF4444]/20 p-6 rounded-3xl space-y-5 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-[#EF4444] bg-[#EF4444]/10 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  Without LocalRadar
                </span>
                <span className="text-zinc-500 font-mono text-[9px]">MANUAL FLOW</span>
              </div>
              
              <h4 className="text-lg font-serif font-bold text-[#0F0F11]">The Slow Guesswork Loop</h4>
              
              {/* Visual Workflow Steps */}
              <div className="flex flex-col gap-2.5 font-mono text-[10px] text-zinc-500">
                {[
                  { label: 'Google Maps', desc: 'Scrolling and copying profile details one-by-one' },
                  { label: 'Website Check', desc: 'Opening site to inspect responsiveness issues' },
                  { label: 'Review Check', desc: 'Counting rating numbers and response gaps' },
                  { label: 'Outreach', desc: 'Drafting generic cold emails to general addresses' },
                  { label: 'Guess', desc: 'Waiting for response without conversion probability context' }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white border border-[#EF4444]/10 p-2 rounded-lg">
                    <span className="w-5 h-5 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center font-bold">{idx+1}</span>
                    <span className="font-extrabold text-[#EF4444] min-w-[90px]">{step.label}</span>
                    <span className="truncate">{step.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* After: LocalRadar */}
            <div className="bg-[#0B7A5E]/5 border border-[#0B7A5E]/20 p-6 rounded-3xl space-y-5 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-[#0B7A5E] bg-[#0B7A5E]/15 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                  With LocalRadar
                </span>
                <span className="text-[#0B7A5E] font-mono text-[9px] font-bold">AUTOMATED INTELLIGENCE</span>
              </div>
              
              <h4 className="text-lg font-serif font-bold text-[#0F0F11]">The Direct Revenue Discovery Loop</h4>
              
              {/* Visual Workflow Steps */}
              <div className="flex flex-col gap-2.5 font-mono text-[10px] text-[#0B7A5E]">
                {[
                  { label: 'Search Niche', desc: 'Scan any target city and category automatically' },
                  { label: 'Opportunity Score', desc: 'Instantly isolate businesses with score > 60' },
                  { label: 'AI Audit Report', desc: 'Auto-identify website code errors and review gaps' },
                  { label: 'AI Pitch Copy', desc: 'Copy tailored sequences highlighting exact vulnerabilities' },
                  { label: 'Close Client', desc: 'Convert qualified prospects with deterministic estimates' }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white border border-[#0B7A5E]/10 p-2 rounded-lg shadow-sm">
                    <span className="w-5 h-5 rounded-full bg-[#0B7A5E]/15 text-[#0B7A5E] flex items-center justify-center font-bold">{idx+1}</span>
                    <span className="font-extrabold text-[#0B7A5E] min-w-[110px]">{step.label}</span>
                    <span className="truncate text-zinc-500">{step.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: How Agencies Use LocalRadar */}
        <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 border-t border-[#E5E5E8] relative z-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-[#0B7A5E] uppercase tracking-widest">ICP SOLUTIONS</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#0F0F11] tracking-tight">Tailored workflows for your agency model</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { tag: 'Web Designers', title: 'Pitch Site Redesigns', desc: 'Target local profiles missing a custom website or running legacy designs. Pitch responsive web layouts.' },
              { tag: 'SEO Agencies', title: 'Sell Local Rankings', desc: 'Identify profiles losing rankings due to review response deficits. Propose Maps optimization campaigns.' },
              { tag: 'AI Automation', title: 'Sell Voice & Booking Schedulers', desc: 'Isolate businesses with high rating score but no booking systems. Integrate appointment automation.' },
              { tag: 'Marketing Consultants', title: 'Reputation Management', desc: 'Target profiles with reviews rating below 4.0. Pitch review acquisition engines.' }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#F9F9FB] border border-[#E5E5E8] p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-mono">{item.tag}</span>
                  <h4 className="text-sm font-serif font-bold text-[#0F0F11] mt-2">{item.title}</h4>
                  <p className="text-[#5C5C64] text-[11px] leading-relaxed mt-2">{item.desc}</p>
                </div>
                <Link href="/login" className="text-[10px] text-[#0B7A5E] font-bold mt-6 flex items-center gap-1 group">
                  Try this workflow
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: LocalRadar Score™ Showcase (Three Metrics) */}
        <section className="px-6 py-24 bg-[#F9F9FB]/50 border-t border-[#E5E5E8] relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Giant Metrics Viz Card */}
            <div className="flex justify-center relative">
              <div className="absolute inset-0 bg-[#0B7A5E]/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="bg-white border border-[#E5E5E8] p-6 max-w-md w-full rounded-3xl relative text-left space-y-6 shadow-xl">
                <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                  <span className="text-[10px] font-bold text-zinc-400 font-mono">PROPRIETARY METRICS</span>
                  <span className="text-[10px] font-bold text-[#0B7A5E] bg-[#0B7A5E]/10 px-2 py-0.5 rounded font-mono">Dossier active</span>
                </div>

                <div className="grid grid-cols-3 gap-3 font-mono text-center">
                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl relative">
                    <span className="text-[8px] font-bold text-zinc-400 block uppercase">Opp Score</span>
                    <span className="text-2xl font-extrabold text-[#0B7A5E] block mt-1">90</span>
                    <span className="text-[8px] text-[#0B7A5E] font-bold uppercase tracking-wider block mt-1">HIGH</span>
                  </div>

                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[8px] font-bold text-zinc-400 block uppercase">Close Prob</span>
                    <span className="text-2xl font-extrabold text-[#22C55E] block mt-1">74%</span>
                    <span className="text-[8px] text-zinc-500 block mt-1 font-bold">Optimal</span>
                  </div>

                  <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <span className="text-[8px] font-bold text-zinc-400 block uppercase">Deal Value</span>
                    <span className="text-[11px] font-extrabold text-[#0F0F11] block mt-2.5">₹55k-₹2.3L</span>
                    <span className="text-[8px] text-zinc-500 block mt-1 font-bold">Estimate</span>
                  </div>
                </div>

                <div className="border-t border-zinc-100 pt-4 space-y-2 text-[10px] text-zinc-500 font-mono">
                  <div className="flex justify-between">
                    <span>Website Opportunity:</span>
                    <span className="text-zinc-600">30 / 30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Review Gap Deficit:</span>
                    <span className="text-zinc-600">20 / 25</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Google Business Weakness:</span>
                    <span className="text-zinc-600">15 / 20</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Text explanation */}
            <div className="space-y-6 text-left">
              <span className="text-[10px] font-bold text-[#0B7A5E] bg-[#0B7A5E]/10 border border-[#0B7A5E]/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                THE SYSTEM CORE
              </span>
              <h2 className="text-3xl sm:text-5xl font-serif text-[#0F0F11] tracking-tight leading-[1.1]">
                The LocalRadar Score™
              </h2>
              <p className="text-[#5C5C64] text-xs sm:text-sm leading-relaxed">
                Evaluating local business listings based on 100% deterministic parameters. The lower the score, the higher the website opportunity—meaning it is a prime target for your web design, SEO, or automated booking service packages.
              </p>
              <div className="space-y-3.5 text-zinc-600 text-xs pt-1">
                <div className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-[#0B7A5E] shrink-0 mt-0.5" />
                  <p><strong className="text-[#0F0F11]">Opportunity Score</strong> — evaluates site responsiveness, review velocity, and Maps listing gaps.</p>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-4 h-4 text-[#0B7A5E] shrink-0 mt-0.5" />
                  <p><strong className="text-[#0F0F11]">Closing Probability</strong> — predicts transaction velocity from business owner activity markers.</p>
                </div>
                <div className="flex items-start gap-3">
                  <DollarSign className="w-4 h-4 text-[#0B7A5E] shrink-0 mt-0.5" />
                  <p><strong className="text-[#0F0F11]">Estimated Deal Value</strong> — maps services automatically based on local gap priorities.</p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* SECTION 7: AUDIT PREVIEW */}
        <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 border-t border-[#E5E5E8] relative z-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-[#0B7A5E] uppercase tracking-widest">DIAGNOSTIC REPORT</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#0F0F11] tracking-tight">Real-time local audits to build authority</h2>
          </div>

          <div className="bg-white border border-[#E5E5E8] p-6 max-w-3xl mx-auto text-left rounded-3xl relative overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E5E5E8] pb-4 mb-5 gap-2">
              <div>
                <p className="text-xs font-bold text-[#0F0F11]">Dallas Dental Clinic</p>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">8383 Preston Rd, Dallas, TX 75225</p>
              </div>
              <span className="text-xs font-bold text-[#0B7A5E] bg-[#0B7A5E]/10 border border-[#0B7A5E]/20 px-3 py-1 rounded-full w-fit">
                42/100 (High Opportunity)
              </span>
            </div>

            <div className="space-y-4">
              <div className="bg-[#EF4444]/5 border border-[#EF4444]/15 p-3 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#0F0F11]">Revenue Leak Detection</p>
                  <p className="text-[10px] text-zinc-500 mt-1">No mobile responsive booking system. High visitor bounce rate is causing direct transaction leakage.</p>
                </div>
              </div>

              <div className="bg-[#F59E0B]/5 border border-[#F59E0B]/15 p-3 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#0F0F11]">Review Gap Analysis</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Client has 14 reviews while competitors average 240+ reviews. A massive reputation deficit hurts search index ranking.</p>
                </div>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-[#0F0F11]">Competitor Gap Analysis</p>
                  <p className="text-[10px] text-zinc-500 mt-1">Target ranking positions are lower than competitors due to unclaimed GBP listing metadata and missing local citations.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: AI Pitch Generator Example (Tabs) */}
        <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 border-t border-[#E5E5E8] relative z-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-[#0B7A5E] uppercase tracking-widest">OUTREACH CONVERSION</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#0F0F11] tracking-tight">Make them imagine the results</h2>
          </div>

          <div className="bg-white border border-[#E5E5E8] p-6 rounded-3xl max-w-3xl mx-auto flex flex-col min-h-[350px] justify-between shadow-sm">
            <div>
              {/* Outreach selection tabs */}
              <div className="flex border-b border-[#E5E5E8] pb-3 mb-6 gap-2 overflow-x-auto">
                {[
                  { id: 'email', name: 'Cold Email', icon: Mail },
                  { id: 'dm', name: 'Cold DM', icon: MessageSquare },
                  { id: 'proposal', name: 'Proposal', icon: FileText },
                  { id: 'audit', name: 'Website Audit', icon: Globe }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = pitchTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setPitchTab(tab.id as any)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#0B7A5E]/15 border border-[#0B7A5E]/30 text-[#0B7A5E]' 
                          : 'text-zinc-400 hover:text-zinc-600'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.name}
                    </button>
                  );
                })}
              </div>

              {/* Simulated text output */}
              <pre className="text-xs text-zinc-700 font-mono leading-relaxed bg-[#F9F9FB] border border-[#E5E5E8] p-5 rounded-xl whitespace-pre-wrap text-left select-all">
                {pitchTab === 'email' && (
                  `Subject: Question about Dallas Dental Clinic's website
 
Hi Team,
 
I came across your place listing on Google and noticed your clinic has solid ratings (3.8 stars) but lacks a configured website link. 
 
This is costing you booking appointments daily. Our diagnostic tool scored your local search visibility at 42/100 due to:
• Missing Mobile Responsive Web Portal
• 12 reviews remaining unanswered (Google map-pack penalty)
 
We specialize in designing conversion websites for Dallas orthodontists. Can we connect for 5 mins this Thursday to discuss?
 
Best,
[Your Name]`
                )}
                {pitchTab === 'dm' && (
                  `Hey Team at Dallas Dental! 👋
 
Love your maps ratings. I noticed that 12 of your patient reviews don't have replies from the owner. 
 
Google Maps deprioritizes listings that ignore reviews. We wrote a quick checklist showing how you can fix this in 5 mins to rank higher. Mind if I drop the link here?`
                )}
                {pitchTab === 'proposal' && (
                  `# Web Redesign & Rankings Retainer Proposal
 
Prepared for: Dallas Dental Clinic
 
## Critical Issues Identified:
- No website domain linked on Map profiles.
- Unclaimed GBP listings metadata.
 
## Action Plan & Pricing:
1. Setup responsive landing page with patient appointment capture form ($2,500)
2. Setup local maps optimization & review reply campaign ($499/mo)
 
Approved by: ______________`
                )}
                {pitchTab === 'audit' && (
                  `# Technical Website & SEO Audit Report
 
Target: Dallas Dental Clinic
Status: CRITICAL OPPORTUNITY (42/100 Score)
 
Outcomes of Analysis:
- Website Link: MISSING (Direct loss of 85% mobile organic traffic)
- Review Gap vs Top 5 competitors: -224 reviews deficit
- Inactive GBP: 12 unanswered patient comments`
                )}
              </pre>
            </div>

            <div className="text-[10px] text-zinc-400 text-left border-t border-[#E5E5E8] pt-4 mt-6 font-mono">
              ✓ Generated instantly based on maps database metrics.
            </div>
          </div>
        </section>

        {/* SECTION 9: Case Studies / RESULTS */}
        <section id="results" className="px-6 py-20 max-w-6xl mx-auto space-y-12 border-t border-[#E5E5E8] relative z-10">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-[#0B7A5E] uppercase tracking-widest">PROVED AGENCY RESULTS</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#0F0F11] tracking-tight">Real pipeline generated by users</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            {[
              {
                leads: 124,
                meetings: 11,
                closed: 3,
                revenue: '₹2.4L',
                agency: 'SEO Consultant'
              },
              {
                leads: 89,
                meetings: 7,
                closed: 2,
                revenue: '₹1.7L',
                agency: 'Web Designer'
              },
              {
                leads: 205,
                meetings: 18,
                closed: 4,
                revenue: '₹3.1L',
                agency: 'AI Automation'
              }
            ].map((card, idx) => (
              <div key={idx} className="bg-white border border-[#E5E5E8] p-5 rounded-2xl text-left space-y-4 shadow-sm relative group hover:border-[#0B7A5E]/40 transition-colors">
                <span className="text-[8px] font-bold text-[#0B7A5E] uppercase tracking-widest">Pipeline Dossier</span>
                
                <div className="grid grid-cols-2 gap-3.5 border-y border-zinc-100 py-3">
                  <div>
                    <span className="text-zinc-500 block text-[9px]">Leads Scanned</span>
                    <span className="text-white bg-[#0F0F11] px-1.5 py-0.5 rounded font-bold">{card.leads} Found</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px]">Meetings Set</span>
                    <span className="text-white bg-[#0F0F11] px-1.5 py-0.5 rounded font-bold">{card.meetings} Booked</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px]">Pitches Closed</span>
                    <span className="text-emerald-600 font-extrabold">{card.closed} Deals</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-[9px]">Revenue Output</span>
                    <span className="text-emerald-600 font-extrabold text-sm">{card.revenue}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-zinc-400 text-[10px]">User Focus</span>
                  <span className="text-[#0F0F11] font-bold">{card.agency}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 10: Pricing with Average ROI & Prospection Comparison */}
        <section id="pricing" className="px-6 py-20 max-w-7xl mx-auto space-y-12 border-t border-[#E5E5E8] relative z-10">
          <div className="text-center space-y-4">
            <span className="text-[10px] font-bold text-[#0B7A5E] uppercase tracking-widest">TRANSPARENT TARIFFS</span>
            <h2 className="text-2xl sm:text-5xl font-serif text-[#0F0F11] tracking-tight">Flexible plans for any growth stage</h2>
            
            {/* Average ROI block */}
            <div className="inline-flex items-center gap-2 bg-[#0B7A5E]/5 border border-[#0B7A5E]/20 px-4 py-2.5 max-w-md mx-auto rounded-xl text-xs font-mono text-[#0B7A5E]">
              <Target className="w-3.5 h-3.5 shrink-0" />
              <span><strong>Average ROI</strong> — close 1 client and pay for LocalRadar for years.</span>
            </div>

            {/* Monthly/Yearly toggle */}
            <div className="flex items-center justify-center gap-3 pt-4 font-sans">
              <span className={`text-xs font-semibold ${billingPeriod === 'monthly' ? 'text-[#0F0F11]' : 'text-zinc-400'}`}>Monthly Billing</span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="w-11 h-6 bg-[#F4F4F6] rounded-full p-0.5 transition-all relative border border-[#E5E5E8] cursor-pointer"
              >
                <div 
                  className={`w-4.5 h-4.5 bg-[#0B7A5E] rounded-full transition-all ${
                    billingPeriod === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${billingPeriod === 'yearly' ? 'text-[#0F0F11]' : 'text-zinc-400'} flex items-center gap-1.5`}>
                Yearly Billing
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase font-mono">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch font-sans">
            {pricingTiers.map((tier) => (
              <div 
                key={tier.name}
                className={`p-5 rounded-3xl border flex flex-col justify-between transition-all duration-300 relative ${
                  tier.popular 
                    ? 'bg-[#0B7A5E]/5 border-[#0B7A5E] shadow-md scale-102 z-10' 
                    : 'bg-white border-[#E5E5E8] hover:border-zinc-300'
                }`}
              >
                {tier.popular && (
                  <span className="absolute top-[-10px] right-4 bg-[#0B7A5E] text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm font-mono">
                    Most Popular
                  </span>
                )}

                <div>
                  <h4 className="text-xs font-bold text-[#0F0F11]">{tier.name}</h4>
                  <p className="text-[10px] text-[#5C5C64] leading-relaxed mt-1">{tier.desc}</p>
                  <div className="mt-4 flex items-baseline border-b border-[#E5E5E8] pb-4">
                    <span className="text-3xl font-serif font-extrabold text-[#0F0F11]">
                      {billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                    </span>
                    {tier.monthlyPrice !== 'Custom' && (
                      <span className="text-[10px] text-zinc-400 font-semibold ml-1">/mo</span>
                    )}
                  </div>

                  <ul className="mt-5 space-y-2.5 text-[10px] text-zinc-500 font-mono">
                    {tier.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#0B7A5E] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href="/login"
                  className={`w-full text-center text-xs font-bold py-3 rounded-xl mt-8 block transition-all ${
                    tier.popular
                      ? 'bg-[#0B7A5E] hover:bg-[#075E48] text-white shadow-sm'
                      : 'bg-[#F4F4F6] hover:bg-[#E5E5E8] border border-[#E5E5E8] text-[#0F0F11]'
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Prospecting Velocity Comparison Block */}
          <div className="max-w-xl mx-auto bg-zinc-50 border border-zinc-200 p-5 rounded-2xl font-mono text-xs text-left space-y-3 shadow-inner mt-8">
            <h4 className="font-extrabold text-[#0F0F11] uppercase tracking-wider text-[10px]">Prospecting Speed Check</h4>
            <div className="space-y-2 leading-relaxed">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-red-500" /> Manual Prospecting:
                </span>
                <span className="text-red-500 font-extrabold">10+ Hours / Week</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" /> LocalRadar Engine:
                </span>
                <span className="text-emerald-600 font-extrabold">10 Minutes / Week</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 11: FAQ */}
        <section id="faq" className="px-6 py-20 max-w-4xl mx-auto space-y-12 border-t border-[#E5E5E8] relative z-10 w-full font-sans">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-bold text-[#0B7A5E] uppercase tracking-widest">COMMON ENQUIRIES</span>
            <h2 className="text-2xl sm:text-4xl font-serif text-[#0F0F11] tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => (
              <div key={idx} className="bg-white border border-[#E5E5E8] rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between text-xs sm:text-sm font-semibold text-[#0F0F11] cursor-pointer"
                >
                  <span>{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-zinc-400 transform transition-transform ${activeFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-5 pt-0 text-xs text-[#5C5C64] leading-relaxed border-t border-[#E5E5E8]">
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 12: Final CTA */}
        <section className="px-6 py-20 text-center max-w-4xl mx-auto relative z-10 border-t border-[#E5E5E8] w-full">
          <div className="bg-[#0B7A5E]/5 p-10 md:p-14 relative overflow-hidden border border-[#0B7A5E]/20 rounded-3xl shadow-sm">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#0B7A5E]/5 rounded-full blur-3xl" />
            
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#0F0F11] tracking-tight leading-none">
              Your next client <br />
              is already on Google Maps.
            </h2>
            <p className="text-zinc-500 text-xs sm:text-sm max-w-sm mx-auto mt-4 leading-relaxed font-sans">
              Businesses are losing customers online right now. Find them before your competitors do.
            </p>

            <div className="mt-8 flex justify-center">
              <Link 
                href="/login" 
                className="bg-[#0B7A5E] hover:bg-[#075E48] text-white text-xs font-bold px-6 py-3.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#E5E5E8] bg-white px-6 py-10 text-center text-[10px] text-zinc-400 relative z-10 flex-shrink-0 font-mono">
          <p>© 2026 LocalRadar SaaS Inc. All rights reserved.</p>
          <p className="mt-1 text-zinc-300">Built with Next.js 16, Supabase, Tailwind, & Framer Motion.</p>
        </footer>

      </div>
    </div>
  );
}
