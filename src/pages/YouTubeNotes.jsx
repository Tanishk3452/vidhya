import React, { useState } from 'react';
import { Youtube, Search, LucideFileText, Loader2, PlaySquare } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';

// Basic markdown parser for displaying AI notes nicely without external libraries
const parseMarkdown = (text) => {
    if (!text) return null;

    return text.split('\n').map((line, idx) => {
        // Headers
        if (line.startsWith('### ')) {
            return <h3 key={idx} className="text-xl font-bold mt-6 mb-3 text-indigo-400 border-b border-gray-700 pb-2">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-2xl font-bold mt-8 mb-4 text-purple-400">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-3xl font-extrabold mt-8 mb-4 text-white">{line.replace('# ', '')}</h1>;
        }
        // Lists
        if (line.startsWith('* ') || line.startsWith('- ')) {
            return (
                <li key={idx} className="ml-6 mb-2 list-disc text-gray-300">
                    <span dangerouslySetInnerHTML={{ __html: formatBold(line.substring(2)) }} />
                </li>
            );
        }
        // Blockquotes
        if (line.startsWith('> ')) {
            return <blockquote key={idx} className="border-l-4 border-indigo-500 pl-4 py-1 my-3 text-gray-400 italic">{line.substring(2)}</blockquote>;
        }
        // Empty lines
        if (line.trim() === '') {
            return <div key={idx} className="h-3"></div>;
        }
        // Normal paragraph with bold parsing
        return <p key={idx} className="mb-2 text-gray-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatBold(line) }} />;
    });
};

const formatBold = (str) => {
    return str.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
};

export default function YouTubeNotes() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            setError('Please enter a valid YouTube URL');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await axios.post('http://localhost:8000/api/youtube/process', { url });
            setResult(response.data);
        } catch (err) {
            console.error('API Error:', err);
            setError(err.response?.data?.detail || 'Failed to generate visual notes. Please ensure the video has English or Hindi captions enabled.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Multi-modal Video Processor</h1>
                    <p className="text-gray-400 mt-2 text-lg">Convert any long, distracting YouTube lecture into distraction-free, structured flashcards and notes instantly.</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-2xl hidden md:block">
                    <Youtube className="w-10 h-10 text-red-500" />
                </div>
            </div>

            {/* Input Box */}
            <motion.div
                className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 md:p-8 shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <PlaySquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Paste YouTube Lecture URL here..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !url}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/30"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                        Generate Notes
                    </button>
                </form>
                {error && (
                    <div className="mt-4 p-4 bg-red-900/30 border border-red-800/50 rounded-xl text-red-300 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                        {error}
                    </div>
                )}
            </motion.div>

            {/* Results Area */}
            {loading && (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
                        <Youtube className="w-16 h-16 text-red-500 animate-bounce relative z-10" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">Extracting Transcript & Analyzing...</h3>
                        <p className="text-gray-400">Removing distractions, creating flashcards, and structuring knowledge.</p>
                    </div>
                </div>
            )}

            {result && !loading && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    {/* Notes Output */}
                    <div className="lg:col-span-2 bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 md:p-8 shadow-2xl">
                        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-700">
                            <LucideFileText className="w-6 h-6 text-indigo-400" />
                            <h2 className="text-2xl font-bold text-white">AI Structured Notes</h2>
                        </div>
                        <div className="prose prose-invert max-w-none">
                            {parseMarkdown(result.notes_markdown)}
                        </div>
                    </div>

                    {/* Meta Video Info side panel */}
                    <div className="space-y-6">
                        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl">
                            <h3 className="text-lg font-bold text-white mb-4">Original Source</h3>
                            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-black/50 shadow-lg border border-gray-700">
                                <iframe
                                    className="w-full h-full"
                                    src={`https://www.youtube.com/embed/${result.video_id}`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                            <p className="text-sm text-gray-400 mt-4 italic">
                                Hackathon Module 5: This view strips away external recommendations and comments, focusing strictly on high-retention learning.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
