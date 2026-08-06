"use client";
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, DollarSign, Calendar, MapPin, Loader2, AlertCircle } from 'lucide-react';
import PublicSiteHeader from '../PublicSiteHeader';
import Footer from '../Footer';
import { useAuth } from '@/context/AuthContext';
import { ragChatUrl, resolveHallImageUrl } from '@/lib/aiBackendUrl';

function sanitizeChatText(value) {
    return String(value || '')
        .replace(/[\u2013\u2014\u2212]/g, '-')
        .replace(/[\u{1F300}-\u{1FAFF}\u2700-\u27BF\u2600-\u26FF]/gu, '')
        .trim();
}

const starterMessages = [
    {
        id: 1,
        sender: 'ai',
        text: 'Hello. I am your AI wedding hall assistant. Ask me about Lahore venues by area, capacity, budget, food package, amenities, or ratings.'
    }
];

function renderInline(text, keyPrefix = 'inline') {
    const parts = [];
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.slice(lastIndex, match.index));
        }
        const token = match[0];
        if (token.startsWith('**')) {
            parts.push(<strong key={`${keyPrefix}-${match.index}`} className="font-black text-slate-900">{token.slice(2, -2)}</strong>);
        } else {
            parts.push(<em key={`${keyPrefix}-${match.index}`} className="italic text-slate-700">{token.slice(1, -1)}</em>);
        }
        lastIndex = match.index + token.length;
    }

    if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
    }
    return parts;
}

