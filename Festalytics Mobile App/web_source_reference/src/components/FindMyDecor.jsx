"use client";
import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RefreshCw, UploadCloud, Loader2, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import PublicSiteHeader from './PublicSiteHeader';
import Footer from './Footer';
import { useAuth } from '@/context/AuthContext';
import { clipMatchUrl } from '@/lib/aiBackendUrl';

const FindMyDecor = () => {
    const { requireAuth } = useAuth();
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState('');

    const topMatch = useMemo(() => analysisResult?.results?.[0] || null, [analysisResult]);

    const analyseImage = async (file) => {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(clipMatchUrl(), {
            method: 'POST',
            body: formData
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (data.rejected) return data;
            throw new Error(data.detail || data.error || 'The decor matcher backend did not respond successfully.');
        }
        return data;
    };

    const runAnalysis = async (file) => {
        if (!file) return;
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setIsScanning(true);
        setAnalysisResult(null);
        setError('');

        try {
            const result = await analyseImage(file);
            if (result.rejected) {
                setError(result.detail || `This image appears to show ${result.subject || 'irrelevant content'}. Please upload an interior wedding hall photo.`);
            }
            setAnalysisResult(result);
        } catch (err) {
            setError(`${err.message || 'Could not analyze image.'} Start the Python backend on port 8001 for CLIP decor matching.`);
        } finally {
            setIsScanning(false);
        }
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        requireAuth({
            action: 'decor',
            payload: { hasImage: true },
            onAuthed: () => runAnalysis(file),
        });
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        setAnalysisResult(null);
        setError('');
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (event) => {
        event.preventDefault();
        handleFileSelect(event.dataTransfer.files?.[0]);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans flex flex-col">
            <PublicSiteHeader />

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10 space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-pink-50 to-purple-50 rounded-full border border-pink-100 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#D6336C]" />
                        <span className="text-[10px] font-bold text-[#D6336C] uppercase tracking-wider">CLIP Connected</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
                        Find My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D6336C] to-purple-600">Dream Decor</span>
                    </h1>
                    <p className="text-base text-gray-500 max-w-xl mx-auto">
                        Upload an inspiration photo and the FastAPI decor matcher will compare it against your hall interior database.
                    </p>
                </motion.div>

                <div className="w-full max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        {!selectedFile ? (
                            <motion.div
                                key="upload"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                onDrop={handleDrop}
                                onDragOver={(event) => event.preventDefault()}
                                onClick={() => fileInputRef.current?.click()}
                                className="max-w-2xl mx-auto bg-white border-2 border-dashed border-pink-100 hover:border-[#D6336C]/40 rounded-[2rem] p-10 sm:p-14 text-center cursor-pointer shadow-xl shadow-pink-100/30 transition-all"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg,image/webp"
                                    className="hidden"
                                    onChange={(event) => handleFileSelect(event.target.files?.[0])}
                                />
                                <div className="w-20 h-20 mx-auto rounded-3xl bg-pink-50 text-[#D6336C] flex items-center justify-center mb-6">
                                    <UploadCloud className="w-9 h-9" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">Upload decor inspiration</h2>
                                <p className="text-sm text-slate-500 mt-3 max-w-md mx-auto">
                                    Drag and drop a wedding hall interior image, or click to browse. Supported formats are JPG, PNG, and WEBP.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-2 gap-8 items-start">
                                <div className="lg:sticky lg:top-24 space-y-4">
                                    <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl">
                                        <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center overflow-hidden">
                                            {previewUrl ? (
                                                <img src={previewUrl} alt="Uploaded decor inspiration" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="w-10 h-10 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="p-5 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs font-black text-slate-900 truncate max-w-[260px]">{selectedFile.name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Uploaded image</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="px-4 py-2 rounded-full bg-slate-50 hover:bg-pink-50 text-slate-500 hover:text-[#D6336C] text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-colors"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-xl min-h-[500px] flex flex-col relative overflow-hidden">
                                    {isScanning ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
                                            <Loader2 className="w-10 h-10 text-[#D6336C] animate-spin" />
                                            <div>
                                                <h3 className="text-lg font-black text-slate-900">Matching decor style</h3>
                                                <p className="text-sm text-slate-500 mt-1">The backend is first validating image relevance with Groq Vision, then comparing hall interiors.</p>
                                            </div>
                                        </div>
                                    ) : error ? (
                                        <div className="space-y-4">
                                            <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-3xl p-5 flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500">Image rejected by relevance check</p>
                                                    {analysisResult?.subject && (
                                                        <h3 className="text-lg font-black text-rose-700 mt-1">This appears to show {analysisResult.subject}</h3>
                                                    )}
                                                    <p className="text-sm mt-2 leading-relaxed">{error}</p>
                                                </div>
                                            </div>
                                            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-sm text-slate-600 leading-relaxed">
                                                Upload an indoor wedding hall, banquet hall, marquee interior, decorated stage, seating setup, or event decor image to get visual matches from the hall database.
                                            </div>
                                        </div>
                                    ) : analysisResult ? (
                                        <div className="space-y-6">
                                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
                                                <div>
                                                    <p className="text-[10px] font-black text-[#D6336C] uppercase tracking-widest">Analysis Complete</p>
                                                    <h3 className="text-2xl font-black text-slate-900 mt-1">Best decor matches</h3>
                                                    <p className="text-sm text-slate-500 mt-1">Method: {analysisResult.method} | Database halls: {analysisResult.total_halls}</p>
                                                </div>
                                                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                            </div>

                                            {topMatch && (
                                                <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-3xl p-5">
                                                    <p className="text-[10px] font-black text-[#D6336C] uppercase tracking-widest">Top Match</p>
                                                    <div className="flex items-end justify-between gap-4 mt-2">
                                                        <h4 className="text-xl font-black text-slate-900">{topMatch.hall_name}</h4>
                                                        <span className="text-sm font-black text-[#D6336C] bg-white px-3 py-1 rounded-full border border-pink-100">{topMatch.similarity}%</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {analysisResult.results?.map((item) => (
                                                    <div key={`${item.rank}-${item.hall_name}`} className="border border-slate-100 rounded-3xl p-4 hover:border-pink-100 hover:shadow-md transition-all">
                                                        <div className="flex items-center justify-between gap-4 mb-3">
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rank {item.rank}</p>
                                                                <h4 className="font-black text-slate-900">{item.hall_name}</h4>
                                                            </div>
                                                            <span className="text-xs font-black text-slate-700 bg-slate-50 rounded-full px-3 py-1">{item.similarity}% match</span>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {item.images?.slice(0, 4).map((img, index) => (
                                                                <img
                                                                    key={index}
                                                                    src={`data:image/jpeg;base64,${img}`}
                                                                    alt={`${item.hall_name} sample ${index + 1}`}
                                                                    className="aspect-square object-cover rounded-2xl bg-slate-100"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-center text-slate-400">
                                            No analysis available yet.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default FindMyDecor;
