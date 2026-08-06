"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, ChevronDown, MessageCircle } from "lucide-react";
import { normalizeVenueFaqs } from "@/lib/venueFaqs";

export default function VenueFaqSection({ faqs = [] }) {
  const items = useMemo(() => normalizeVenueFaqs(faqs), [faqs]);
  const [openId, setOpenId] = useState(null);

  const toggleFaq = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-pink-100/80 bg-gradient-to-br from-white via-pink-50/30 to-white p-6 md:p-8 shadow-sm">
      <div className="absolute top-0 right-0 w-40 h-40 bg-[#D6336C]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

      <div className="relative flex items-start gap-4 mb-7">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D6336C] to-[#B02A58] text-white shadow-lg shadow-pink-200/60">
          <HelpCircle className="w-6 h-6" strokeWidth={2.25} />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs font-semibold text-[#D6336C] uppercase tracking-[0.18em] mt-1">
            {items.length} {items.length === 1 ? "answer" : "answers"} for you
          </p>
        </div>
      </div>

      <div className="relative space-y-3">
        {items.map((faq, index) => {
          const isOpen = openId === faq.id;
          return (
            <motion.div
              key={faq.id}
              layout
              className={`rounded-2xl border transition-all duration-300 ${
                isOpen
                  ? "border-[#D6336C]/25 bg-white shadow-md shadow-pink-100/50 ring-1 ring-[#D6336C]/10"
                  : "border-gray-100/90 bg-white/90 hover:border-pink-200/60 hover:shadow-sm"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center gap-4 px-4 py-4 md:px-5 md:py-4 text-left cursor-pointer border-0 bg-transparent rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#D6336C]/25 focus-visible:ring-offset-2"
                aria-expanded={isOpen}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[11px] font-black transition-colors ${
                    isOpen
                      ? "bg-[#D6336C] text-white"
                      : "bg-pink-50 text-[#D6336C]"
                  }`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span
                  className={`flex-1 text-sm md:text-[15px] font-bold leading-snug pr-2 transition-colors ${
                    isOpen ? "text-[#D6336C]" : "text-gray-900"
                  }`}
                >
                  {faq.question}
                </span>

                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                    isOpen ? "bg-[#D6336C] text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    strokeWidth={2.5}
                  />
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mx-4 md:mx-5 mb-4 md:mb-5 pl-12 pr-2">
                      <div className="flex gap-3 rounded-xl bg-gradient-to-r from-pink-50/80 to-white border border-pink-100/60 px-4 py-4">
                        <MessageCircle className="w-4 h-4 text-[#D6336C] shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
