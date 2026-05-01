import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, CheckCircle2, BookOpen, Clock, ArrowLeft, Wind, Brain, Heart, Sparkles } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  where, 
  deleteDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: any;
}

interface Step {
  id: string;
  title: string;
  content: string;
  durationMinutes: number;
}

const SEED_TUTORIALS = [
  {
    id: 'take-back-control',
    title: 'Take Back Control',
    description: 'Learn simple techniques to manage emotional overwhelm in minutes.',
    category: 'Anxiety',
    icon: Sparkles,
    steps: [
      { id: '1', title: 'The Pause', durationMinutes: 1, content: `Emotions are messengers. When you feel overwhelmed, stop. Take 3 deep, slow breaths. Notice where the tension lives in your body. Don't judge it, just notice it.` },
      { id: '2', title: 'Naming', durationMinutes: 1, content: `Labeling an emotion reduces its power. Are you feeling "Frustrated," "Exhausted," or "Afraid"? Say it out loud: "I am feeling [X]." Observe how naming it creates a small space between you and the feeling.` },
      { id: '3', title: 'Observation', durationMinutes: 2, content: `Imagine you are a scientist observing your thoughts. They are passing clouds, not the sky. You are the sky—constant and calm. Let the cloud drift by without chasing it.` },
      { id: '4', title: 'Choice', durationMinutes: 1, content: `Now that you have paused and labeled, choose one small, healthy action. Maybe a walk, a glass of water, or setting a boundary. You are in control of your next second.` }
    ]
  },
  {
    id: 'mindful-morning',
    title: 'Mindful Morning',
    description: 'A gentle guide to starting your day with intention and clarity.',
    category: 'Focus',
    icon: Brain,
    steps: [
      { id: '1', title: 'First Thought', durationMinutes: 1, content: `Before reaching for your phone, notice the first thought that enters your mind. Greet it with kindness, then let it go.` },
      { id: '2', title: 'Grounding', durationMinutes: 2, content: `Sit on the edge of your bed. Feel your feet on the floor. Imagine roots growing from your soles into the earth.` },
      { id: '3', title: 'Intention', durationMinutes: 1, content: `Set one word for the day. Is it "Patience"? "Presence"? "Grace"? Carry this word with you.` }
    ]
  },
  {
    id: 'digital-detox',
    title: 'Digital Detox',
    description: 'Recalibrate your focus by stepping away from the screen.',
    category: 'Focus',
    icon: Wind,
    steps: [
      { id: '1', title: 'Screen Sunset', durationMinutes: 1, content: `Put your phone in another room. Feel the immediate urge to check it—that's the dopamine system at work. Just watch that urge without acting on it.` },
      { id: '2', title: 'Tactile Connection', durationMinutes: 2, content: `Pick up a physical object. A stone, a book, a glass of water. Notice its texture, weight, and temperature. Reconnect with the physical world.` },
      { id: '3', title: 'Earthing', durationMinutes: 2, content: `Step outside or look out a window. Find three natural things (a tree, a cloud, a bird). Observe them for one minute each.` }
    ]
  },
  {
    id: 'sleep-sanctuary',
    title: 'Sleep Sanctuary',
    description: 'Prepare your mind for deep, restorative rest.',
    category: 'Recovery',
    icon: Heart,
    steps: [
      { id: '1', title: 'The Brain Dump', durationMinutes: 2, content: `Write down every task or worry on your mind onto a piece of paper. Tell your brain: "I have recorded these. I can address them tomorrow."` },
      { id: '2', title: 'Progressive Release', durationMinutes: 3, content: `Clench your toes for 5 seconds, then release. Move up to your calves, thighs, and so on, until you reach your jaw. Feel the heaviness.` },
      { id: '3', title: 'Breath Counting', durationMinutes: 2, content: `Count your breaths from 1 up to 10. If you lose count, gently start back at 1. Don't worry about getting to 10—just the rhythm.` }
    ]
  },
  {
    id: 'inner-critic-dialogue',
    title: 'Inner Critic Dialogue',
    description: 'Transform your self-talk from hostile to helpful.',
    category: 'Self-Care',
    icon: Sparkles,
    steps: [
      { id: '1', title: 'Identify the Voice', durationMinutes: 1, content: `When you feel self-doubt, listen to the tone. Is it yours? Or a shadow of someone else's voice? Personify this voice—give it a name or a face.` },
      { id: '2', title: 'Gratitude for Protection', durationMinutes: 2, content: `Surprisingly, your critic usually wants to keep you safe from failure. Say: "Thank you for trying to protect me, but I am safe right now."` },
      { id: '3', title: 'Reframe', durationMinutes: 2, content: `Change "I can't do this" to "I am learning how to do this." Notice how the energy in your body shifts with that one word.` }
    ]
  }
];

