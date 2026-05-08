import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Home, Utensils, RefreshCcw, Heart, Zap } from 'lucide-react';
import { usePet } from '../context/PetContext';
import { foodAssets } from '../data/assets';

const ModernRewardResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addFood } = usePet();
  const stats = location.state || { routeName: 'Bailuyuan Moon Bay Loop' };

  useEffect(() => {
    addFood(2);
  }, [addFood]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface flex flex-col items-center py-20 px-6 relative overflow-hidden"
    >
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [-20, 20, -20],
            rotate: [0, 90, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
          style={{
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 20}%`,
          }}
          className="absolute w-12 h-12 bg-gradient-to-br from-brand/20 to-pink-500/10 rounded-full blur-xl pointer-events-none"
        />
      ))}

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-brand/5 blur-[150px] rounded-full -z-10" />

      <div className="max-w-2xl w-full flex flex-col items-center space-y-12">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-3 text-brand-dark mb-4"
          >
            <Sparkles size={24} />
            <span className="text-[12px] font-black uppercase tracking-[0.6em]">
              Training Complete
            </span>
            <Sparkles size={24} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-text-main tracking-tight leading-none">
            Vitality Boost
          </h1>
          <p className="text-text-muted font-medium">Daily training nutrition secured.</p>
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="relative"
        >
          <div className="w-[280px] h-[280px] md:w-[350px] md:h-[350px] bg-white rounded-[60px] shadow-2xl border-4 border-brand/20 flex flex-col items-center justify-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16" />

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-40 h-40 bg-brand/10 rounded-full flex items-center justify-center text-brand p-8"
            >
              <img
                src={foodAssets.bone}
                alt="Pet food reward"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            <div className="text-center space-y-1">
              <div className="text-3xl font-display font-bold text-text-main">+2 Portions</div>
              <div className="text-[10px] font-black text-brand-dark uppercase tracking-widest">
                Premium Pet Food
              </div>
            </div>
          </div>

          <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0, x: -20, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-pink-100 flex items-center gap-3"
            >
              <Heart size={18} fill="#ec4899" className="text-pink-500" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest leading-none">
                  Affinity
                </span>
                <span className="text-lg font-display font-bold text-text-main">+10</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ scale: 0, x: -20, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-brand/20 flex items-center gap-3"
            >
              <Zap size={18} fill="#7EE8E0" className="text-brand" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest leading-none">
                  Stamina
                </span>
                <span className="text-lg font-display font-bold text-text-main">+20</span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        <div className="max-w-md w-full text-center space-y-4 px-4">
          <p className="text-text-muted text-sm font-medium leading-relaxed italic opacity-80 decoration-brand/30">
            "Training here strengthens your bond. Visit the Pet Sanctum to use your new
            portions and restore vitality for your next journey."
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
          <button
            onClick={() => navigate('/pet-space')}
            className="btn-primary py-6 text-xl shadow-2xl shadow-brand/20 uppercase tracking-[0.2em] flex items-center justify-center gap-4"
          >
            Go to Pet
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-white hover:bg-surface transition-all text-text-main py-6 rounded-3xl text-xl font-bold border border-brand/20 flex items-center justify-center gap-4 shadow-md"
          >
            <Home size={24} /> Home
          </button>
        </div>

        <button
          onClick={() => navigate('/tracker', { state: { routeType: 'modern', routeName: stats.routeName } })}
          className="flex items-center gap-3 text-text-muted hover:text-brand transition-colors text-sm font-black uppercase tracking-[0.4em]"
        >
          <RefreshCcw size={16} /> Re-Run Route
        </button>
      </div>
    </motion.div>
  );
};

export default ModernRewardResult;
