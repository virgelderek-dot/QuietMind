import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, Calendar, Smile, Frown, Meh, Sun, Moon, Pencil } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

enum Mood {
  CALM = 'Calm',
  ANXIOUS = 'Anxious',
  HAPPY = 'Happy',
  TIRED = 'Tired',
  FOCUSED = 'Focused'
}

const MoodIcons = {
  [Mood.CALM]: Sun,
  [Mood.ANXIOUS]: Moon,
  [Mood.HAPPY]: Smile,
  [Mood.TIRED]: Frown,
  [Mood.FOCUSED]: Meh,
};

export const JournalComponent: React.FC = () => {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>(Mood.CALM);
  const [entries, setEntries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'journals'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEntries(docs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!content.trim() || !auth.currentUser) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'journals'), {
        userId: auth.currentUser.uid,
        content: content.trim(),
        mood,
        createdAt: serverTimestamp()
      });
      setContent('');
      setMood(Mood.CALM);
    } catch (error) {
      console.error("Error saving journal:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'journals', id));
    } catch (error) {
      console.error("Error deleting journal:", error);
    }
  };

  return (
    <div className="space-y-12">
      {/* New Entry Card */}
      <section className="bg-white rounded-[32px] p-8 shadow-sm border border-[#5A5A40]/10">
        <div className="flex items-center gap-2 mb-6 text-[#5A5A40]">
          <Plus className="w-5 h-5" />
          <h2 className="text-xl font-serif font-bold">Today's Reflection</h2>
        </div>

        <div className="space-y-6">
          {/* Mood Selector */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 mb-3 block">How are you feeling?</span>
            <div className="flex flex-wrap gap-2">
              {Object.values(Mood).map((m) => {
                const Icon = MoodIcons[m];
                return (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${
                      mood === m 
                        ? 'bg-[#5A5A40] text-white shadow-lg' 
                        : 'bg-[#FDFBF7] text-[#5A5A40]/60 hover:bg-[#5A5A40]/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Area */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write freely. What's on your mind right now?"
            className="w-full h-40 bg-[#FDFBF7] rounded-3xl p-6 text-lg font-serif outline-none border-2 border-transparent focus:border-[#5A5A40]/10 transition-all resize-none"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || !content.trim()}
              className="flex items-center gap-2 bg-[#5A5A40] text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-[#5A5A40]/20 disabled:opacity-50 transition-all hover:scale-105"
            >
              {isSaving ? <span className="animate-pulse">Saving...</span> : <><Save className="w-4 h-4" /> Save Reflection</>}
            </button>
          </div>
        </div>
      </section>

      {/* Past Entries */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#5A5A40]/60">
            <Calendar className="w-5 h-5" />
            <h2 className="text-xl font-serif font-bold">Past Reflections</h2>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">{entries.length} Entries</span>
        </div>

        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => {
              const Icon = MoodIcons[entry.mood as Mood] || Smile;
              return (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-white rounded-3xl p-8 border border-[#5A5A40]/10 flex flex-col md:flex-row gap-6 relative"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#FDFBF7] rounded-2xl flex items-center justify-center text-[#5A5A40]">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">
                        <span>{entry.createdAt?.toDate ? entry.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                        <span>•</span>
                        <span className="text-[#5A5A40]">{entry.mood}</span>
                      </div>
                      <p className="text-lg font-serif text-[#5A5A40] leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="absolute top-8 right-8 p-2 opacity-0 group-hover:opacity-100 transition-all text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {entries.length === 0 && !isLoading && (
            <div className="text-center py-20 bg-white/50 border-2 border-dashed border-[#5A5A40]/10 rounded-3xl">
              <Pencil className="w-12 h-12 mx-auto text-[#5A5A40]/20 mb-4" />
              <p className="font-serif italic text-[#5A5A40]/40">Your journal is empty. No thoughts yet today.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
