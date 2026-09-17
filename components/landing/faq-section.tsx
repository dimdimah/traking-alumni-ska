'use client'

import { useState } from 'react'
import { ScrollReveal } from './scroll-reveal'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface FaqItem {
  id: string
  pertanyaan: string
  jawaban: string
}

export function FaqSection({ faqs }: { faqs: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(faqs[0]?.id ?? null)

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id)
  }

  return (
    <section id="faq" className="bg-amikom-pearl py-[80px] lg:py-[120px] scroll-mt-20">
      <ScrollReveal>
        <div className="mx-auto max-w-[800px] px-6 lg:px-12">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amikom-purple mb-3">Bantuan & Informasi</p>
            <h2 className="text-[32px] md:text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-amikom-ink">
              Pertanyaan Umum.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div 
                key={faq.id} 
                className="bg-white rounded-2xl border border-amikom-hairline overflow-hidden transition-all hover:border-amikom-purple/30"
              >
                <button
                  onClick={() => toggle(faq.id)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className={`text-[16px] font-semibold transition-colors ${openId === faq.id ? 'text-amikom-purple' : 'text-amikom-ink'}`}>
                    {faq.pertanyaan}
                  </span>
                  <ChevronDown 
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${openId === faq.id ? 'rotate-180 text-amikom-purple' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openId === faq.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-5 pt-0">
                        <p className="text-[15px] leading-[1.6] text-amikom-ink-muted-48 border-t border-slate-100 pt-4">
                          {faq.jawaban}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>
    </section>
  )
}
