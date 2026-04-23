import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Copy, Check, Wand2, Terminal, Image as ImageIcon, MessageSquare, AlertCircle, RefreshCw, Bot, PenTool, Zap } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// Initialize AI Studio GenAI Instance
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const AI_TYPES = [
  { id: 'llm', name: 'General LLM', desc: 'ChatGPT, Claude, Gemini', icon: MessageSquare, color: 'text-blue-400', glow: 'from-blue-500/20 to-indigo-500/5', border: 'border-blue-500/30' },
  { id: 'image', name: 'Image Gen', desc: 'Midjourney, DALL-E', icon: ImageIcon, color: 'text-orange-400', glow: 'from-orange-500/20 to-pink-500/5', border: 'border-orange-500/30' },
  { id: 'code', name: 'Code Assistant', desc: 'Copilot, Cursor', icon: Terminal, color: 'text-emerald-400', glow: 'from-emerald-500/20 to-teal-500/5', border: 'border-emerald-500/30' },
];

const TONES = [
  { id: 'professional', name: 'Professional', icon: Bot },
  { id: 'creative', name: 'Creative', icon: PenTool },
  { id: 'technical', name: 'Technical', icon: Zap },
];

export default function App() {
  const [idea, setIdea] = useState("");
  const [targetType, setTargetType] = useState(AI_TYPES[0]);
  const [tone, setTone] = useState(TONES[0]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interactive UI States
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea to fit content gently
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '120px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.max(120, scrollHeight) + 'px';
    }
  }, [idea]);

  // Keep output scrolled to bottom while streaming
  useEffect(() => {
    if (isGenerating && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [generatedPrompt, isGenerating]);

  const handleGenerate = async () => {
    if (!idea.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setError(null);
    setGeneratedPrompt("");
    setCopied(false);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is missing.");
      }

      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.1-pro-preview",
        contents: idea,
        config: {
          systemInstruction: `You are an elite Prompt Engineer. Transform the user's rough idea into a highly optimized, professional, and detailed prompt tailored for a ${targetType.name} AI tool (${targetType.desc}). 
          
The engineered prompt must:
- Extract the core intent and expand it rigorously.
- Make use of advanced framework patterns depending on the selected tool.
- For Image Generation: Specify aesthetic details like subject framing, explicit lighting, medium, camera lenses, style, rendering engine (e.g. Octane, Unreal), and vivid mood descriptors. Let it be a dense text or comma-separated structure.
- For LLMs: Provide a specialized persona/role, step-by-step rules, context limits, and required output format using XML tags.
- For Code Assistants: Outline the tech-stack, architectural constraints, error handling preferences, edge-cases, and request clean well-documented code.
- Ensure the prompt adopts exactly a ${tone.name} tone.

CRITICAL INSTRUCTIONS: Do not include introductory conversational text (e.g., "Here is your prompt"). Output NOTHING but the raw prompt. Do not wrap the response in markdown code blocks (\`\`\`markdown) unless the prompt itself legitimately assumes code block insertion.`,
        }
      });
      
      for await (const chunk of responseStream) {
        setGeneratedPrompt((prev) => prev + (chunk.text || ""));
      }

    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred while generating.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedPrompt) return;
    navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 border-t-[6px] border-orange-500 shadow-[inset_0_40px_100px_-50px_rgba(249,115,22,0.15)] flex flex-col items-center">
      <div className="max-w-[1240px] w-full flex flex-col gap-10 selection:bg-orange-500/30">
        
        {/* Animated Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-5 border-b border-white/10 pb-6"
        >
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 1 }}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/10 border border-orange-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.15)]"
          >
            <Sparkles className="w-7 h-7 text-orange-400" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">PromptWorks</h1>
            <p className="text-xs text-white/50 font-mono tracking-widest uppercase mt-1.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
              Engineering Hub
            </p>
          </div>
        </motion.header>

        {/* 2-Column Split Interface */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column - Input Controls */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-5 flex flex-col gap-10"
          >
            
            {/* Target Selectors (Glassmorphic Cards) */}
            <div className="flex flex-col gap-7">
              <div className="space-y-4">
                <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <div className="w-[1px] h-3 bg-white/40"></div> Determine Engine
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {AI_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isActive = targetType.id === type.id;
                    return (
                      <motion.div
                        key={type.id}
                        whileHover={{ scale: 1.015 }}
                        whileTap={{ scale: 0.985 }}
                        onClick={() => setTargetType(type)}
                        className="group cursor-pointer relative"
                      >
                        {/* Active layout background */}
                        {isActive && (
                          <motion.div
                            layoutId="active-target-bg"
                            className={`absolute inset-0 bg-gradient-to-r ${type.glow} rounded-2xl border ${type.border} shadow-[0_0_20px_rgba(255,255,255,0.03)]`}
                            initial={false}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                          />
                        )}
                        
                        <div className={`relative p-4 md:p-5 flex items-center gap-4 md:gap-5 rounded-2xl border transition-colors z-10 ${isActive ? 'border-transparent' : 'bg-black/30 border-white/5 group-hover:bg-white/5 group-hover:border-white/10'}`}>
                           <div className={`p-2.5 rounded-xl transition-colors ${isActive ? `bg-black/50 ${type.color} shadow-inner` : 'bg-white/5 text-white/50 group-hover:text-white/70'}`}>
                             <Icon className="w-5 h-5" />
                           </div>
                           <div>
                              <h3 className={`font-semibold transition-colors ${isActive ? 'text-white' : 'text-white/80'}`}>{type.name}</h3>
                              <p className={`text-xs mt-1 transition-colors ${isActive ? 'text-white/70' : 'text-white/40'}`}>{type.desc}</p>
                           </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Tone Matrix - Pill segmented control */}
              <div className="space-y-4">
                <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
                  <div className="w-[1px] h-3 bg-white/40"></div> Linguistic Matrix
                </label>
                <div className="flex flex-wrap lg:flex-nowrap p-1.5 bg-black/50 border border-white/5 rounded-full relative overflow-hidden backdrop-blur-md">
                  {TONES.map(t => {
                    const isActive = tone.id === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTone(t)}
                        className={`relative flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] rounded-full font-semibold transition-colors duration-300 z-10 ${isActive ? 'text-black' : 'text-white/50 hover:text-white/90'}`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="tone-pill" 
                            className="absolute inset-0 bg-white rounded-full shadow-sm z-[-1]"
                            initial={false}
                            transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                          />
                        )}
                        <Icon className="w-[14px] h-[14px]" />
                        <span>{t.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40 flex justify-between items-center">
                <span className="flex items-center gap-2"><div className="w-[1px] h-3 bg-white/40"></div> Rough Concept</span>
                <span className="text-white/20 tabular-nums">{idea.length} ch</span>
              </label>
              
              {/* Animated Textarea Focus Ring */}
              <motion.div 
                animate={{ 
                  boxShadow: isFocused 
                    ? "0 0 0 1px rgba(249, 115, 22, 0.4), 0 0 40px -10px rgba(249, 115, 22, 0.2)" 
                    : "0 0 0 1px rgba(255, 255, 255, 0.08), 0 0 0px rgba(249, 115, 22, 0)" 
                }}
                className="relative rounded-3xl bg-[#080808] overflow-hidden transition-colors"
              >
                <textarea
                  ref={textareaRef}
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="e.g., A python script that automatically sorts downloads, or a cyberpunk city raining neon colors..."
                  className="w-full bg-transparent p-6 text-white/90 placeholder-white/20 focus:outline-none resize-none font-sans text-[15px] leading-relaxed relative z-10"
                />
                
                {/* Decorative gradients inside input */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
              </motion.div>
            </div>

            {/* Generate Action Button */}
            <motion.button
              onClick={handleGenerate}
              disabled={!idea.trim() || isGenerating}
              whileHover={{ scale: (!idea.trim() || isGenerating) ? 1 : 1.02 }}
              whileTap={{ scale: (!idea.trim() || isGenerating) ? 1 : 0.98 }}
              className={`group flex items-center justify-center gap-3 w-full py-4.5 rounded-2xl font-bold tracking-wide transition-all overflow-hidden relative ${
                !idea.trim() || isGenerating
                  ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'
                  : 'bg-white text-black hover:bg-gray-100 shadow-[0_4px_20px_rgba(255,255,255,0.1)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.2)]'
              }`}
            >
              {isGenerating ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                    <RefreshCw className="w-5 h-5 text-orange-500" />
                  </motion.div>
                  <span>Compiling Pipeline...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5 group-hover:text-orange-500 transition-colors" />
                  <span className="relative z-10">Run Generator</span>
                </>
              )}
            </motion.button>
            
            {/* Error Notification */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm shadow-inner">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column - Engineering Console */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-7"
          >
            <div className="glass-panel rounded-3xl overflow-hidden flex flex-col h-full min-h-[500px] lg:min-h-full relative">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/5 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/20 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/20 shadow-sm"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/20 shadow-sm"></div>
                  </div>
                  <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                  <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40 font-semibold drop-shadow">Output Console</span>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={copyToClipboard}
                  disabled={!generatedPrompt}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all text-xs font-bold tracking-wide uppercase ${
                    !generatedPrompt 
                      ? 'opacity-30 pointer-events-none bg-white/5 text-white/30' 
                      : copied 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-sm'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </motion.button>
              </div>
              
              {/* Output Content Area */}
              <div ref={outputRef} className="flex-1 p-6 md:p-8 relative overflow-y-auto z-10 scroll-smooth">
                <AnimatePresence mode="wait">
                  {/* Empty State */}
                  {!generatedPrompt && !isGenerating && (
                    <motion.div 
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col gap-5 items-center justify-center text-white/20 pointer-events-none"
                    >
                      <div className="p-6 rounded-3xl bg-white/5 shadow-inner border border-white/5">
                        <MessageSquare className="w-12 h-12 opacity-30" />
                      </div>
                      <p className="font-mono text-xs uppercase tracking-[0.2em]">Awaiting parameters...</p>
                    </motion.div>
                  )}

                  {/* Rendering Content or Loading Status */}
                  {(generatedPrompt.length > 0 || isGenerating) && (
                    <motion.div 
                      key="content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full text-white/90"
                    >
                      {generatedPrompt.length === 0 && isGenerating && (
                        <div className="flex items-center gap-3 text-orange-400/80 font-mono text-sm py-4">
                          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>_</motion.span>
                          <span className="animate-pulse">Initializing framework logic...</span>
                        </div>
                      )}

                      {/* Display text blocks chunked by Markdown fences internally */}
                      {generatedPrompt && (
                        <div className="font-sans text-[15px] leading-relaxed">
                          {generatedPrompt.split('```').map((part, index) => {
                            if (index % 2 === 1) {
                              const lines = part.trim().split('\n');
                              const lang = lines[0].includes(' ') ? '' : lines[0];
                              const code = lang ? lines.slice(1).join('\n') : part.trim();
                              
                              return (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={index} 
                                  className="my-5 rounded-2xl bg-black/80 border border-white/10 overflow-hidden font-mono text-[13px] shadow-2xl backdrop-blur-md"
                                >
                                  {lang && (
                                    <div className="px-5 py-2 bg-white/5 border-b border-white/5 flex justify-between items-center">
                                      <span className="text-white/40 uppercase font-semibold tracking-wider text-[10px]">{lang}</span>
                                      <div className="flex gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
                                      </div>
                                    </div>
                                  )}
                                  <pre className="p-5 overflow-x-auto text-white/80 selection:bg-orange-500/30">
                                    <code className="whitespace-pre">{code}</code>
                                  </pre>
                                </motion.div>
                              );
                            }
                            return (
                              <p key={index} className="whitespace-pre-wrap my-4 text-white/80 first:mt-0 leading-loose">
                                {part}
                              </p>
                            );
                          })}

                          {/* Blinking Block Cursor indicating streaming active */}
                          {isGenerating && (
                            <motion.span 
                              animate={{ opacity: [1, 0, 1] }} 
                              transition={{ repeat: Infinity, duration: 0.9 }}
                              className="inline-block w-2.5 h-[1.1em] ml-1 bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.6)] align-middle -translate-y-0.5"
                            />
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

        </main>
      </div>
    </div>
  );
}
