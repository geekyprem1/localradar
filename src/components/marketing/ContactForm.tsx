'use client';

import { useState } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

const topics = [
  { value: 'general', label: 'General questions' },
  { value: 'support', label: 'Product support' },
  { value: 'sales', label: 'Sales & enterprise' },
  { value: 'security', label: 'Security / compliance' },
  { value: 'billing', label: 'Billing' },
] as const;

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [topic, setTopic] = useState<string>('general');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [successNote, setSuccessNote] = useState('');
  const [mailto, setMailto] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('loading');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, topic, message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setStatus('error');
        setError(data.message || 'Could not submit. Email hello@localradar.io.');
        return;
      }

      setSuccessNote(data.message || 'Message received.');
      setMailto(data.mailto || '');
      if (data.mailto && !data.delivered) {
        // Open mail client as progressive enhancement when server delivery is not configured
        window.location.href = data.mailto;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setError('Network error. Email hello@localradar.io directly.');
    }
  };

  if (status === 'success') {
    return (
      <div role="status" className="rounded-2xl border border-[#2DD4A7]/25 bg-[#2DD4A7]/5 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#2DD4A7]/15 text-[#2DD4A7]">
          <Check className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-white">Thanks — we have your details</h3>
        <p className="mt-2 text-sm text-white/50">{successNote}</p>
        {mailto && (
          <a href={mailto} className="mt-4 inline-block text-sm font-semibold text-[#2DD4A7] hover:underline">
            Open in email client
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setMessage('');
          }}
          className="mt-6 block w-full text-xs font-semibold text-[#2DD4A7] hover:underline cursor-pointer"
        >
          Send another message
        </button>
      </div>
    );
  }

  const field =
    'w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#2DD4A7]/50 focus:outline-none focus:ring-1 focus:ring-[#2DD4A7]/40';

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && (
        <div role="alert" className="rounded-xl border border-[#FF5C5C]/25 bg-[#FF5C5C]/10 px-4 py-3 text-xs text-[#FF5C5C]">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/40">
            Full name
          </label>
          <input id="contact-name" value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Alex Rivera" autoComplete="name" required />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/40">
            Business email
          </label>
          <input id="contact-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="you@company.com" autoComplete="email" required />
        </div>
      </div>

      <div>
        <label htmlFor="contact-company" className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/40">
          Company (optional)
        </label>
        <input id="contact-company" value={company} onChange={(e) => setCompany(e.target.value)} className={field} placeholder="Your agency or company" autoComplete="organization" />
      </div>

      <div>
        <label htmlFor="contact-topic" className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/40">
          Topic
        </label>
        <select id="contact-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={field}>
          {topics.map((t) => (
            <option key={t.value} value={t.value} className="bg-[#0B0B0C]">
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/40">
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className={`${field} resize-y`}
          placeholder="How can we help?"
          required
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2DD4A7] px-6 py-3 text-sm font-semibold text-[#04130E] transition-all hover:bg-[#3ee2b6] disabled:opacity-60 sm:w-auto cursor-pointer"
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending…
          </>
        ) : (
          <>
            Send message
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}