const MarkdownMessage = ({ text }) => {
    const lines = String(text || '').split('\n');
    const blocks = [];
    let listItems = [];

    const flushList = () => {
        if (listItems.length > 0) {
            const items = listItems;
            const key = `list-${blocks.length}`;
            blocks.push(
                <ul key={key} className="my-3 space-y-2 pl-1">
                    {items.map((item, index) => (
                        <li key={`${key}-${index}`} className="flex gap-2 text-sm leading-relaxed">
                            <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#D6336C] shrink-0" />
                            <span>{renderInline(item, `${key}-${index}`)}</span>
                        </li>
                    ))}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((raw, index) => {
        const line = raw.trim();
        if (!line) {
            flushList();
            return;
        }

        const bullet = line.match(/^[-•]\s+(.+)$/);
        if (bullet) {
            listItems.push(bullet[1]);
            return;
        }

        flushList();

        if (line.startsWith('### ')) {
            blocks.push(<h3 key={index} className="mt-4 mb-2 text-base font-black text-slate-950 tracking-tight">{renderInline(line.slice(4), `h3-${index}`)}</h3>);
        } else if (line.startsWith('## ')) {
            blocks.push(<h2 key={index} className="mt-1 mb-3 text-lg font-black text-slate-950 tracking-tight">{renderInline(line.slice(3), `h2-${index}`)}</h2>);
        } else if (line.startsWith('# ')) {
            blocks.push(<h1 key={index} className="mt-1 mb-3 text-xl font-black text-slate-950 tracking-tight">{renderInline(line.slice(2), `h1-${index}`)}</h1>);
        } else if (line.startsWith('> ')) {
            blocks.push(
                <div key={index} className="my-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 leading-relaxed">
                    {renderInline(line.slice(2), `quote-${index}`)}
                </div>
            );
        } else {
            blocks.push(<p key={index} className="my-2 text-sm leading-relaxed text-slate-700">{renderInline(line, `p-${index}`)}</p>);
        }
    });

    flushList();
    return <div className="space-y-1">{blocks}</div>;
};

const HallImageCards = ({ halls }) => {
    const hallsWithImages = (halls || []).filter(hall => hall.images?.length > 0);
    if (hallsWithImages.length === 0) return null;

    return (
        <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Available venue photos</p>
                <span className="text-[10px] font-black text-[#D6336C] bg-pink-50 border border-pink-100 px-2.5 py-1 rounded-full">
                    {hallsWithImages.length} matched
                </span>
            </div>
            {hallsWithImages.map((hall) => (
                <div key={hall.name} className="rounded-3xl border border-slate-100 bg-slate-50/70 p-3">
                    <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <h4 className="text-sm font-black text-slate-900 leading-tight">{hall.name}</h4>
                            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                                {hall.area}{hall.capacity_sitting ? ` | Capacity up to ${hall.capacity_sitting} guests` : ''}
                            </p>
                        </div>
                        {hall.rating ? <span className="text-[10px] font-black rounded-full bg-white border border-slate-100 px-2 py-1 text-slate-600">Rating {hall.rating}</span> : null}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {hall.images.slice(0, 3).map((image, index) => (
                            <img
                                key={`${hall.name}-${index}`}
                                src={resolveHallImageUrl(image.url)}
                                alt={`${hall.name} interior ${index + 1}`}
                                className="aspect-[4/3] w-full rounded-2xl object-cover bg-slate-100 border border-white shadow-sm"
                                loading="lazy"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

const MessageBubble = ({ message }) => {
    const isUser = message.sender === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
        >
            <div className={`max-w-[90%] rounded-3xl px-5 py-4 shadow-sm border leading-relaxed text-sm ${
                isUser
                    ? 'bg-[#D6336C] text-white border-[#D6336C] rounded-br-md'
                    : 'bg-white text-slate-700 border-slate-100 rounded-bl-md'
            }`}>
                {isUser ? <p className="whitespace-pre-wrap">{message.text}</p> : <MarkdownMessage text={message.text} />}
                {!isUser && <HallImageCards halls={message.halls} />}
                {message.meta && (
                    <div className="mt-4 pt-3 border-t border-current/10 text-[11px] opacity-80 font-semibold uppercase tracking-wider">
                        Matches: {message.meta.exact_matches ?? 0} | Halls shown: {message.meta.halls_shown ?? 0}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const QuickActionButton = ({ icon: Icon, label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="shrink-0 px-4 py-2 bg-white hover:bg-pink-50 border border-pink-100 rounded-full text-xs font-bold text-slate-600 hover:text-[#D6336C] transition-all flex items-center gap-2 shadow-sm"
    >
        <Icon className="w-3.5 h-3.5" />
        {label}
    </button>
);

const AIPlanner = () => {
    const { requireAuth } = useAuth();
    const [messages, setMessages] = useState(starterMessages);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [error, setError] = useState('');
    const messagesListRef = useRef(null);

    useEffect(() => {
        const list = messagesListRef.current;
        if (!list) return;
        const frame = requestAnimationFrame(() => {
            list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
        });
        return () => cancelAnimationFrame(frame);
    }, [messages, isTyping]);

    const askRagBackend = async (text) => {
        const response = await fetch(ragChatUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.detail || 'The AI planner backend did not respond successfully.');
        }
        return data;
    };

    const sendAiMessage = async (text) => {
        const trimmed = text.trim();
        if (!trimmed || isTyping) return;

        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: trimmed }]);
        setInputValue('');
        setIsTyping(true);
        setError('');

        try {
            const result = await askRagBackend(trimmed);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: sanitizeChatText(result.reply || 'I could not generate a useful answer for that question.'),
                    halls: result.halls || [],
                    meta: {
                        exact_matches: result.exact_matches,
                        halls_shown: result.halls_shown,
                        filters_used: result.filters_used
                    }
                }
            ]);
        } catch (err) {
            const message = err.message || 'Could not connect to the AI planner backend.';
            setError(message);
            setMessages(prev => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: 'ai',
                    text: `Backend connection problem: ${message}\n\nThe app tried the local Next.js proxy first. For full Groq RAG answers, start the Python backend on port 8001.`
                }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSendMessage = (text = inputValue) => {
        const messageText = text.trim();
        if (!messageText || isTyping) return;

        requireAuth({
            action: 'ai',
            payload: { text: messageText },
            onAuthed: () => sendAiMessage(messageText),
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans flex flex-col">
            <PublicSiteHeader />

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col h-[calc(100vh-80px)]">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-full border border-indigo-100 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Groq RAG Connected</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Your Personal Event Assistant</h1>
                    <p className="text-sm text-gray-500">Professional Lahore wedding hall recommendations with venue photos where available.</p>
                </div>

                <div className="flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col relative">
                    {error && (
                        <div className="m-4 mb-0 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl px-4 py-3 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div ref={messagesListRef} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-white to-slate-50/70">
                        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

                        {isTyping && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-center">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D6336C] to-purple-600 flex items-center justify-center shadow-sm">
                                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Searching halls and preparing answer
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {messages.length < 3 && (
                        <div className="px-6 pb-2 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50/70">
                            <QuickActionButton icon={MapPin} label="Suggest Venues" onClick={() => handleSendMessage('Suggest venues in Lahore for 300 guests')} />
                            <QuickActionButton icon={DollarSign} label="Budget Options" onClick={() => handleSendMessage('Show affordable halls in Johar Town under PKR 3500 per head')} />
                            <QuickActionButton icon={Calendar} label="Premium Halls" onClick={() => handleSendMessage('Top rated premium halls in DHA with AC and bridal room')} />
                        </div>
                    )}

                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <div className="bg-white border border-gray-200 rounded-2xl flex items-center p-2 shadow-sm focus-within:ring-2 focus-within:ring-[#D6336C]/20 focus-within:border-[#D6336C] transition-all">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="Ask about venues, budget, capacity, area, or amenities..."
                                className="flex-1 px-3 py-2 bg-transparent outline-none text-gray-700 placeholder-gray-400"
                            />
                            <button
                                type="button"
                                onClick={() => handleSendMessage()}
                                disabled={!inputValue.trim() || isTyping}
                                className="p-2 bg-[#D6336C] text-white rounded-xl shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AIPlanner;
