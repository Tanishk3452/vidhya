import React, { useState } from 'react';
import { Youtube, Search, LucideFileText, Loader2, PlaySquare, Lightbulb, Zap, Layers } from 'lucide-react';
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
    if (typeof str !== 'string') return '';
    return str.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
};

const flashcardCSS = `
  .perspective-1000 { perspective: 1000px; }
  .transform-style-3d { transform-style: preserve-3d; }
  .backface-hidden { backface-visibility: hidden; }
  .rotate-y-180 { transform: rotateY(180deg); }
  .group:hover .group-hover\\:rotate-y-180 { transform: rotateY(180deg); }
  .markdown-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; }
  .markdown-content li { margin-bottom: 0.5rem; }
`;

export default function YouTubeNotes() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('notes');

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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <style>{flashcardCSS}</style>
                    
                    {/* Executive Summary Banner */}
                    <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                           <Lightbulb size={250} />
                       </div>
                       <h2 className="text-3xl font-extrabold text-white mb-4 flex items-center gap-3 relative z-10">
                           <Zap className="text-yellow-400" /> Executive Summary
                       </h2>
                       <p className="text-lg text-indigo-100 leading-relaxed max-w-4xl relative z-10 font-medium">
                           {result.summary}
                       </p>
                       <div className="mt-6 flex flex-wrap gap-2 relative z-10">
                           {result.key_concepts?.map((c, i) => (
                               <div key={i} className="bg-indigo-500/20 border border-indigo-400/30 px-4 py-2 rounded-full text-indigo-200 text-sm font-semibold flex items-center gap-2" title={c.explanation}>
                                   <Layers size={14} /> {c.title}
                               </div>
                           ))}
                       </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex gap-4 border-b border-gray-700/50 pb-0 mt-8 relative z-10">
                        <button className={`px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'notes' ? 'text-white border-b-2 border-red-500 bg-gray-800/50' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'}`} onClick={() => setActiveTab('notes')}>Detailed Notes</button>
                        <button className={`px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'flashcards' ? 'text-white border-b-2 border-red-500 bg-gray-800/50' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'}`} onClick={() => setActiveTab('flashcards')}>Interactive Flashcards</button>
                        <button className={`px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === 'video' ? 'text-white border-b-2 border-red-500 bg-gray-800/50' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'}`} onClick={() => setActiveTab('video')}>Source Video</button>
                    </div>

                    {/* Tab Content */}
                    <div className="pt-2">
                        {activeTab === 'notes' && (
                            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-700/50">
                                    <LucideFileText className="w-6 h-6 text-indigo-400" />
                                    <h2 className="text-2xl font-bold text-white">AI Structured Notes & Definitions</h2>
                                </div>
                                <div className="markdown-content prose prose-invert max-w-none prose-h2:text-purple-400 prose-h3:text-indigo-400 prose-strong:text-white">
                                    {parseMarkdown(result.notes_markdown)}
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'flashcards' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in zoom-in-95 duration-300">
                               {result.flashcards?.map((card, i) => (
                                   <div key={i} className="group perspective-1000 w-full h-72 cursor-pointer">
                                       <div className="relative w-full h-full transition-transform duration-700 transform-style-3d group-hover:rotate-y-180">
                                           {/* Front of Flashcard */}
                                           <div className="absolute w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center backface-hidden shadow-xl hover:border-red-500/50 transition-colors">
                                               <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-6 shadow-inner">
                                                   <span className="text-red-400 font-extrabold text-2xl">Q{i+1}</span>
                                               </div>
                                               <h3 className="text-xl font-bold text-gray-200 leading-snug">{card.q}</h3>
                                               <p className="text-gray-500 mt-auto text-sm font-semibold tracking-widest uppercase">Hover to reveal</p>
                                           </div>
                                           {/* Back of Flashcard */}
                                           <div className="absolute w-full h-full bg-gradient-to-br from-indigo-900/80 to-purple-900/80 border border-indigo-500/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center backface-hidden shadow-xl rotate-y-180">
                                              <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-6 shadow-inner">
                                                   <span className="text-green-400 font-extrabold text-2xl">A</span>
                                               </div>
                                              <p className="text-lg font-medium text-white leading-relaxed">{card.a}</p>
                                           </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        )}

                        {activeTab === 'video' && (
                            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 shadow-2xl max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                                <h3 className="text-xl font-bold text-white mb-6">Distraction-Free Source Material</h3>
                                <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-black/80 shadow-2xl border border-gray-700/50">
                                    <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${result.video_id}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
