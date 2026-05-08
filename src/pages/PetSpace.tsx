import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Zap, Star, Trophy, MessageCircle, Utensils, Sparkles, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePet } from '../context/PetContext';
import { cn } from '../lib/utils';
import { useDemo } from '../context/DemoContext';
import { foodAssets, FoodAssetKey } from '../data/assets';
import { getPetFullImage } from '../lib/petAppearance';

const PetSpace = () => {
  const navigate = useNavigate();
  const { foodInventory, petVitality, petAffinity, feedPet, getEquippedTreasureForPet } = usePet();
  const { selectedCompanion } = useDemo();
  const [showFeedPanel, setShowFeedPanel] = React.useState(false);
  const [isFeeding, setIsFeeding] = React.useState(false);
  const [showHeart, setShowHeart] = React.useState(false);
  const [selectedFood, setSelectedFood] = React.useState<FoodAssetKey>('fish');
  const [activeFoodAnimation, setActiveFoodAnimation] = React.useState<FoodAssetKey | null>(null);
  const petKey = selectedCompanion?.assetKey ?? 'dog';
  const equippedItem = getEquippedTreasureForPet(petKey);
  const petImage = getPetFullImage(selectedCompanion, equippedItem);

  const foodOptions: Array<{ key: FoodAssetKey; label: string; tone: string }> = [
    { key: 'fish', label: 'Fish', tone: 'bg-brand/10' },
    { key: 'bone', label: 'Bone', tone: 'bg-amber-50' },
    { key: 'carrots', label: 'Carrots', tone: 'bg-orange-50' },
  ];

  const handleFeed = (foodKey: FoodAssetKey) => {
    if (foodInventory <= 0 || isFeeding) return;

    setSelectedFood(foodKey);
    setActiveFoodAnimation(foodKey);
    setIsFeeding(true);

    setTimeout(() => {
      feedPet();
      setShowHeart(true);
      setTimeout(() => {
        setIsFeeding(false);
        setShowHeart(false);
        setActiveFoodAnimation(null);
        setShowFeedPanel(false);
      }, 1500);
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-surface flex flex-col items-center p-8 pb-32"
    >
      <div className="max-w-6xl w-full flex flex-col items-center">
        <header className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand-dark px-5 py-2 rounded-full border border-brand/20 shadow-sm">
            <Star size={16} fill="currentColor" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Companion Sanctuary</span>
          </div>
          <h1 className="text-5xl font-display font-bold text-text-main tracking-tight">
            {selectedCompanion?.name ?? 'Aqua Pup'}
          </h1>
          <p className="text-text-muted text-lg font-medium italic opacity-80">"Your faithful guide through the waves of serenity."</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
          {/* Central Pet Display */}
          <div className="flex flex-col items-center justify-center relative min-h-[500px] bg-white rounded-[64px] shadow-2xl border border-brand/5 p-12 overflow-hidden w-full">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent opacity-40" />
            
            <motion.div 
              animate={isFeeding ? { 
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              } : { 
                y: [0, -25, 0], 
                rotate: [0, 3, 0, -3, 0] 
              }}
              transition={isFeeding ? { duration: 0.5, repeat: 1 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <div className="absolute inset-0 bg-brand/30 rounded-full blur-[80px] scale-150 -z-10" />
              
              {/* Feeding Animation Overlay */}
              <AnimatePresence>
                {activeFoodAnimation && (
                  <motion.div
                    initial={{ opacity: 0, x: -110, y: 130, scale: 0.7 }}
                    animate={{ opacity: 1, x: 72, y: -32, scale: 1 }}
                    exit={{ opacity: 0, x: 110, y: -64, scale: 0.45 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="absolute left-1/2 top-1/2 z-50 pointer-events-none"
                  >
                    <div className="w-24 h-24 bg-white/95 p-4 rounded-full shadow-2xl border-4 border-brand/20">
                      <img
                        src={foodAssets[activeFoodAnimation]}
                        alt={activeFoodAnimation}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </motion.div>
                )}
                {showHeart && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0, y: 0 }}
                    animate={{ scale: [1, 1.5, 1], opacity: 1, y: -150 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center z-[60] pointer-events-none"
                  >
                    <Heart size={80} fill="#f472b6" className="text-pink-400 drop-shadow-[0_0_20px_pink]" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Pet Avatar */}
              <div className="relative">
                <img
                  src={petImage}
                  alt="Pet"
                  className="w-72 h-72 md:w-96 md:h-96 object-cover drop-shadow-[0_35px_35px_rgba(126,232,224,0.4)]"
                  referrerPolicy="no-referrer"
                />

                {/* Equipped Item Overlay */}
                <AnimatePresence>
                  {equippedItem && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0, y: 50 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0, opacity: 0, y: 50 }}
                      className="absolute -top-4 -right-4 md:top-4 md:right-4 z-20"
                    >
                      <div className="relative group">
                        <motion.div 
                          animate={{ rotate: [0, 10, 0, -10, 0] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl bg-white p-2"
                        >
                          <img 
                            src={equippedItem.img} 
                            alt={equippedItem.title} 
                            className="w-full h-full object-cover rounded-[24px]"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                        <div className="absolute -bottom-2 -left-2 bg-brand text-white p-2 rounded-xl shadow-lg flex items-center gap-1">
                          <Sparkles size={12} fill="white" />
                          <span className="text-[8px] font-black uppercase tracking-widest">Equipped</span>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => navigate('/collection')}
                          className="absolute -bottom-1 -right-1 bg-white text-brand p-1.5 rounded-full shadow-md border border-brand/20 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Gift size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {!equippedItem && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    onClick={() => navigate('/collection')}
                    className="absolute -top-4 -right-4 md:top-4 md:right-4 z-20 w-24 h-24 md:w-32 md:h-32 rounded-[32px] border-4 border-dashed border-brand/30 flex flex-col items-center justify-center gap-2 text-brand/40 bg-white/50 backdrop-blur-sm hover:border-brand hover:text-brand transition-all group"
                  >
                    <Gift size={24} className="group-hover:bounce" />
                    <span className="text-[8px] font-black uppercase tracking-widest">Add Item</span>
                  </motion.button>
                )}
              </div>
            </motion.div>
            
            {/* Interaction Buttons */}
            <div className="absolute bottom-12 flex justify-center gap-8 relative z-20">
              {[
                { icon: MessageCircle, label: 'Chat', onClick: () => {} },
                { icon: Utensils, label: 'Feed', onClick: () => setShowFeedPanel(true) },
                { icon: Trophy, label: 'Play', onClick: () => {} }
              ].map((btn, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.1, y: -5 }}
                    whileTap={{ scale: 0.9 }} 
                    onClick={btn.onClick}
                    className={cn(
                      "w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-xl flex items-center justify-center text-brand-dark border-2 border-brand/10 hover:border-brand/40 transition-colors pointer-events-auto",
                      btn.label === 'Feed' && foodInventory > 0 && "border-brand/30 bg-brand/5 ring-4 ring-brand/10"
                    )}
                  >
                    <btn.icon size={32} />
                    {btn.label === 'Feed' && foodInventory > 0 && (
                      <div className="absolute -top-1 -right-1 bg-brand/80 backdrop-blur-sm text-white w-7 h-7 rounded-full text-xs flex items-center justify-center font-black shadow-lg border-2 border-white/60">
                        {foodInventory}
                      </div>
                    )}
                  </motion.button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">{btn.label}</span>
                </div>
              ))}
            </div>

            {/* Feeding Overlay Panel */}
            <AnimatePresence>
              {showFeedPanel && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowFeedPanel(false)}
                    className="absolute inset-0 bg-text-main/20 backdrop-blur-sm z-30"
                  />
                  <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-8 left-8 right-8 z-40"
                  >
                    <div className="bg-white/40 backdrop-blur-xl rounded-[40px] p-8 shadow-2xl border border-white/30 space-y-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-brand/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-brand">
                            <Utensils size={24} />
                          </div>
                          <div>
                            <h4 className="font-display font-bold text-text-main text-lg">Daily Nutrition</h4>
                            <p className="text-text-muted text-xs font-medium">Modern Route Rewards</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-brand-dark uppercase tracking-widest mb-1">Available</div>
                          <div className="text-2xl font-display font-bold text-text-main">{foodInventory} Portions</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {foodOptions.map((food) => (
                          <button
                            key={food.key}
                            onClick={() => setSelectedFood(food.key)}
                            disabled={isFeeding || foodInventory <= 0}
                            className={cn(
                              'rounded-[28px] border-2 p-4 flex flex-col items-center gap-3 transition-all',
                              selectedFood === food.key
                                ? 'border-brand bg-white shadow-lg'
                                : 'border-white/20 bg-white/20 hover:bg-white/30',
                              (isFeeding || foodInventory <= 0) && 'opacity-70',
                            )}
                          >
                            <div className={cn('w-16 h-16 rounded-2xl p-3 flex items-center justify-center shadow-inner', food.tone)}>
                              <img
                                src={foodAssets[food.key]}
                                alt={food.label}
                                className="w-full h-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-main">
                              {food.label}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => setShowFeedPanel(false)}
                          className="py-4 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-sm text-text-main font-bold text-sm uppercase tracking-widest transition-colors"
                        >
                          Later
                        </button>
                        <button 
                          disabled={foodInventory <= 0 || isFeeding}
                          onClick={() => handleFeed(selectedFood)}
                          className="btn-primary py-4 rounded-2xl shadow-lg bg-brand/80 backdrop-blur-sm hover:bg-brand transition-all"
                        >
                          {isFeeding ? `Feeding ${selectedFood}...` : `Feed ${selectedFood}`}
                        </button>
                      </div>
                      
                      {foodInventory === 0 && (
                        <p className="text-pink-500 text-[10px] font-bold text-center uppercase tracking-widest">
                          No food left. Complete Modern Routes to get more!
                        </p>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Pet Stats & Info */}
          <div className="space-y-8 flex flex-col justify-center">
            <h3 className="text-xl font-display font-bold text-text-main flex items-center gap-3 text-left">
              <span className="w-8 h-1 bg-brand rounded-full" />
              Vital Sign Monitoring
            </h3>
            
            <div className="card-rounded p-8 space-y-10 bg-white shadow-lg border border-brand/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5 text-left">
                  <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand-dark shadow-inner">
                    <Zap size={32} fill="currentColor" className="opacity-80" />
                  </div>
                  <div>
                    <div className="text-[12px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Stamina Energy</div>
                    <div className="text-2xl font-display font-bold text-text-main">{petVitality}% Charged</div>
                  </div>
                </div>
                <div className="flex-1 max-w-xs w-full">
                  <div className="h-4 bg-surface rounded-full overflow-hidden border border-brand/5 shadow-inner">
                    <motion.div 
                      key={petVitality}
                      initial={{ width: 0 }} 
                      animate={{ width: `${petVitality}%` }} 
                      transition={{ type: "spring", damping: 15 }}
                      className="h-full bg-brand shadow-[0_0_15px_rgba(126,232,224,0.6)]" 
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5 text-left">
                  <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 shadow-inner">
                    <Heart size={32} fill="currentColor" className="opacity-80" />
                  </div>
                  <div>
                    <div className="text-[12px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Companion Affinity</div>
                    <div className="text-2xl font-display font-bold text-text-main">Lv. {Math.floor(petAffinity / 10)} Aura</div>
                  </div>
                </div>
                <div className="flex-1 max-w-xs w-full">
                  <div className="h-4 bg-surface rounded-full overflow-hidden border border-pink-100 shadow-inner">
                    <motion.div 
                      key={petAffinity}
                      initial={{ width: 0 }} 
                      animate={{ width: `${petAffinity % 100}%` }} 
                      transition={{ type: "spring", damping: 15 }}
                      className="h-full bg-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.4)]" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="card-rounded p-8 bg-brand text-white flex flex-col md:flex-row justify-between items-center shadow-2xl shadow-brand/20 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center shadow-inner">
                  <Star size={32} fill="white" className="drop-shadow-sm" />
                </div>
                <div>
                  <div className="text-[12px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Current Milestone</div>
                  <div className="text-2xl font-display font-bold">Zen Master Tier III</div>
                </div>
              </div>
              <div className="text-center md:text-right mt-6 md:mt-0 relative z-10">
                <div className="text-[12px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Upcoming Reward</div>
                <div className="text-lg font-bold">2.4km Progress Remaining</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PetSpace;
