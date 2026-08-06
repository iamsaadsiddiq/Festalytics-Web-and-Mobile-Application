"use client";

import React, { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  loadMessageTemplates,
  addMessageTemplate,
  deleteMessageTemplate,
} from "@/lib/messageTemplates";
import CreateTemplateModal from "./CreateTemplateModal";

const ChatQuickReplies = ({ venueId, onSelectReply, disabled = false }) => {
  const [templates, setTemplates] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(() => {
    if (venueId) setTemplates(loadMessageTemplates(venueId));
  }, [venueId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSaveTemplate = async ({ title, body }) => {
    if (!venueId) return;
    const next = addMessageTemplate(venueId, { title, body });
    setTemplates(next);
  };

  const handleDeleteTemplate = (templateId, e) => {
    e.stopPropagation();
    if (!venueId) return;
    if (!window.confirm("Delete this template?")) return;
    const next = deleteMessageTemplate(venueId, templateId);
    setTemplates(next);
  };

  return (
    <>
      <aside className="w-72 flex flex-col bg-surface-container-low p-6 gap-6 rounded-3xl border border-outline-variant/50 text-slate-700 font-sans h-full">
        <div className="space-y-6 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary-container rounded-lg flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-xl fill-1">bolt</span>
            </div>
            <h4 className="font-black text-xs text-on-surface uppercase tracking-[0.1em]">
              Quick Replies
            </h4>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {templates.map((tpl) => (
              <div key={tpl.id} className="relative group">
                <motion.button
                  type="button"
                  whileHover={{ x: 5, backgroundColor: "#ffffff" }}
                  disabled={disabled}
                  onClick={() => onSelectReply?.(tpl.body)}
                  className="w-full text-left p-4 pr-10 text-[11px] font-black leading-snug bg-white/50 rounded-2xl border border-outline-variant/30 hover:border-primary hover:text-primary transition-all shadow-sm uppercase tracking-wide cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tpl.title && (
                    <span className="block text-[9px] text-outline normal-case tracking-normal font-bold mb-1">
                      {tpl.title}
                    </span>
                  )}
                  &ldquo;{tpl.body}&rdquo;
                </motion.button>
                {tpl.id && !String(tpl.id).includes("default") && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                    className="absolute top-2 right-2 p-1 rounded-lg text-outline hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity border-0 bg-transparent cursor-pointer"
                    title="Delete template"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-outline-variant/30 shrink-0">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl border-2 border-dashed border-outline text-outline font-black text-[10px] uppercase tracking-widest hover:border-secondary hover:text-secondary hover:bg-white transition-all group cursor-pointer bg-transparent"
          >
            <span className="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">
              add
            </span>
            Create Template
          </button>
        </div>
      </aside>

      <CreateTemplateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSave={handleSaveTemplate}
      />
    </>
  );
};

export default ChatQuickReplies;
