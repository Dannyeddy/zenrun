import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, User, Compass, Heart } from 'lucide-react';
import { useDemo } from '../context/DemoContext';

const Login = () => {
  const navigate = useNavigate();
  const { companions, setPreferredRouteType, setUserProfile } = useDemo();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [preferredRouteType, setPreferredRouteTypeLocal] = useState<'historical' | 'modern' | ''>(
    '',
  );
  const [selectedPet, setSelectedPet] = useState<number | null>(null);

  const handlePetSelect = () => {
    if (!selectedPet || !preferredRouteType) {
      return;
    }

    setUserProfile(name, selectedPet, preferredRouteType);
    navigate('/onboarding');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-5 relative overflow-hidden"
    >
      <div className="max-w-md w-full space-y-5">
        <div className="text-center space-y-2">
          <div className="space-y-1">
            <h1 className="text-4xl font-display font-bold text-text-main tracking-tight">zenrun</h1>
            <p className="text-text-muted text-base font-medium opacity-80">Run a route. Keep a memory.</p>
          </div>
        </div>

        {step === 1 ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-[34px] p-7 bg-white shadow-[0_20px_55px_rgba(45,74,72,0.12)] border border-text-main/5 space-y-6"
          >
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-display font-bold text-text-main">Welcome</h2>
              <p className="text-sm font-medium text-text-muted">Choose a name for your journey.</p>
            </div>
            
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-dark group-focus-within:scale-110 transition-transform">
                <User size={20} />
              </div>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full bg-[#FDFBF7] rounded-[28px] py-5 pl-14 pr-6 text-text-main font-semibold text-lg focus:outline-none border-2 border-transparent focus:border-brand/40 focus:bg-white transition-all shadow-inner"
              />
            </div>

            <button 
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full rounded-full bg-text-main text-white py-5 text-sm font-black shadow-2xl group uppercase tracking-[0.2em] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        ) : step === 2 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-[34px] bg-white p-5 shadow-[0_20px_55px_rgba(45,74,72,0.12)] border border-text-main/5 space-y-6"
          >
            <div className="text-center space-y-1">
              <h2 className="text-3xl font-display font-bold text-text-main">Choose Your Route</h2>
              <p className="text-text-muted text-sm font-medium opacity-70">
                Start with the path you want to run.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {[
                {
                  id: 'historical' as const,
                  title: 'Historical',
                  description: 'Run through stories and unlock treasures.',
                  icon: <Compass size={28} className="text-amber-600" />,
                  tone: 'bg-amber-50',
                },
                {
                  id: 'modern' as const,
                  title: 'Modern',
                  description: 'Train today and grow your companion.',
                  icon: <Heart size={28} className="text-rose-500" />,
                  tone: 'bg-rose-50',
                },
              ].map((option) => (
                <motion.div
                  key={option.id}
                  whileHover={{ x: 8, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setPreferredRouteTypeLocal(option.id);
                    setPreferredRouteType(option.id);
                    setStep(3);
                  }}
                  className={`rounded-[28px] p-5 flex items-center gap-5 cursor-pointer transition-all border-2 ${
                    preferredRouteType === option.id
                      ? 'border-text-main/20 bg-[#FDFBF7] shadow-soft'
                      : 'border-transparent bg-[#FDFBF7]/70 hover:bg-[#FDFBF7]'
                  }`}
                >
                  <div className={`w-16 h-16 ${option.tone} rounded-2xl flex items-center justify-center shadow-inner`}>
                    {option.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xl font-display font-bold text-text-main leading-tight">{option.title}</div>
                    <div className="text-xs text-text-muted mt-1 font-medium leading-relaxed">{option.description}</div>
                  </div>
                  {preferredRouteType === option.id && (
                    <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center text-white">
                      <ChevronRight size={16} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-[34px] bg-white p-5 shadow-[0_20px_55px_rgba(45,74,72,0.12)] border border-text-main/5 space-y-6"
          >
            <div className="text-center space-y-1">
              <h2 className="text-3xl font-display font-bold text-text-main">Choose Companion</h2>
              <p className="text-text-muted text-sm font-medium opacity-70">Pick who runs with you.</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {companions.map((pet) => (
                <motion.div 
                  key={pet.id}
                  whileHover={{ x: 8, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedPet(pet.id)}
                  className={`rounded-[28px] p-4 flex items-center gap-5 cursor-pointer transition-all border-2 ${selectedPet === pet.id ? 'border-text-main/20 bg-[#FDFBF7] shadow-soft' : 'border-transparent bg-[#FDFBF7]/70 hover:bg-[#FDFBF7]'}`}
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-brand/10 rounded-2xl flex items-center justify-center p-2 shadow-inner">
                    <img src={pet.fullImage} alt={pet.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xl font-display font-bold text-text-main leading-tight">{pet.name}</div>
                    <div className="text-[10px] font-black text-brand-dark uppercase tracking-[0.2em] mt-1 opacity-80">{pet.type}</div>
                  </div>
                  {selectedPet === pet.id && (
                    <div className="w-6 h-6 bg-brand rounded-full flex items-center justify-center text-white">
                      <ChevronRight size={16} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            <button 
              onClick={handlePetSelect}
              disabled={!selectedPet}
              className="w-full rounded-full bg-text-main text-white py-5 text-sm font-black shadow-2xl disabled:opacity-50 transition-all duration-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2"
            >
              Continue <ChevronRight size={18} />
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Login;
