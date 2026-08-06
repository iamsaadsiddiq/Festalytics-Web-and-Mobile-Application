"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CreateTemplateModal({ open, onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onSave?.({ title: title.trim(), body: body.trim() });
      setTitle("");
      setBody("");
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setBody("");
    onClose?.();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-outline-variant overflow-hidden"
          >
            <div className="p-6 border-b border-outline-variant">
              <h3 className="text-lg font-black text-on-surface">Create quick reply template</h3>
              <p className="text-xs text-outline mt-1">
                Saved for this venue — click any template to insert into your message.
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-outline block mb-1.5">
                  Template name (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Follow-up after quote"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-outline block mb-1.5">
                  Message *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Type your template message…"
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant text-sm outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2.5 rounded-full font-bold text-sm text-on-surface-variant border-0 cursor-pointer hover:bg-surface-container"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!body.trim() || saving}
                onClick={handleSave}
                className="px-6 py-2.5 rounded-full font-black text-sm text-white bg-primary border-0 cursor-pointer disabled:opacity-50 shadow-md"
              >
                {saving ? "Saving…" : "Save template"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
