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
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

export default function RedesignedLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoNiche, setDemoNiche] = useState('Dentists');
  const [demoCity, setDemoCity] = useState('Dallas, TX');
  const [demoStep, setDemoStep] = useState<'idle' | 'scanning' | 'results'>('idle');
  const [demoScanIndex, setDemoScanIndex] = useState(0);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [pitchTab, setPitchTab] = useState<'email' | 'dm' | 'proposal'>('email');
  
  // Custom states for interactive demo
  const [selectedDemoBiz, setSelectedDemoBiz] = useState<number>(0);

  const demoLeads = [
    { name: 'Dallas Dental Spa', website: '', rating: 3.4, reviews: 14, phone: '(214) 555-0199', score: 38, opportunity: 'High', dealVal: 3800 },
    { name: 'Metroplex Smile Care', website: 'https://metroplexsmiles.com', rating: 4.0, reviews: 290, phone: '(214) 555-7832', score: 58, opportunity: 'Medium', dealVal: 2200 },
    { name: 'Preston Hollow Dentistry', website: '', rating: 3.8, reviews: 9, phone: '(214) 555-9011', score: 29, opportunity: 'High', dealVal: 4500 },
    { name: 'North Texas Ortho Group', website: 'https://northtexasortho.net', rating: 4.8, reviews: 412, phone: '(214) 555-3344', score: 84, opportunity: 'Low', dealVal: 1200 },
  ];

  const demoScans = [
    'Connecting to place index API...',
    'Scraping listings coordinates...',
    'Analyzing mobile performance metrics...',
    'Checking Google Business verification flags...',
    'Finalizing opportunities calculations...'
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (demoStep === 'scanning') {
      setDemoScanIndex(0);
      interval = setInterval(() => {
        setDemoScanIndex((prev) => {
          if (prev >= demoScans.length - 1) {
            clearInterval(interval);
            setDemoStep('results');
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(interval);
  }, [demoStep]);

  const handleStartDemoScan = () => {
    setDemoStep('scanning');
  };

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
    { q: 'How does LocalRadar discover leads?', a: 'We scan Google place APIs, domain registers, and local index lists based on your inputs to extract contact info, reviews ratings, and layout parameters.' },
    { q: 'Is there a contract required?', a: 'No. All plans are billed month-to-month or annually and you can downgrade, cancel, or switch accounts in one click.' },
    { q: 'What is the LocalRadar Score?', a: 'It is an AI-driven index from 0 to 100 calculated by cross-analyzing website responsiveness (25%), reviews velocity (25%), local SEO tags (20%), GBP map records (15%), and social links (15%).' },
    { q: 'How does the AI Audit generate advice?', a: 'Our engine runs raw scraped metadata through custom DeepSeek GPT prompts to structure custom proposals listing code errors and copy pitches.' },
    { q: 'Can I export lists in CSV formats?', a: 'Yes! Pro and Agency tiers support one-click exports containing addresses, ratings, phone numbers, and domains.' },
    { q: 'Can I plug in my own OpenRouter / DeepSeek keys?', a: 'Yes. In the Settings tab, you can input your OpenRouter API key to call models like DeepSeek v4 Flash directly, bypassing monthly credit restrictions.' },
    { q: 'Does it support international locations?', a: 'Yes, LocalRadar queries places databases across the United States, Canada, the United Kingdom, and Australia.' },
    { q: 'Can I add teammates to my account?', a: 'Yes, the Agency Tier includes up to 5 user logins sharing credits, historical searches, and lead collections.' },
    { q: 'Is there a setup fee?', a: 'No setup fees whatsoever. You pay only the recurring software cost and can launch your campaigns instantly.' },
    { q: 'Do you offer a refund policy?', a: 'Yes, if you cancel within 7 days of upgrading and haven\'t used your scan credits, drop us an email for a full refund.' }
  ];

  return (
    <div className="bg-[#050505] text-white min-h-screen relative overflow-hidden antialiased">
      {/* Background glow glows */}
      <div className="absolute top-[-250px] left-[-200px] w-[600px] h-[600px] bg-[#FF2D2D]/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[400px] right-[-200px] w-[700px] h-[700px] bg-[#FF4D4D]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Navbar */}
      <nav className="sticky top-0 bg-[#050505]/80 backdrop-blur-lg border-b border-white/[0.05] z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-wider bg-gradient-to-r from-white via-zinc-200 to-[#FF4D4D] bg-clip-text text-transparent">
            <Sparkles className="w-5 h-5 text-[#FF2D2D]" />
            LOCALRADAR
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-bold text-zinc-400 tracking-wider">
            <a href="#demo" className="hover:text-white transition-colors">DEMO</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">HOW IT WORKS</a>
            <a href="#pricing" className="hover:text-white transition-colors">PRICING</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-zinc-400 hover:text-white text-xs font-bold transition-colors">
              Login
            </Link>
            <Link 
              href="/login" 
              className="bg-gradient-to-r from-[#FF2D2D] to-[#FF4D4D] text-white text-xs font-extrabold px-4.5 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(255,45,45,0.3)] hover:shadow-[0_0_20px_rgba(255,45,45,0.5)] cursor-pointer"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* SECTION 1: Massive Hero */}
      <header className="px-6 pt-24 pb-20 max-w-6xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 bg-[#FF2D2D]/10 border border-[#FF2D2D]/30 px-4 py-1.5 rounded-full text-[10px] font-bold text-white tracking-widest uppercase mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#FF4D4D]" />
          AI-POWERED LOCAL OUTREACH ENGINE
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-7xl font-extrabold text-white tracking-tight leading-[1.05] max-w-4xl mx-auto"
        >
          Find local businesses <br />
          <span className="bg-gradient-to-r from-[#FF2D2D] via-[#FF4D4D] to-white bg-clip-text text-transparent">losing customers</span> online.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto mt-6 leading-relaxed"
        >
          LocalRadar discovers businesses with weak websites, poor SEO, low reviews, and missed revenue opportunities, then drafts custom pitches using DeepSeek AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-8"
        >
          <Link 
            href="/login" 
            className="bg-[#FF2D2D] hover:bg-[#e62222] text-white text-xs font-extrabold px-7 py-4 rounded-xl transition-all shadow-[0_0_25px_rgba(255,45,45,0.35)] flex items-center gap-1.5 cursor-pointer group"
          >
            Start Scanning Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#demo"
            className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] text-white text-xs font-bold px-7 py-4 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white text-white" />
            Watch Product Demo
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase mt-6"
        >
          ⚡ 312 agencies joined this month
        </motion.p>
      </header>

      {/* SECTION 2: Interactive Product Demo */}
      <section id="demo" className="px-6 py-12 max-w-5xl mx-auto relative z-10">
        <div className="glass-panel p-6 shadow-[0_0_80px_rgba(255,45,45,0.04)] border border-white/[0.08] relative overflow-hidden">
          
          {/* Demo header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.08] pb-4 mb-6 gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
              <span className="text-[10px] text-zinc-500 font-bold tracking-widest ml-3 uppercase">LOCALRADAR TERMINAL v1.0</span>
            </div>
            
            {/* Input selectors */}
            <div className="flex items-center gap-2 text-[10px] font-semibold">
              <span className="text-zinc-500">Scanning</span>
              <input
                type="text"
                value={demoNiche}
                onChange={(e) => setDemoNiche(e.target.value)}
                className="bg-white/[0.02] border border-white/[0.08] rounded-lg px-2.5 py-1 text-white w-20 focus:outline-none focus:border-[#FF2D2D]"
                disabled={demoStep === 'scanning'}
              />
              <span className="text-zinc-500">in</span>
              <input
                type="text"
                value={demoCity}
                onChange={(e) => setDemoCity(e.target.value)}
                className="bg-white/[0.02] border border-white/[0.08] rounded-lg px-2.5 py-1 text-white w-24 focus:outline-none focus:border-[#FF2D2D]"
                disabled={demoStep === 'scanning'}
              />
              {demoStep === 'idle' && (
                <button
                  onClick={handleStartDemoScan}
                  className="bg-[#FF2D2D] hover:bg-[#e62222] text-white px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(255,45,45,0.2)]"
                >
                  Scan
                </button>
              )}
            </div>
          </div>

          {/* Interactive display box */}
          <div className="min-h-[300px] flex flex-col justify-center">
            {demoStep === 'idle' && (
              <div className="text-center py-16 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mx-auto text-[#FF2D2D]">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Interactive Sandbox Demonstration</h4>
                <p className="text-zinc-500 text-[10px] max-w-sm mx-auto">
                  Click the **Scan** button in the header config to see how LocalRadar scrapes listings and calculates opportunity scores in real-time.
                </p>
              </div>
            )}

            {demoStep === 'scanning' && (
              <div className="max-w-md mx-auto space-y-4 py-8">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-[#FF2D2D] animate-spin" />
                  <span className="text-xs font-mono text-zinc-400">Processing search queries...</span>
                </div>
                
                <div className="bg-black/30 border border-white/[0.04] p-4 rounded-xl space-y-2 font-mono text-[10px] text-zinc-500 text-left">
                  {demoScans.slice(0, demoScanIndex + 1).map((scan, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[#FF2D2D]">✓</span>
                      <span>{scan}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {demoStep === 'results' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Leads lists */}
                <div className="lg:col-span-2 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                  {demoLeads.map((lead, idx) => {
                    const isSelected = selectedDemoBiz === idx;
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedDemoBiz(idx)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex items-center justify-between ${
                          isSelected 
                            ? 'bg-[#FF2D2D]/10 border-[#FF2D2D]/40 shadow-[0_0_15px_rgba(255,45,45,0.08)]' 
                            : 'bg-white/[0.01] border-white/[0.05] hover:bg-white/[0.02]'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{lead.name}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-500">
                            <span>⭐ {lead.rating}</span>
                            <span>•</span>
                            <span>{lead.reviews} reviews</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            lead.score <= 50 
                              ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            Score: {lead.score}
                          </span>
                          <p className="text-[9px] text-zinc-500 mt-1 capitalize">{lead.opportunity} Opportunity</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right detail preview */}
                <div className="glass-panel p-5 border border-white/[0.06] text-left flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-[#FF4D4D] tracking-wider uppercase">Lead Diagnostic</span>
                    <h5 className="text-xs font-bold text-white mt-1">{demoLeads[selectedDemoBiz].name}</h5>
                    
                    <div className="border-t border-white/[0.08] pt-3.5 mt-3.5 space-y-2.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">Website Status:</span>
                        <span className={demoLeads[selectedDemoBiz].website ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {demoLeads[selectedDemoBiz].website ? 'Active Site' : 'No Website Detected'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">Opportunity Level:</span>
                        <span className="text-white font-bold capitalize">{demoLeads[selectedDemoBiz].opportunity}</span>
                      </div>

                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">Est. Retainer Fee:</span>
                        <span className="text-emerald-400 font-bold">${demoLeads[selectedDemoBiz].dealVal}/mo</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/login"
                    className="w-full text-center bg-[#FF2D2D] hover:bg-[#e62222] text-white text-[10px] font-bold py-2 rounded-lg mt-6 block transition-all"
                  >
                    Generate Outreach Pitch
                  </Link>
                </div>

              </div>
            )}
          </div>

        </div>
      </section>

      {/* SECTION 3: Pain Section */}
      <section className="px-6 py-28 text-center max-w-5xl mx-auto space-y-12 relative z-10 border-t border-white/[0.04]">
        <div className="space-y-4">
          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest">PROSPECTING IS BROKEN</p>
          <h2 className="text-3xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1] max-w-3xl mx-auto">
            Opening Google Maps <span className="text-zinc-600">again.</span> <br />
            Checking websites <span className="text-zinc-600">again.</span> <br />
            Copying emails <span className="text-zinc-600">again.</span> <br />
            Getting ignored <span className="text-zinc-600">again.</span>
          </h2>
        </div>

        <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
          Hours wasted. Zero appointments booked. You are selling high-value services to businesses that don\'t want them, while ignoring those losing thousands of dollars every day.
        </p>
      </section>

      {/* SECTION 4: Before vs After */}
      <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 relative z-10 border-t border-white/[0.04]">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-[#FF2D2D] uppercase tracking-widest">OUTREACH PARADIGM SHIFT</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Manual Guesswork vs Automated Intelligence</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Before: Manual */}
          <div className="bg-red-500/[0.01] border border-red-500/10 p-6.5 rounded-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/[0.02] rounded-full blur-2xl" />
            <span className="text-[9px] font-bold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Without LocalRadar
            </span>
            <h4 className="text-lg font-bold text-white">Manual Prospecting Loop</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Scraping maps databases, copy-pasting numbers to sheets, manual page audits, sending generic cold templates, and following up based on memory checks.
            </p>
            <div className="border-t border-white/[0.06] pt-4 mt-2 space-y-2 text-[10px] text-zinc-500 font-mono">
              <div className="flex items-center gap-2">❌ 25 mins per business audit</div>
              <div className="flex items-center gap-2">❌ Generic cold email templates</div>
              <div className="flex items-center gap-2">❌ Missing contact phone checks</div>
            </div>
          </div>

          {/* After: LocalRadar */}
          <div className="bg-[#FF2D2D]/[0.02] border border-[#FF2D2D]/20 p-6.5 rounded-2xl relative overflow-hidden space-y-4 shadow-[0_0_30px_rgba(255,45,45,0.05)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF2D2D]/10 rounded-full blur-2xl" />
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              With LocalRadar
            </span>
            <h4 className="text-lg font-bold text-white">Automated Leads Engine</h4>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Instantly discover hundreds of leads. Let AI audit layout vulnerabilities, map scores, and write personalized outbound messages highlighting their exact issues.
            </p>
            <div className="border-t border-white/[0.06] pt-4 mt-2 space-y-2 text-[10px] text-[#FF2D2D] font-mono">
              <div className="flex items-center gap-2">✓ Scans 100+ leads in 10 seconds</div>
              <div className="flex items-center gap-2">✓ Tailored pitch targeting exact website bugs</div>
              <div className="flex items-center gap-2">✓ Automated closing probability metrics</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: How Agencies Use LocalRadar */}
      <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 border-t border-white/[0.04] relative z-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-[#FF2D2D] uppercase tracking-widest">ICP SOLUTIONS</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Tailored workflows for your agency model</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { tag: 'Web Designers', title: 'Pitch Site Redesigns', desc: 'Scan and target the 25% of local businesses with no website or broken layouts. Pitch custom, high-converting platforms.' },
            { tag: 'SEO Agencies', title: 'Sell Google Positions', desc: 'Identify profiles missing schema markup, sitemaps, or organic meta tags. Offer local map pack acceleration packages.' },
            { tag: 'AI Automation', title: 'Sell AI Voice & Chat', desc: 'Find busy local businesses with slow response times. Integrate automated AI lead capture chatbots.' },
            { tag: 'Marketing Consultants', title: 'Reputation Management', desc: 'Target profiles with reviews rating below 4.0 or unreplied comments. Sell automated feedback loops.' }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-5 border border-white/[0.08] hover:border-[#FF2D2D]/30 transition-all duration-300 flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-widest">{item.tag}</span>
                <h4 className="text-xs font-bold text-white mt-2">{item.title}</h4>
                <p className="text-zinc-400 text-[10px] leading-relaxed mt-2">{item.desc}</p>
              </div>
              <Link href="/login" className="text-[10px] text-[#FF2D2D] font-bold mt-6 flex items-center gap-1 group">
                Try this flow
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: LocalRadar Score™ centerpiece */}
      <section className="px-6 py-24 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent border-t border-white/[0.04] relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Giant Score Viz */}
          <div className="flex justify-center relative">
            <div className="absolute inset-0 bg-[#FF2D2D]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="glass-panel p-8 max-w-sm w-full border border-white/[0.08] relative text-center space-y-6">
              <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.02)" strokeWidth="10" fill="none" />
                  <circle cx="80" cy="80" r="70" stroke="#FF2D2D" strokeWidth="10" strokeDasharray={2 * Math.PI * 70} strokeDashoffset={2 * Math.PI * 70 * (1 - 0.42)} strokeLinecap="round" fill="none" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-white">42/100</span>
                  <span className="text-[9px] text-[#FF2D2D] uppercase font-bold tracking-widest mt-1">HIGH OPPORTUNITY</span>
                </div>
              </div>

              <div className="border-t border-white/[0.08] pt-4 text-left space-y-2 text-[10px] text-zinc-400">
                <div className="flex justify-between">
                  <span>Website Quality (Max 25):</span>
                  <span className="text-red-400 font-bold">0 pts (No Website)</span>
                </div>
                <div className="flex justify-between">
                  <span>Review Strength (Max 25):</span>
                  <span className="text-white font-medium">12 pts (Low Rating)</span>
                </div>
                <div className="flex justify-between">
                  <span>SEO Presence (Max 20):</span>
                  <span className="text-white font-medium">15 pts (Medium SEO)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text explanation */}
          <div className="space-y-6 text-left">
            <span className="text-[10px] font-bold text-[#FF4D4D] bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              THE CENTERPIECE OF OUR INTELLIGENCE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
              The LocalRadar Score™
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
              We evaluate every business profile from 0 to 100. Lower scores indicate major technical gaps—like slow site speeds, unclaimed GBP profiles, negative review velocity, or missing social channels. 
            </p>
            <p className="text-zinc-500 text-xs leading-relaxed">
              For an agency, a low score is a massive green flag. It represents a client that needs your specific marketing packages to survive online.
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 7: AI Audit Example (Real report UI) */}
      <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 border-t border-white/[0.04] relative z-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-[#FF2D2D] uppercase tracking-widest">DIAGNOSTIC VISUALIZATION</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Real audit reports, not icons</h2>
        </div>

        <div className="glass-panel p-6 border border-white/[0.08] max-w-3xl mx-auto text-left relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-5">
            <div>
              <p className="text-xs font-bold text-white">Dallas Orthodontics Practice</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">8383 Preston Rd, Dallas, TX 75225</p>
            </div>
            <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
              42/100 (High Opportunity)
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-red-500/[0.02] border border-red-500/10 p-3 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Website Quality Vulnerability</p>
                <p className="text-[10px] text-zinc-400 mt-1">No active website detected. Business is losing 100% of organic mobile traffic.</p>
              </div>
            </div>

            <div className="bg-amber-500/[0.02] border border-amber-500/10 p-3 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Reputation & Review Gaps</p>
                <p className="text-[10px] text-zinc-400 mt-1">12 Google Business Profile reviews have no owner reply. Google maps visibility index is lowered.</p>
              </div>
            </div>

            <div className="border-t border-white/[0.08] pt-4 mt-6">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Recommended Services to Pitch:</p>
              <div className="flex flex-wrap gap-2 text-[9px] text-[#FF4D4D] font-bold">
                <span className="bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 px-2.5 py-1 rounded-full">Custom Website Design ($3,000)</span>
                <span className="bg-[#FF4D4D]/10 border border-[#FF4D4D]/20 px-2.5 py-1 rounded-full">Reputation Management ($499/mo)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: AI Pitch Generator Example (Interactive Outreach tabs) */}
      <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 border-t border-white/[0.04] relative z-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-[#FF2D2D] uppercase tracking-widest">OUTREACH CONVERSION</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Make them imagine the results</h2>
        </div>

        <div className="glass-panel p-6 border border-white/[0.08] max-w-3xl mx-auto flex flex-col min-h-[350px] justify-between">
          <div>
            {/* Outreach selection tabs */}
            <div className="flex border-b border-white/[0.08] pb-3 mb-6 gap-2">
              {[
                { id: 'email', name: 'Cold Email', icon: Mail },
                { id: 'dm', name: 'Cold DM', icon: MessageSquare },
                { id: 'proposal', name: 'Audit Proposal', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = pitchTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setPitchTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#FF2D2D]/15 border-[#FF2D2D]/30 text-white' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* Simulated text output */}
            <pre className="text-xs text-zinc-300 font-mono leading-relaxed bg-white/[0.01] border border-white/[0.04] p-5 rounded-xl whitespace-pre-wrap text-left select-all">
              {pitchTab === 'email' && (
                `Subject: Question about Dallas Orthodontics's website

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
                `Hey Team at Dallas Orthodontics! 👋

Love your map ratings. I noticed that 12 of your patient reviews don't have replies from the owner. 

Google Maps deprioritizes listings that ignore reviews. We wrote a quick checklist showing how you can fix this in 5 mins to rank higher. Mind if I drop the link here?`
              )}
              {pitchTab === 'proposal' && (
                `# Web Redesign & Rankings Retainer Proposal

Prepared for: Dallas Orthodontics

## Critical Issues Identified:
- No website domain linked on Map profiles.
- Unclaimed GBP listings metadata.

## Action Plan & Pricing:
1. Setup responsive landing page with quick patient appointment capture form ($2,500)
2. Setup local maps optimization & review reply campaign ($499/mo)

Approved by: ______________`
              )}
            </pre>
          </div>

          <div className="text-[10px] text-zinc-500 text-left border-t border-white/[0.08] pt-4 mt-6">
            ✓ Generated instantly based on place place coordinates.
          </div>
        </div>
      </section>

      {/* SECTION 9: Testimonials */}
      <section className="px-6 py-20 max-w-6xl mx-auto space-y-12 border-t border-white/[0.04] relative z-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-[#FF2D2D] uppercase tracking-widest">SUCCESS STORIES</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Loved by top agency founders</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: 'LocalRadar cut my prospecting time by 80%. We closed 3 dentistry redesigns in our first week using the automated website audits.', author: 'Sarah Jenkins', role: 'Founder, Apex Web Studio' },
            { quote: 'The Opportunity Score is pure gold. Being able to show a plumber that they have a 38/100 score makes setting up appointments incredibly easy.', author: 'Marcus Thorn', role: 'CEO, Lone Star local SEO' },
            { quote: 'We run all our cold email sequences using the DeepSeek generated pitches. Response rates jumped from 2.5% to over 12%.', author: 'Dillon Hayes', role: 'Director, Scale Outreach Partners' }
          ].map((test, idx) => (
            <div key={idx} className="glass-panel p-6 border border-white/[0.08] text-left space-y-4">
              <p className="text-zinc-400 text-xs leading-relaxed italic">"{test.quote}"</p>
              <div className="border-t border-white/[0.06] pt-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FF2D2D]/20 border border-[#FF2D2D]/30 flex items-center justify-center text-[10px] font-bold text-white capitalize">
                  {test.author[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{test.author}</p>
                  <p className="text-[9px] text-zinc-500">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 10: Pricing (Modern Stripe style) */}
      <section id="pricing" className="px-6 py-20 max-w-7xl mx-auto space-y-12 border-t border-white/[0.04] relative z-10">
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold text-[#FF2D2D] uppercase tracking-widest">TRANSPARENT TARIFFS</span>
          <h2 className="text-2xl sm:text-5xl font-extrabold text-white tracking-tight">Flexible plans for any growth stage</h2>
          
          {/* Monthly/Yearly toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-xs font-semibold ${billingPeriod === 'monthly' ? 'text-white' : 'text-zinc-500'}`}>Monthly Billing</span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="w-11 h-6 bg-white/[0.08] rounded-full p-0.5 transition-all relative border border-white/[0.1] cursor-pointer"
            >
              <div 
                className={`w-4.5 h-4.5 bg-[#FF2D2D] rounded-full transition-all ${
                  billingPeriod === 'yearly' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-semibold ${billingPeriod === 'yearly' ? 'text-white' : 'text-zinc-500'} flex items-center gap-1.5`}>
              Yearly Billing
              <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {pricingTiers.map((tier) => (
            <div 
              key={tier.name}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all duration-300 relative ${
                tier.popular 
                  ? 'bg-[#FF2D2D]/5 border-[#FF2D2D]/40 shadow-[0_0_35px_rgba(255,45,45,0.15)] scale-102 z-10' 
                  : 'bg-white/[0.01] border-white/[0.06] hover:border-white/[0.15]'
              }`}
            >
              {tier.popular && (
                <span className="absolute top-[-10px] right-4 bg-[#FF4D4D] text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-lg">
                  Most Popular
                </span>
              )}

              <div>
                <h4 className="text-xs font-bold text-white">{tier.name}</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed mt-1">{tier.desc}</p>
                <div className="mt-4 flex items-baseline border-b border-white/[0.04] pb-4">
                  <span className="text-3xl font-extrabold text-white">
                    {billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                  </span>
                  {tier.monthlyPrice !== 'Custom' && (
                    <span className="text-[10px] text-zinc-500 font-semibold ml-1">/mo</span>
                  )}
                </div>

                <ul className="mt-5 space-y-2.5 text-[10px] text-zinc-400">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-[#FF2D2D] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                href="/login"
                className={`w-full text-center text-xs font-bold py-3 rounded-xl mt-8 block transition-all ${
                  tier.popular
                    ? 'bg-[#FF2D2D] hover:bg-[#e62222] text-white shadow-lg'
                    : 'bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-white'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 11: FAQ */}
      <section id="faq" className="px-6 py-20 max-w-4xl mx-auto space-y-12 border-t border-white/[0.04] relative z-10">
        <div className="text-center space-y-2">
          <span className="text-[10px] font-bold text-[#FF2D2D] uppercase tracking-widest">COMMON ENQUIRIES</span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div key={idx} className="glass-panel border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between text-xs sm:text-sm font-semibold text-white cursor-pointer"
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
                    <div className="p-5 pt-0 text-xs text-zinc-400 leading-relaxed border-t border-white/[0.04]">
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
      <section className="px-6 py-24 text-center max-w-4xl mx-auto relative z-10 border-t border-white/[0.04]">
        <div className="glass-panel p-10 md:p-14 relative overflow-hidden border border-[#FF2D2D]/30 shadow-[0_0_60px_rgba(255,45,45,0.1)]">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF2D2D]/10 rounded-full blur-3xl" />
          
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
            Your next client <br />
            is already on Google Maps.
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-sm mx-auto mt-4 leading-relaxed">
            Stop scraping lists manually. Start scanning vulnerabilities, calculate map scores, and copy AI proposal emails instantly.
          </p>

          <div className="mt-8 flex justify-center">
            <Link 
              href="/login" 
              className="bg-white text-black hover:bg-zinc-200 text-xs font-bold px-6 py-3.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 text-black" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-[#050505]/50 px-6 py-10 text-center text-[10px] text-zinc-500 relative z-10">
        <p>© 2026 LocalRadar SaaS Inc. All rights reserved.</p>
        <p className="mt-1">Built with Next.js 16, Supabase, Tailwind, & Framer Motion.</p>
      </footer>

    </div>
  );
}
