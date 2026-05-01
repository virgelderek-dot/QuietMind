import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Moon, Sun, ChevronRight, LogOut, Trash2, Mail } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { signOut, updatePassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const Settings: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const fetchProfile = async () => {
      const docSnap = await getDoc(doc(db, 'user_profiles', auth.currentUser!.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setName(data.displayName || '');
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: name });
      await updateDoc(doc(db, 'user_profiles', auth.currentUser.uid), {
        displayName: name
      });
      setProfile({ ...profile, displayName: name });
      alert("Profile updated successfully");
    } catch (error) {
       console.error("Error updating profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleReminders = async () => {
    if (!auth.currentUser || !profile) return;
    const newValue = !profile.sendReminders;
    try {
      await updateDoc(doc(db, 'user_profiles', auth.currentUser.uid), {
        sendReminders: newValue
      });
      setProfile({ ...profile, sendReminders: newValue });
    } catch (error) {
       console.error("Error toggling reminders:", error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 pb-24">
      <header className="space-y-2">
        <h2 className="text-3xl font-serif font-bold text-[#5A5A40]">Account Space</h2>
        <p className="text-[#5A5A40]/60 text-lg">Manage your profile, preferences, and data and privacy.</p>
      </header>

      {/* Profile Section */}
      <section className="bg-white rounded-[40px] p-10 border border-[#5A5A40]/10 space-y-8">
        <div className="flex items-center gap-2 text-[#5A5A40]/40">
          <User className="w-4 h-4" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Personal Information</h3>
        </div>

        <div className="space-y-6">
          <div className="grid gap-2">
             <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 ml-4">Full Name</label>
             <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-6 py-4 bg-[#FDFBF7] rounded-2xl outline-none border-2 border-transparent focus:border-[#5A5A40]/10 font-serif"
             />
          </div>
          <div className="grid gap-2 opacity-50">
             <label className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 ml-4">Email Address</label>
             <div className="w-full px-6 py-4 bg-[#FDFBF7] rounded-2xl border-2 border-transparent font-serif flex items-center justify-between">
                <span>{auth.currentUser?.email}</span>
                <Shield className="w-4 h-4" />
             </div>
          </div>
          <div className="flex justify-end pt-4">
            <button 
              onClick={handleUpdateProfile}
              disabled={isSaving}
              className="px-8 py-3 bg-[#5A5A40] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-[#5A5A40]/20 disabled:opacity-50 transition-all hover:scale-105"
            >
              {isSaving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-white rounded-[40px] p-10 border border-[#5A5A40]/10 space-y-8">
        <div className="flex items-center gap-2 text-[#5A5A40]/40">
          <Bell className="w-4 h-4" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Communication</h3>
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between p-2">
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-[#5A5A40]">Daily Nudges</h4>
                <p className="text-xs text-[#5A5A40]/50">Receive a gentle reminder to breathe and reflect every morning.</p>
              </div>
              <button 
                onClick={toggleReminders}
                className={`w-14 h-8 rounded-full p-1 transition-all duration-300 flex items-center ${
                  profile?.sendReminders ? 'bg-[#5A5A40]' : 'bg-[#E5E5E5]'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                  profile?.sendReminders ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
           </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <button 
          onClick={() => signOut(auth)}
          className="w-full p-6 bg-white rounded-3xl border border-red-100 text-red-500 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign Out from QuietMind
        </button>
        <button 
          className="w-full p-6 text-[#5A5A40]/30 hover:text-red-500 font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2"
        >
          <Trash2 className="w-3 h-3" /> Delete Account & Data
        </button>
      </section>

      <footer className="text-center opacity-20 py-12">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">App Version 2.0.0 • Production Build</span>
      </footer>
    </div>
  );
};
