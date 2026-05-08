import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, User } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/journey', icon: Map, label: 'Journey' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-5 pb-4 pointer-events-none">
      <div className="w-full max-w-md h-16 rounded-t-[28px] rounded-b-[24px] bg-white/95 backdrop-blur-xl border border-brand/10 shadow-[0_-10px_35px_rgba(45,74,72,0.12)] flex items-center justify-around pointer-events-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'h-full w-24 flex flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] transition-colors',
                isActive || (item.to === '/journey' && location.pathname === '/treasure')
                  ? 'text-text-main'
                  : 'text-text-muted/60 hover:text-text-main',
              )
            }
          >
            {({ isActive }) => {
              const active = isActive || (item.to === '/journey' && location.pathname === '/treasure');
              return (
                <>
                  <span
                    className={cn(
                      'w-9 h-8 rounded-2xl flex items-center justify-center transition-all',
                      active ? 'bg-brand/20 shadow-inner' : 'bg-transparent',
                    )}
                  >
                    <item.icon size={19} strokeWidth={active ? 2.6 : 2} />
                  </span>
                  <span>{item.label}</span>
                </>
              );
            }}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
