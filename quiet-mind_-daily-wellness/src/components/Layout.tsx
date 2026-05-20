import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon, Home, BookOpen, Wind, Settings, Sparkles, Pencil } from 'lucide-react';

import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user }) => {
  const handleSignOut = () => signOut(auth);

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'tutorials', label: 'Guides', icon: BookOpen },
    { id: 'journal', label: 'Journal', icon: Pencil },
    { id: 'scripts', label: 'Reflect', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a] font-sans selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-[#5A5A40]/10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#5A5A40] rounded-2xl flex items-center justify-center transform rotate-3">
              <Wind className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[#5A5A40]">QuietMind</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-[#5A5A40]/60">
              <UserIcon className="w-4 h-4" />
              <span>{user?.displayName || user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 hover:bg-[#5A5A40]/5 rounded-xl transition-colors text-[#5A5A40]"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12 pb-32">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-xl border border-[#5A5A40]/10 shadow-2xl rounded-3xl p-2 z-50">
        <ul className="flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 ${
                  activeTab === item.id
                    ? 'bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20'
                    : 'text-[#5A5A40]/50 hover:bg-[#5A5A40]/5 hover:text-[#5A5A40]'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
