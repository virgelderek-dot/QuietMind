import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { JournalComponent } from './components/JournalComponent';
import { Tutorials } from './components/Tutorials';
import { ReflectionCreator } from './components/ReflectionCreator';
import { Settings } from './components/Settings';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 border-4 border-[#5A5A40]/20 border-t-[#5A5A40] rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Helmet>
          <title>QuietMind | Find Your Calm</title>
        </Helmet>
        <Auth />
      </>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'journal':
        return <JournalComponent />;
      case 'tutorials':
        return <Tutorials />;
      case 'scripts':
        return <ReflectionCreator />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <>
      <Helmet>
        <title>QuietMind | Your Mental Wellness Journey</title>
      </Helmet>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Layout>
    </>
  );
};

export default App;
