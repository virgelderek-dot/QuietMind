import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wind, Mail, Lock, ArrowRight, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Sign up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile in Auth
        await updateProfile(userCredential.user, { 
          displayName: name || userCredential.user.email?.split('@')[0] 
        });
        
        // Update profile in Firestore
        try {
          await setDoc(doc(db, 'user_profiles', userCredential.user.uid), {
            id: userCredential.user.uid,
            email: email,
            displayName: name || userCredential.user.email?.split('@')[0],
            sendReminders: true,
            createdAt: new Date().toISOString()
          });
        } catch (firestoreError: any) {
          console.error("Firestore Profile Creation Error:", firestoreError);
          // We don't necessarily want to block login if firestore profile fails,
          // but we should warn the user.
        }
      }
    } catch (err: any) {
      console.error("Auth Error:", err.code, err.message);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Email/Password authentication is not enabled in the Firebase Console. Please enable it under Auth > Providers.");
      } else if (err.code === 'auth/weak-password') {
        setError("Your password is too weak. Please use at least 6 characters.");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Try signing in instead.");
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if profile exists
      const docRef = doc(db, 'user_profiles', result.user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          id: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName,
          sendReminders: true,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl border border-[#5A5A40]/10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-[#5A5A40] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#5A5A40]/20 transform rotate-3">
            <Wind className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#5A5A40]">QuietMind</h1>
          <p className="text-[#5A5A40]/50 mt-2 text-center text-sm">
            {isLogin ? 'Welcome back to your safe space.' : 'Start your journey toward mental clarity today.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold uppercase tracking-wider text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/30" />
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-4 bg-[#FDFBF7] rounded-2xl outline-none border-2 border-transparent focus:border-[#5A5A40]/10 transition-all font-serif"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/30" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-4 bg-[#FDFBF7] rounded-2xl outline-none border-2 border-transparent focus:border-[#5A5A40]/10 transition-all font-serif"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/30" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-12 pr-4 py-4 bg-[#FDFBF7] rounded-2xl outline-none border-2 border-transparent focus:border-[#5A5A40]/10 transition-all font-serif"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#5A5A40] text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-xs shadow-2xl shadow-[#5A5A40]/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
          >
            {isLoading ? (
              <span className="animate-pulse">Please wait...</span>
            ) : (
              <>
                {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-4">
          <div className="flex items-center gap-4 text-[#5A5A40]/20">
            <div className="flex-1 h-px bg-current" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 whitespace-nowrap">Or continue with</span>
            <div className="flex-1 h-px bg-current" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] border-2 border-[#5A5A40]/10 text-[#5A5A40] hover:bg-[#5A5A40]/5 transition-all flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
            Google Workspace
          </button>
        </div>

        <button
          onClick={() => setIsLogin(!isLogin)}
          className="w-full mt-10 text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-[#5A5A40] transition-colors flex items-center justify-center gap-2"
        >
          {isLogin ? "Don't have an account? Create one" : "Already have an account? Sign in"}
          <ArrowRight className="w-3 h-3" />
        </button>
      </motion.div>

      {/* Footer Branding */}
      <footer className="mt-12 opacity-30 flex items-center gap-2">
        <Wind className="w-4 h-4 text-[#5A5A40]" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]">A Quiet Mind Practice</span>
      </footer>
    </div>
  );
};
