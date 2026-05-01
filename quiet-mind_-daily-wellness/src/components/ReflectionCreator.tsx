import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  RefreshCw, 
  Volume2, 
  Settings2, 
  X, 
  Wind, 
  Heart, 
  Zap, 
  Brain,
  Mic2,
  ChevronRight,
  Play,
  Pause,
  Timer
} from 'lucide-react';
import { THEMES, TONES, VOICES, LENGTHS, TEMPLATES, BACKGROUND_MUSIC } from '../lib/constants';
import { wrapPcmInWav, getWordCount } from '../lib/utils';

interface GeneratedScript {
  hook: string;
  coreConcepts: string[];
  metaphor: string;
  signatureClose: string;
  wordCount: number;
  iconName: string;
}

export const ReflectionCreator: React.FC = () => {
  const [input, setInput] = useState('');
  const [selectedTone, setSelectedTone] = useState('calm');
  const [selectedLength, setSelectedLength] = useState('medium');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const currentTheme = THEMES[0]; // Organic Light as default for wellness

  const generateScript = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setScript(null);
    setAudioUrl(null);

    try {
      const toneInstructions = {
        calm: 'Your tone is warm, calm, thoughtful, and honest. You speak TO the viewer, not AT them.',
        energetic: 'Your tone is high-energy, punchy, inspiring, and fast-paced.',
        empathetic: 'Your tone is deeply understanding, compassionate, vulnerable, and supportive.',
        viral: 'Your tone is powerful, punchy, and attention-grabbing. Mic drop moments only.'
      };

      const lengthInfo = LENGTHS.find(l => l.id === selectedLength) || LENGTHS[1];
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Generate a wellness reflection script about: ${input}.`,
        config: {
          systemInstruction: `You are the "Quiet Mind" reflection engine. ${toneInstructions[selectedTone as keyof typeof toneInstructions]}
          Format: JSON with hook, coreConcepts (array), metaphor, signatureClose, wordCount, iconName.
          Close must be: "Step back, stay grounded, and keep your mind quiet."`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hook: { type: Type.STRING },
              coreConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
              metaphor: { type: Type.STRING },
              signatureClose: { type: Type.STRING },
              wordCount: { type: Type.NUMBER },
              iconName: { type: Type.STRING }
            },
            required: ["hook", "coreConcepts", "metaphor", "signatureClose", "wordCount", "iconName"]
          }
        }
      });

      const response = await model;
      const data = JSON.parse(response.text || '{}') as GeneratedScript;
      setScript(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAudio = async () => {
    if (!script) return;
    setIsAudioLoading(true);
    setAudioProgress(0);

    try {
      const fullText = `${script.hook}. ${script.coreConcepts.join('. ')}. ${script.metaphor}. ${script.signatureClose}`;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const model = ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `Read this reflection with a ${selectedTone} tone: ${fullText}`,
        config: {
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice }
            }
          }
        }
      });

      const response = await model;
      let pcmBase64 = "";
      for (const candidate of response.candidates) {
        for (const part of candidate.content.parts) {
          if (part.inlineData && part.inlineData.mimeType.includes("audio/pcm")) {
            pcmBase64 += part.inlineData.data;
          }
        }
      }

      if (pcmBase64) {
        const url = wrapPcmInWav(pcmBase64);
        setAudioUrl(url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAudioLoading(false);
    }
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      <header className="text-center space-y-4">
        <h2 className="text-3xl font-serif font-bold text-[#5A5A40]">Guided Reflection Creator</h2>
        <p className="text-[#5A5A40]/60 max-w-lg mx-auto">Generate a personalized psychological reflection script based on what's on your mind.</p>
      </header>

      <section className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-[#5A5A40]/10">
        <div className="space-y-8">
           <div className="space-y-4">
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {TEMPLATES.map(t => (
                <button 
                  key={t.id}
                  onClick={() => setInput(t.prompt)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    input === t.prompt 
                    ? 'bg-[#5A5A40] text-white shadow-md' 
                    : 'bg-[#FDFBF7] text-[#5A5A40]/50 hover:bg-[#5A5A40]/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your own topic or select a theme above... (e.g., 'How to handle a difficult conversation tomorrow')"
                className="w-full h-40 bg-[#FDFBF7] rounded-[32px] p-8 text-xl font-serif outline-none border-2 border-transparent focus:border-[#5A5A40]/10 transition-all resize-none shadow-inner"
              />
              <div className="absolute bottom-6 right-8 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/20 pointer-events-none">
                {input.length} characters
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex gap-4">
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTone(t.id)}
                  className={`p-3 rounded-2xl transition-all ${
                    selectedTone === t.id ? 'bg-[#5A5A40] text-white shadow-xl' : 'bg-[#FDFBF7] text-[#5A5A40]/40'
                  }`}
                  title={t.label}
                >
                  <t.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
            <button
              onClick={generateScript}
              disabled={isLoading || !input.trim()}
              className="px-12 py-4 bg-[#5A5A40] text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-2xl shadow-[#5A5A40]/30 disabled:opacity-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isLoading ? 'Crafting...' : 'Create Reflection'}
            </button>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {script && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
             <div className="bg-white rounded-[48px] p-12 border border-[#5A5A40]/10 shadow-sm space-y-12 relative overflow-hidden">
                <div className="relative z-10 space-y-12">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center text-white">
                           <Brain className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-[#5A5A40]">Your Reflection</h3>
                      </div>
                      {!audioUrl && (
                        <button 
                          onClick={generateAudio} 
                          disabled={isAudioLoading}
                          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#5A5A40]/60 hover:text-[#5A5A40] transition-colors"
                        >
                          {isAudioLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                          {isAudioLoading ? 'Generating Voice...' : 'Listen to Reflection'}
                        </button>
                      )}
                   </div>

                   <div className="space-y-8">
                     <div className="space-y-2">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">The Hook</span>
                       <p className="text-2xl font-serif font-bold text-[#5A5A40] leading-tight italic">"{script.hook}"</p>
                     </div>

                     <div className="space-y-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Core Insights</span>
                        <div className="grid gap-4">
                           {script.coreConcepts.map((c, i) => (
                             <div key={i} className="flex gap-4 items-start bg-[#FDFBF7] p-6 rounded-3xl border border-[#5A5A40]/5">
                                <span className="w-6 h-6 rounded-full bg-[#5A5A40]/10 flex items-center justify-center text-[10px] font-bold text-[#5A5A40] shrink-0">{i+1}</span>
                                <p className="text-lg font-serif text-[#5A5A40]/80">{c}</p>
                             </div>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-2">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">The Metaphor</span>
                       <p className="text-xl font-serif leading-relaxed text-[#5A5A40]/80">{script.metaphor}</p>
                     </div>
                   </div>

                   {audioUrl && (
                     <div className="pt-8 border-t border-[#5A5A40]/10 flex items-center gap-6">
                        <audio ref={audioRef} src={audioUrl} controls className="hidden" onPlay={() => {}} onPause={() => {}} />
                        <button 
                          onClick={() => audioRef.current?.play()}
                          className="w-16 h-16 bg-[#5A5A40] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#5A5A40]/20 transition-all hover:scale-105"
                        >
                          <Play className="w-8 h-8 fill-current" />
                        </button>
                        <div className="flex-1 space-y-2">
                           <div className="h-1 bg-[#5A5A40]/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#5A5A40] w-0" />
                           </div>
                           <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">
                              <span>0:00</span>
                              <span>Voice: {selectedVoice}</span>
                           </div>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
