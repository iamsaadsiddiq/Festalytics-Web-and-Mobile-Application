import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FileUpload = ({ onFileSelect, onReset, currentImage }) => {
    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 0) {
            const file = acceptedFiles[0];
            const reader = new FileReader();
            reader.onload = () => {
                onFileSelect(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1
    });

    if (currentImage) {
        return (
            <div className="relative rounded-[2rem] overflow-hidden shadow-2xl h-[500px] border-4 border-white group">
                <img src={currentImage} alt="Inspiration" className="w-full h-full object-cover" />
                <button
                    onClick={(e) => { e.stopPropagation(); onReset(); }}
                    className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white backdrop-blur-md transition-colors z-30"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            {...getRootProps()}
            className={`border-4 border-dashed rounded-[2rem] h-96 flex flex-col items-center justify-center bg-white hover:bg-gray-50 transition-all cursor-pointer group relative overflow-hidden
                ${isDragActive ? 'border-[#D6336C] bg-pink-50/50' : 'border-gray-200 hover:border-[#D6336C]/50'}
            `}
        >
            <input {...getInputProps()} />
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110
                ${isDragActive ? 'bg-[#D6336C] text-white' : 'bg-pink-50 text-[#D6336C]'}
            `}>
                <Upload className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {isDragActive ? 'Drop it like it\'s hot!' : 'Drop your inspiration here'}
            </h3>
            <p className="text-gray-400">or click to browse your files</p>
        </motion.div>
    );
};

export default FileUpload;
