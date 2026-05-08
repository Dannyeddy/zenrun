import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Tracker from './pages/Tracker';
import Login from './pages/Login';
import PetSpace from './pages/PetSpace';
import Treasure from './pages/Treasure';
import Journey from './pages/Journey';
import Rankings from './pages/Rankings';
import Insights from './pages/Insights';
import Profile from './pages/Profile';
import RunCompletionSummary from './pages/RunCompletionSummary';
import HistoricalRewardResult from './pages/HistoricalRewardResult';
import ModernRewardResult from './pages/ModernRewardResult';
import Onboarding from './pages/Onboarding';
import SystemData from './pages/SystemData';
import ShareResult from './pages/ShareResult';
import Navbar from './components/Navbar';
import { DemoProvider, useDemo } from './context/DemoContext';
import { PetProvider } from './context/PetContext';

const routerBasename =
  import.meta.env.BASE_URL === '/' ? '/' : import.meta.env.BASE_URL.replace(/\/$/, '');

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const { userState } = useDemo();

  const needsLogin = !userState.userName || !userState.selectedCompanion;
  const needsOnboarding = !needsLogin && !userState.onboardingSeen;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={needsLogin ? <Navigate to="/login" replace /> : <Onboarding />}
        />
        <Route
          path="/"
          element={
            needsLogin ? (
              <Navigate to="/login" replace />
            ) : needsOnboarding ? (
              <Navigate to="/onboarding" replace />
            ) : (
              <Home />
            )
          }
        />
        <Route path="/tracker" element={<Tracker />} />
        <Route path="/journey" element={<Journey />} />
        <Route path="/pet-space" element={<PetSpace />} />
        <Route path="/treasure" element={<Journey />} />
        <Route path="/collection" element={<Treasure />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/completion-summary" element={<RunCompletionSummary />} />
        <Route path="/reward-result" element={<HistoricalRewardResult />} />
        <Route path="/modern-reward" element={<ModernRewardResult />} />
        <Route path="/system-data" element={<SystemData />} />
        <Route path="/share" element={<ShareResult />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppContent = () => {
  const location = useLocation();
  const hideNavbarOn = [
    '/login',
    '/onboarding',
    '/tracker',
    '/completion-summary',
    '/reward-result',
    '/modern-reward',
    '/share',
  ];
  const showNavbar = !hideNavbarOn.includes(location.pathname);

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden pb-24">
      <AnimatedRoutes />
      {showNavbar && <Navbar />}
    </div>
  );
};

export default function App() {
  return (
    <Router basename={routerBasename}>
      <ScrollToTop />
      <DemoProvider>
        <PetProvider>
          <AppContent />
        </PetProvider>
      </DemoProvider>
    </Router>
  );
}
