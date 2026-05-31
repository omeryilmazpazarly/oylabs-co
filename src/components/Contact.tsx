'use client';

import { useRef, useState, useTransition } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Globe, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import SectionAtmosphere from './effects/SectionAtmosphere';
import { submitContactForm } from '@/app/actions';
import { useTheme } from '@/hooks/useTheme';

const EASE = { type: 'spring', stiffness: 90, damping: 22, mass: 0.8 } as const;

const inputCls =
  'w-full bg-input border border-line rounded-lg px-4 py-3 text-sm text-ink placeholder-ink-dull focus:outline-none focus:border-line-hi transition-colors';
const labelCls = 'block text-xs text-ink-dim tracking-widest uppercase mb-2';

export default function Contact() {
  const leftRef  = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const leftIn   = useInView(leftRef,  { margin: '-72px 0px', once: false });
  const rightIn  = useInView(rightRef, { margin: '-72px 0px', once: false });

  const [token,       setToken]       = useState('');
  const [error,       setError]       = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const [isPending,   startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const { isDark } = useTheme();

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (siteKey && !token) {
      setError('Please complete the security check.');
      return;
    }

    const fd = new FormData(e.currentTarget);
    fd.set('turnstileToken', token);

    startTransition(async () => {
      const res = await submitContactForm(fd);
      if (res.success) {
        setSubmitted(true);
        formRef.current?.reset();
      } else {
        setError(('error' in res && res.error) ? res.error : 'Something went wrong. Please try again.');
      }
    });
  }

  return (
    <section
      id="contact"
      className="relative min-h-screen py-20 sm:py-32 px-4 sm:px-6 overflow-hidden flex flex-col justify-center"
    >
      <SectionAtmosphere theme="contact" />
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">

          {/* Left — copy */}
          <motion.div
            ref={leftRef}
            initial={{ opacity: 0, y: 52 }}
            animate={leftIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 52 }}
            transition={EASE}
          >
            <span className="text-xs text-ink-dim tracking-[0.3em] uppercase font-medium">Get In Touch</span>
            <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-ink leading-tight">
              Ready to Build
              <br />
              <span className="text-ink-dim">Something Real?</span>
            </h2>
            <p className="mt-6 text-ink-dim leading-relaxed">
              Tell us about your project. We respond within 24 hours and scope
              engagements with precision before a single line of code is written.
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <a
                href="mailto:hi@oylabs.co"
                className="flex items-center gap-3 text-ink-dim hover:text-ink transition-colors group"
              >
                <Mail size={16} />
                <span className="text-sm tracking-wide group-hover:tracking-wider transition-all">
                  hi@oylabs.co
                </span>
              </a>
              <a
                href="https://oylabs.co"
                className="flex items-center gap-3 text-ink-dim hover:text-ink transition-colors group"
              >
                <Globe size={16} />
                <span className="text-sm tracking-wide group-hover:tracking-wider transition-all">
                  oylabs.co
                </span>
              </a>
            </div>
          </motion.div>

          {/* Right — form */}
          <motion.div
            ref={rightRef}
            initial={{ opacity: 0, y: 52 }}
            animate={rightIn ? { opacity: 1, y: 0 } : { opacity: 0, y: 52 }}
            transition={{ ...EASE, delay: 0.1 }}
            className="rounded-2xl border border-line bg-panel p-5 sm:p-8 overflow-hidden"
          >
            <AnimatePresence mode="wait">

              {/* ── Success state ── */}
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={EASE}
                  className="flex flex-col items-center text-center py-8 gap-5"
                >
                  <div className="w-14 h-14 rounded-full border border-line bg-elevated flex items-center justify-center">
                    <CheckCircle size={24} className="text-ink" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-ink tracking-tight">Brief received.</h3>
                    <p className="mt-2 text-sm text-ink-dim leading-relaxed max-w-xs mx-auto">
                      Check your inbox — a confirmation is on its way. We'll follow up within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-ink-dull hover:text-ink-dim transition-colors tracking-widest uppercase"
                  >
                    Send another
                  </button>
                </motion.div>

              ) : (

                /* ── Form state ── */
                <motion.form
                  key="form"
                  ref={formRef}
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Name *</label>
                      <input
                        name="name"
                        required
                        type="text"
                        placeholder="Your name"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Email *</label>
                      <input
                        name="email"
                        required
                        type="email"
                        placeholder="you@company.com"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Project type */}
                  <div>
                    <label className={labelCls}>Project Type</label>
                    <select
                      name="projectType"
                      className={`${inputCls} appearance-none`}
                      defaultValue=""
                    >
                      <option value="">Select a category</option>
                      <option>System Implementation</option>
                      <option>Website Development</option>
                      <option>App / Plugin</option>
                      <option>Mobile Application</option>
                      <option>Other</option>
                    </select>
                  </div>

                  {/* Brief */}
                  <div>
                    <label className={labelCls}>Brief *</label>
                    <textarea
                      name="brief"
                      required
                      rows={4}
                      placeholder="Describe your project..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  {/* Turnstile — only renders when site key is configured */}
                  {siteKey && (
                    <div>
                      <Turnstile
                        siteKey={siteKey}
                        onSuccess={setToken}
                        onError={() => setError('Security check failed. Please refresh and try again.')}
                        onExpire={() => setToken('')}
                        options={{ theme: isDark ? 'dark' : 'light', size: 'normal' }}
                      />
                    </div>
                  )}

                  {/* Error banner */}
                  {error && (
                    <div className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/8 px-4 py-3">
                      <AlertCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-400 leading-relaxed">{error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cta text-cta-fg text-sm font-semibold tracking-wide hover:opacity-85 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 group"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Brief
                        <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </motion.form>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
