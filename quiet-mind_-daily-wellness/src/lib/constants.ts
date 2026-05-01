import { 
  Sun, 
  Moon, 
  Cloud, 
  Sunrise, 
  Leaf, 
  Wind, 
  Sparkles, 
  Heart, 
  Zap,
  Target,
  Brain,
  Anchor,
  Compass,
  Mountain,
  Waves,
  Coffee,
  Book,
  Pen,
  Timer,
  Shield,
  Star,
  Users,
  Smile,
  Frown,
  Activity
} from 'lucide-react';

export interface Theme {
  id: string;
  name: string;
  bg: string;
  card: string;
  text: string;
  accent: string;
  muted: string;
  border: string;
  icon: any;
}

export const THEMES: Theme[] = [
  { 
    id: 'light', 
    name: 'Organic Light', 
    bg: '#f5f5f0', 
    card: '#FFFFFF', 
    text: '#1a1a1a', 
    accent: '#5A5A40', 
    muted: '#8E9299', 
    border: 'rgba(0,0,0,0.05)',
    icon: Sun
  },
  { 
    id: 'dark', 
    name: 'Midnight Zen', 
    bg: '#0a0a0a', 
    card: '#151515', 
    text: '#f5f5f5', 
    accent: '#8E9299', 
    muted: '#5A5A40', 
    border: 'rgba(255,255,255,0.1)',
    icon: Moon
  },
  { 
    id: 'sky', 
    name: 'Calm Sky', 
    bg: '#f0f4f8', 
    card: '#FFFFFF', 
    text: '#1e293b', 
    accent: '#3b82f6', 
    muted: '#64748b', 
    border: 'rgba(59,130,246,0.1)',
    icon: Cloud
  },
  { 
    id: 'amber', 
    name: 'Sunset Amber', 
    bg: '#fffbeb', 
    card: '#FFFFFF', 
    text: '#451a03', 
    accent: '#d97706', 
    muted: '#92400e', 
    border: 'rgba(217,119,6,0.1)',
    icon: Sunrise
  },
  { 
    id: 'emerald', 
    name: 'Forest Emerald', 
    bg: '#f0fdf4', 
    card: '#FFFFFF', 
    text: '#064e3b', 
    accent: '#10b981', 
    muted: '#047857', 
    border: 'rgba(16,185,129,0.1)',
    icon: Leaf
  }
];

export const ICON_MAP: Record<string, any> = {
  Sparkles, Brain, Heart, Wind, Cloud, Moon, Sun, Leaf, Anchor, Compass, Mountain, Waves, Coffee, Book, Pen, Timer, Shield, Star, Zap, Target, Users, Sunrise, Smile, Frown, Activity
};

export const TEMPLATES = [
  { id: 'anxiety', label: 'Anxiety', prompt: 'The hidden message behind your anxiety' },
  { id: 'self-doubt', label: 'Self-Doubt', prompt: 'Why your inner critic is actually trying to protect you' },
  { id: 'motivation', label: 'Motivation', prompt: 'Why you can\'t "discipline" your way out of burnout' },
  { id: 'mindfulness', label: 'Mindfulness', prompt: 'The power of being the observer of your thoughts' },
  { id: 'boundaries', label: 'Boundaries', prompt: 'Why saying no is the highest form of self-care' },
  { id: 'overthinking', label: 'Overthinking', prompt: 'Why your brain won\'t stop replaying the past' },
  { id: 'imposter-syndrome', label: 'Imposter Syndrome', prompt: 'Why you feel like a fraud despite your success' },
  { id: 'grief', label: 'Grief', prompt: 'How to sit with the weight of what you\'ve lost' },
  { id: 'resilience', label: 'Resilience', prompt: 'The art of bending without breaking' },
  { id: 'self-compassion', label: 'Self-Compassion', prompt: 'Why you deserve the same kindness you give others' },
  { id: 'relationships', label: 'Healthy Relationships', prompt: 'The architecture of a relationship that actually feels safe' },
  { id: 'loneliness', label: 'Loneliness', prompt: 'Why being alone doesn\'t have to mean being lonely' },
  { id: 'perfectionism', label: 'Perfectionism', prompt: 'The trap of "good enough" and why it\'s your greatest strength' },
  { id: 'forgiveness', label: 'Forgiveness', prompt: 'How letting go of the past sets your future self free' },
  { id: 'attachment', label: 'Attachment', prompt: 'Understanding your attachment style and how it shapes your love' },
  { id: 'shadow-work', label: 'Shadow Work', prompt: 'Meeting the parts of yourself you\'ve been taught to hide' },
  { id: 'purpose', label: 'Finding Purpose', prompt: 'The intersection of what you love and what the world needs' },
  { id: 'digital-wellbeing', label: 'Screen Fatigue', prompt: 'Reclaiming your attention from the infinite scroll' },
  { id: 'body-awareness', label: 'Body Neutrality', prompt: 'Learning to listen to the physical signals of your stress' },
  { id: 'productivity', label: 'Slow Productivity', prompt: 'Why doing less is often the only way to do better' },
  { id: 'conflict', label: 'Harmonious Conflict', prompt: 'How to disagree without destroying the connection' },
  { id: 'regret', label: 'Transforming Regret', prompt: 'Turning "what if" into "what now"' },
  { id: 'joy', label: 'Micro-Joys', prompt: 'The radical act of finding delight in the middle of a storm' },
  { id: 'patience', label: 'The Art of Waiting', prompt: 'Why the space between where you are and where you want to be is sacred' },
];

