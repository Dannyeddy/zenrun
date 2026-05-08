import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Home, Box, RefreshCcw, Star, Lock } from 'lucide-react';
import { useDemo } from '../context/DemoContext';
import { treasureAssets } from '../data/assets';

const HistoricalRewardResult = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { rewardState, routeState, saveHistoricalReward, selectRoute, selectedRoute } = useDemo();
  const stats = location.state || { routeName: routeState.selectedRouteName || 'Pingjiang Heritage Trail' };

  useEffect(() => {
    saveHistoricalReward();
  }, [saveHistoricalReward]);

  const rewardTitle = rewardState.rewardName || 'Mise Celadon Lotus Bowl';
  const rewardImage = rewardState.rewardImage || treasureAssets.baowu1;
  const routeName = stats.routeName || routeState.selectedRouteName || 'Pingjiang Heritage Trail';
  const rerunRoute = useMemo(() => selectedRoute, [selectedRoute]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#0A1A19] flex flex-col items-center py-20 px-6 relative overflow-hidden"
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-brand/10 blur-[150px] rounded-full -z-10 animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-[400px] aspect-square bg-amber-500/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-2xl w-full flex flex-col items-center space-y-16">
        <div className="text-center space-y-4">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-3 text-brand mb-4"
          >
            <Sparkles size={24} />
            <span className="text-[12px] font-black uppercase tracking-[0.6em]">Treasure Unearthed</span>
            <Sparkles size={24} />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-none">
            {rewardTitle}
          </h1>
          <div className="text-amber-400 font-black text-xs uppercase tracking-widest bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
            Relic of {routeName}
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.5, rotateY: 90 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 60 }}
          className="relative group perspective-[1000px]"
        >
          <div className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] relative pointer-events-none">
            <div className="absolute inset-0 bg-brand/20 blur-[60px] rounded-full animate-pulse" />
            <img
              src={rewardImage}
              alt="Treasure"
              className="w-full h-full object-cover rounded-[60px] border-4 border-brand/30 shadow-[0_0_100px_rgba(126,232,224,0.3)] relative z-10 brightness-110 sepia-[0.3]"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-8 right-8 z-20 w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/20">
              <Star size={32} fill="white" className="text-white" />
            </div>
          </div>
        </motion.div>

        <div className="max-w-lg w-full space-y-12 h-fit">
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden flex flex-col items-center"
          >
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-8" />
            <div className="py-2 text-center space-y-3">
              <span className="text-amber-500/40 text-[9px] font-black uppercase tracking-[0.5em] block">
                Archival Resonance
              </span>
              <p className="text-white/50 text-sm font-serif italic leading-relaxed px-10">
                "A deeper frequency lingers within the path. Repeated reflection may unveil the hidden Tier II treasures of the Pagoda."
              </p>
            </div>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mt-8" />
          </motion.div>

          <div className="flex flex-col items-center gap-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="w-40 relative group"
            >
              <div className="card-rounded p-3 flex flex-col gap-3 relative overflow-hidden bg-white/[0.03] border border-white/10 grayscale opacity-40 shadow-2xl">
                <div className="absolute top-0 right-0 bg-white/10 text-white/40 px-2.5 py-1 rounded-bl-xl text-[7px] font-black uppercase tracking-widest z-20">
                  Rare
                </div>

                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <Lock size={12} className="text-white/40" />
                  </div>
                </div>

                <div className="aspect-square rounded-[18px] overflow-hidden bg-black/30">
                  <img
                    src={treasureAssets.baowu2}
                    alt="Locked"
                    className="w-full h-full object-cover blur-sm opacity-50"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <div className="text-xs font-bold text-white/30 truncate">Sword of King Fuchai of Wu</div>
                  <div className="text-[8px] font-black text-white/10 uppercase tracking-widest">
                    Locked Relic
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
          <button
            onClick={() => navigate('/collection')}
            className="btn-primary py-6 text-xl shadow-2xl shadow-brand/20 uppercase tracking-[0.2em] flex items-center justify-center gap-4"
          >
            <Box size={24} /> Gallery
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-white/10 hover:bg-white/20 transition-all text-white py-6 rounded-3xl text-xl font-bold border border-white/10 flex items-center justify-center gap-4 backdrop-blur-md"
          >
            <Home size={24} /> Sanctum
          </button>
        </div>

        <button
          onClick={() => {
            if (rerunRoute) {
              selectRoute(rerunRoute);
              navigate('/tracker', { state: { route: rerunRoute } });
              return;
            }
            navigate('/tracker');
          }}
          className="flex items-center gap-3 text-white/40 hover:text-brand transition-colors text-sm font-black uppercase tracking-[0.4em]"
        >
          <RefreshCcw size={16} /> Re-Run Route
        </button>
      </div>
    </motion.div>
  );
};

export default HistoricalRewardResult;
