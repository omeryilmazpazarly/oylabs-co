'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Mail, Globe } from 'lucide-react';

const SPRING = { type: 'spring', stiffness: 120, damping: 22, mass: 0.8 } as const;

export default function Contact() {
  return (
    <section id="contact" className="py-32 px-6 border-t border-[#111]">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={SPRING}
          >
            <span className="text-xs text-[#71717a] tracking-[0.3em] uppercase font-medium">Get In Touch</span>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Ready to Build
              <br />
              <span className="text-[#71717a]">Something Real?</span>
            </h2>
            <p className="mt-6 text-[#71717a] leading-relaxed">
              Tell us about your project. We respond within 24 hours and scope
              engagements with precision before a single line of code is written.
            </p>
            <div className="mt-8 flex flex-col gap-4">
              <a
                href="mailto:hello@oylabs.co"
                className="flex items-center gap-3 text-[#71717a] hover:text-white transition-colors group"
              >
                <Mail size={16} />
                <span className="text-sm tracking-wide group-hover:tracking-wider transition-all">hello@oylabs.co</span>
              </a>
              <a
                href="https://oylabs.co"
                className="flex items-center gap-3 text-[#71717a] hover:text-white transition-colors group"
              >
                <Globe size={16} />
                <span className="text-sm tracking-wide group-hover:tracking-wider transition-all">oylabs.co</span>
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: 0.15 }}
            className="rounded-2xl border border-[#222] bg-[#111] p-8"
          >
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#71717a] tracking-widest uppercase mb-2">Name</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#444] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#71717a] tracking-widest uppercase mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="you@company.com"
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#444] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[#71717a] tracking-widest uppercase mb-2">Project Type</label>
                <select className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#444] transition-colors appearance-none">
                  <option value="">Select a category</option>
                  <option>System Implementation</option>
                  <option>Website Development</option>
                  <option>App / Plugin</option>
                  <option>Mobile Application</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#71717a] tracking-widest uppercase mb-2">Brief</label>
                <textarea
                  rows={4}
                  placeholder="Describe your project..."
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-4 py-3 text-sm text-white placeholder-[#3f3f46] focus:outline-none focus:border-[#444] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black text-sm font-semibold tracking-wide hover:bg-[#e4e4e7] transition-all duration-200 active:scale-[0.98] group"
              >
                Send Brief
                <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
