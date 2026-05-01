import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Wind, BookOpen, Clock, ChevronRight, PieChart, Star, Smile, BarChart3, Users } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  getCountFromServer
} from 'firebase/firestore';

export const Dashboard: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => {
  const [recentEntry, setRecentEntry] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  const isAdmin = auth.currentUser?.email === 'virgelderek@gmail.com';

  useEffect(() => {
    if (!auth.currentUser) return;

    // Get most recent journal
    const qJournal = query(
      collection(db, 'journals'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubJournal = onSnapshot(qJournal, (snapshot) => {
      if (!snapshot.empty) {
        setRecentEntry(snapshot.docs[0].data());
      }
    });

    // Get total progress
    const qProgress = query(
      collection(db, 'user_progress'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubProgress = onSnapshot(qProgress, (snapshot) => {
      setCompletedSteps(snapshot.size);
    });

    // If admin, fetch total users count
    if (isAdmin) {
      const coll = collection(db, 'user_profiles');
      getCountFromServer(coll).then(snapshot => {
        setTotalUsers(snapshot.data().count);
      });
    }

    return () => {
      unsubJournal();
      unsubProgress();
    };
  }, [isAdmin]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#5A5A40]/40">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          <h2 className="text-5xl font-serif font-bold text-[#5A5A40]">{getTimeGreeting()}, {auth.currentUser?.displayName?.split(' ')[0] || 'Friend'}</h2>
        </div>
        <div className="flex gap-4">
           <div className="bg-white px-6 py-4 rounded-3xl border border-[#5A5A40]/10 flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Steps Completed</span>
            <span className="text-2xl font-serif font-bold text-[#5A5A40]">{completedSteps}</span>
          </div>
          <div className="bg-[#5A5A40] px-6 py-4 rounded-3xl flex flex-col shadow-xl shadow-[#5A5A40]/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Practice Streak</span>
            <span className="text-2xl font-serif font-bold text-white">4 <span className="text-xs font-sans tracking-tight">days</span></span>
          </div>
        </div>
      </header>

      {/* Admin Stats Section */}
      {isAdmin && totalUsers !== null && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 rounded-[40px] p-8 border border-indigo-200/50 flex flex-col md:flex-row items-center gap-8 shadow-sm"
        >
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-xl font-serif font-bold text-indigo-900">Creator Insights</h3>
            <p className="text-sm text-indigo-900/60 font-medium">You are currently viewing private application metrics.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white px-8 py-5 rounded-[28px] border border-indigo-100 flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Total Users</span>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-3xl font-serif font-bold text-indigo-900">{totalUsers.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-white px-8 py-5 rounded-[28px] border border-indigo-100 flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Status</span>
              <span className="text-xs font-bold text-green-600 uppercase tracking-tighter bg-green-50 px-3 py-1 rounded-full">Live</span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Breathing Quick Start */}
        <button 
          onClick={() => setActiveTab('breathing')}
          className="lg:col-span-2 group relative overflow-hidden bg-[#5A5A40] rounded-[48px] p-12 text-left transition-all hover:scale-[1.01] active:scale-100"
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-white">
                <Wind className="w-8 h-8" />
              </div>
              <h3 className="text-4xl font-serif font-bold text-white leading-tight">Return to center with<br />guided breathing.</h3>
            </div>
            <div className="mt-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
              Begin Session <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
          {/* Animated Background Circles */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-12 -right-12 w-64 h-64 bg-white rounded-full pointer-events-none" 
          />
          <motion.div 
            animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-16 -left-16 w-80 h-80 bg-white rounded-full pointer-events-none" 
          />
        </button>

        {/* Categories / Stats */}
        <div className="grid gap-8">
           <div className="bg-white rounded-[40px] p-8 border border-[#5A5A40]/10 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#FDFBF7] rounded-2xl flex items-center justify-center text-[#5A5A40]">
                  <PieChart className="w-5 h-5" />
                </div>
                <h4 className="text-xl font-serif font-bold text-[#5A5A40]">Insights</h4>
                <p className="text-sm text-[#5A5A40]/50 font-serif leading-relaxed">Your emotional patterns are stabilizing. You've reported "Calm" more frequently this week.</p>
              </div>
              <button 
                onClick={() => setActiveTab('journal')}
                className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors"
              >
                View Analytics
              </button>
           </div>
           
           <div className="bg-[#FDFBF7] rounded-[40px] p-8 border border-[#5A5A40]/20 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#5A5A40] shadow-sm">
                  <Star className="text-yellow-500 w-5 h-5" />
                </div>
                <h4 className="text-xl font-serif font-bold text-[#5A5A40]">Daily Tip</h4>
                <p className="text-sm text-[#5A5A40]/50 font-serif leading-relaxed italic">"You are not your thoughts. You are the space where they occur."</p>
              </div>
           </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
         {/* Recent Journal */}
         <div className="bg-white rounded-[40px] p-10 border border-[#5A5A40]/10 space-y-8">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">Recent Reflection</h4>
              <button onClick={() => setActiveTab('journal')} className="p-2 hover:bg-[#5A5A40]/5 rounded-xl transition-all text-[#5A5A40]/60">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {recentEntry ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <div className="px-3 py-1 bg-[#FDFBF7] rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">
                    {recentEntry.mood}
                  </div>
                </div>
                <p className="text-[#5A5A40] font-serif text-lg leading-relaxed line-clamp-4">
                  "{recentEntry.content}"
                </p>
              </div>
            ) : (
              <div className="text-center py-10 opacity-30">
                <p className="text-sm italic font-serif">No reflections recorded yet.</p>
              </div>
            )}
            
            <button 
              onClick={() => setActiveTab('journal')}
              className="w-full py-4 bg-[#FDFBF7] rounded-2xl text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60 hover:bg-[#5A5A40]/5 transition-all"
            >
              Write Journal
            </button>
         </div>

         {/* Explore Guides Card */}
         <div className="lg:col-span-2 group bg-white rounded-[48px] p-12 border border-[#5A5A40]/10 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
            <div className="flex-1 space-y-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#FDFBF7] rounded-lg text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/60">
                <BookOpen className="w-3 h-3" /> Featured Course
              </div>
              <h3 className="text-4xl font-serif font-bold text-[#5A5A40] leading-tight">Mastering Emotional Intelligence</h3>
              <p className="text-lg text-[#5A5A40]/60 font-serif leading-relaxed max-w-sm">A comprehensive guide to understanding your triggers and responding with grace.</p>
              <button 
                onClick={() => setActiveTab('tutorials')}
                className="flex items-center gap-3 bg-[#5A5A40] text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-[#5A5A40]/20 transition-all hover:scale-105"
              >
                Expand Your Mind
              </button>
            </div>
            <div className="w-64 h-64 relative z-10 hidden lg:flex items-center justify-center">
              <div className="absolute inset-0 bg-[#5A5A40] rounded-[60px] transform rotate-12 opacity-5 scale-110" />
              <BookOpen className="w-24 h-24 text-[#5A5A40] opacity-10" />
              {/* Floating Icons */}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-4 -right-4"><Smile className="text-[#5A5A40]/20 w-8 h-8" /></motion.div>
              <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity }} className="absolute -bottom-8 -left-4"><Clock className="text-[#5A5A40]/20 w-10 h-10" /></motion.div>
            </div>
         </div>
      </div>
    </div>
  );
};
