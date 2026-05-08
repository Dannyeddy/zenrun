import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Compass, Heart, Map, Sparkles } from 'lucide-react';
import { useDemo } from '../context/DemoContext';

const Onboarding = () => {
  const navigate = useNavigate();
  const { markOnboardingSeen, userState, selectedCompanion } = useDemo();

  const features = [
    {
      icon: <Heart className="text-brand-dark" size={28} />,
      title: 'Run with a companion',
      description: 'Your companion grows with every route you complete.',
      color: 'bg-brand/10',
    },
    {
      icon:
        userState.preferredRouteType === 'modern' ? (
          <Sparkles className="text-rose-500" size={28} />
        ) : (
          <Compass className="text-amber-500" size={28} />
        ),
      title: 'Unlock destinations',
      description: 'Each run reveals new places, memories, and treasures.',
      color: userState.preferredRouteType === 'modern' ? 'bg-rose-50' : 'bg-amber-50',
    },
    {
      icon: <Map className="text-text-main/70" size={28} />,
      title: 'Build your atlas',
      description: 'Completed routes become postcards on your world map.',
      color: 'bg-[#FDFBF7]',
    },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-5"
    >
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-3 rounded-[34px] bg-white p-6 shadow-[0_20px_55px_rgba(45,74,72,0.12)] border border-text-main/5">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">zenrun</p>
          <h1 className="text-3xl font-display font-bold text-text-main">Ready</h1>
          <p className="text-sm font-medium text-text-muted max-w-md mx-auto">
            {selectedCompanion?.name ?? 'Your companion'} is ready. Your atlas starts with the next route.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.2 }}
              className="rounded-[28px] p-4 bg-white shadow-soft flex items-center gap-4 text-left border border-text-main/5"
            >
              <div className={`w-14 h-14 ${f.color} rounded-[22px] flex items-center justify-center shadow-inner shrink-0`}>
                {f.icon}
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black text-text-main">{f.title}</h2>
                <p className="text-xs font-medium text-text-muted leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col items-center space-y-6">
          <button 
            onClick={() => {
              markOnboardingSeen();
              navigate('/');
            }}
            className="rounded-full bg-text-main px-12 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl group flex items-center gap-2"
          >
            Go Home <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Onboarding;