export const TONES = [
  { id: 'calm', label: 'Calm', icon: Wind, description: 'Warm, thoughtful, gentle pauses.' },
  { id: 'energetic', label: 'Energetic', icon: Sparkles, description: 'High energy, punchy, inspiring.' },
  { id: 'empathetic', label: 'Empathetic', icon: Heart, description: 'Compassionate, vulnerable, supportive.' },
  { id: 'viral', label: 'Go Viral', icon: Zap, description: 'Powerful, punchy, attention-grabbing insights.' },
];

export const VOICES = [
  { id: 'Kore', label: 'Kore', description: 'Warm and balanced' },
  { id: 'Puck', label: 'Puck', description: 'Bright and youthful' },
  { id: 'Charon', label: 'Charon', description: 'Deep and authoritative' },
  { id: 'Fenrir', label: 'Fenrir', description: 'Strong and resonant' },
  { id: 'Zephyr', label: 'Zephyr', description: 'Soft and airy' },
  { id: 'Charon-Calm', label: 'Calm Male (Deep)', description: 'Softer, meditative deep voice' },
  { id: 'Fenrir-Calm', label: 'Calm Male (Soft)', description: 'Gentle, resonant male voice' },
  { id: 'Kore-Soft', label: 'Gentle & Warm', description: 'Extra soft female voice' },
  { id: 'Zephyr-Whisper', label: 'Whisper-like', description: 'Ethereal whisper delivery' },
  { id: 'Puck-Energetic', label: 'Upbeat & Bright', description: 'High-energy youthful voice' },
  { id: 'Charon-Steady', label: 'Grounded & Firm', description: 'Steady, authoritative male' },
  { id: 'Fenrir-Deep', label: 'Powerful & Low', description: 'Resonant low-frequency male' },
  { id: 'Zephyr-Calm', label: 'Soft & Meditative', description: 'Extra airy meditative voice' },
  { id: 'Puck-Soft', label: 'Youthful & Gentle', description: 'Soft youthful delivery' },
  { id: 'Kore-Steady', label: 'Warm & Firm', description: 'Balanced authoritative tone' },
];

export const LENGTHS = [
  { id: 'short', label: 'Short', description: 'Quick & punchy (~150 words)', wordCount: 150 },
  { id: 'medium', label: 'Medium', description: 'Balanced & thoughtful (~350 words)', wordCount: 350 },
  { id: 'long', label: 'Long', description: 'Deep & immersive (~600 words)', wordCount: 600 },
];

export const BACKGROUND_MUSIC = [
  { id: 'none', label: 'None', url: null },
  { id: 'ambient', label: 'Soft Ambient', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0a13f69d2.mp3' },
  { id: 'rain', label: 'Gentle Rain', url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_8303645e74.mp3' },
  { id: 'forest', label: 'Forest Birds', url: 'https://cdn.pixabay.com/audio/2022/03/24/audio_783d1a0e1b.mp3' },
  { id: 'river', label: 'Gentle River Stream', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_6108d8535b.mp3' },
  { id: 'waves', label: 'Ocean Waves', url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_0e66860088.mp3' },
  { id: 'wind', label: 'Gentle Wind', url: 'https://cdn.pixabay.com/audio/2022/01/18/audio_2d0ad55171.mp3' },
  { id: 'crickets', label: 'Night Crickets', url: 'https://cdn.pixabay.com/audio/2021/09/06/audio_8303645e74.mp3' },
];