export const Tutorials: React.FC = () => {
  const [selectedTutorial, setSelectedTutorial] = useState<any>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState<string[]>([]); // Array of completed step IDs

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const q = query(
      collection(db, 'user_progress'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const completed = snapshot.docs.map(doc => doc.data().stepId as string);
      setProgress(completed);
    });

    return () => unsubscribe();
  }, []);

  const handleStepComplete = async (stepId: string) => {
    if (!auth.currentUser) return;
    
    // Check if already completed
    if (progress.includes(stepId)) {
       if (currentStepIndex < selectedTutorial.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
      return;
    }

    try {
      await addDoc(collection(db, 'user_progress'), {
        userId: auth.currentUser.uid,
        stepId,
        completedAt: serverTimestamp()
      });
      
      if (currentStepIndex < selectedTutorial.steps.length - 1) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } catch (error) {
       console.error("Error saving progress:", error);
    }
  };

  const isStepCompleted = (stepId: string) => progress.includes(stepId);

  if (selectedTutorial) {
    const currentStep = selectedTutorial.steps[currentStepIndex];
    const isFinished = currentStepIndex === selectedTutorial.steps.length - 1 && isStepCompleted(currentStep.id);

    return (
      <div className="max-w-2xl mx-auto space-y-12">
        <button 
          onClick={() => setSelectedTutorial(null)}
          className="flex items-center gap-2 text-[#5A5A40]/60 hover:text-[#5A5A40] transition-colors font-bold uppercase tracking-widest text-[10px]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Guides
        </button>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-bold text-[#5A5A40]">{selectedTutorial.title}</h2>
            <div className="text-[10px] font-mono font-bold text-[#5A5A40]">Step {currentStepIndex + 1} of {selectedTutorial.steps.length}</div>
          </div>
          <div className="w-full h-1 bg-[#5A5A40]/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-[#5A5A40]" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentStepIndex + 1) / selectedTutorial.steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <section className="bg-white rounded-[40px] p-12 shadow-sm border border-[#5A5A40]/10 min-h-[400px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 text-[#5A5A40]/40">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{currentStep.durationMinutes} Minute Goal</span>
              </div>
              <h3 className="text-4xl font-serif font-bold text-[#5A5A40]">{currentStep.title}</h3>
              <p className="text-xl leading-relaxed text-[#5A5A40]/80 font-serif translate-y-0 opacity-100">
                {currentStep.content}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="pt-12 flex justify-between items-center">
             <button
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-[#5A5A40]/40 hover:text-[#5A5A40] disabled:opacity-0 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => handleStepComplete(currentStep.id)}
              className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl transition-all hover:scale-105 ${
                isStepCompleted(currentStep.id) 
                ? 'bg-[#5A5A40]/10 text-[#5A5A40]' 
                : 'bg-[#5A5A40] text-white shadow-[#5A5A40]/20'
              }`}
            >
              {isStepCompleted(currentStep.id) ? 'Completed' : 'Next Step'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </section>

        {isFinished && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-green-50 rounded-3xl text-center space-y-4 border border-green-100"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-2xl font-serif font-bold text-green-800">Journey Complete</h4>
            <p className="text-green-700/80 leading-relaxed max-w-sm mx-auto">
              You've taken a vital step toward emotional freedom. Carry this sense of control with you today.
            </p>
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h2 className="text-3xl font-serif font-bold text-[#5A5A40]">Guided Pathways</h2>
        <p className="text-[#5A5A40]/60 text-lg">Structured journeys to help you navigate specific mental challenges.</p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {SEED_TUTORIALS.map((tutorial) => {
          const Icon = tutorial.icon || BookOpen;
          return (
            <button
              key={tutorial.id}
              onClick={() => {
                setSelectedTutorial(tutorial);
                setCurrentStepIndex(0);
              }}
              className="group bg-white rounded-[40px] p-10 text-left border border-[#5A5A40]/10 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 hover:border-[#5A5A40]/30"
            >
              <div className="w-16 h-16 bg-[#FDFBF7] rounded-3xl flex items-center justify-center text-[#5A5A40] mb-8 group-hover:bg-[#5A5A40] group-hover:text-white transition-all">
                <Icon className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5A5A40]/40">{tutorial.category}</span>
                <h3 className="text-3xl font-serif font-bold text-[#5A5A40]">{tutorial.title}</h3>
                <p className="text-[#5A5A40]/60 leading-relaxed font-serif">
                  {tutorial.description}
                </p>
              </div>
              <div className="mt-10 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5A5A40]/60 group-hover:text-[#5A5A40] transition-colors">
                Start Journey <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
