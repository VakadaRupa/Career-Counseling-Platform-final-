import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, User, Briefcase, MessageSquare, BookOpen, 
  LayoutDashboard, MessageCircle, Shield, CreditCard, 
  Bell, Settings, ChevronRight, Sparkles, Bot, Users, X, FileText
} from 'lucide-react';
import { Button } from './ui/BaseComponents';
import { motion, AnimatePresence } from 'motion/react';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/counseling', icon: Bot, label: 'AI Counseling' },
    { to: '/resources', icon: BookOpen, label: 'Resource Vault' },
    { to: '/jobs', icon: Briefcase, label: 'Job Board' },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/assignments', icon: Sparkles, label: 'Assignments' },
    { to: '/resume', icon: FileText, label: 'Resume AI' },
    { to: '/forum', icon: MessageSquare, label: 'Forum' },
    { to: '/pricing', icon: CreditCard, label: 'Pricing' },
  ];

  if (isAdmin) {
    navItems.push({ to: '/admin', icon: Shield, label: 'Admin Panel' });
  }

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed left-0 top-0 h-screen w-80 bg-slate-900 text-white border-r border-white/5 flex flex-col z-[70] overflow-hidden transition-transform duration-500 ease-[0.16,1,0.3,1] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500 blur-[100px] rounded-full" />
        </div>

        {/* Logo Section */}
        <div className="relative z-10 px-8 pt-12 pb-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-4 group" onClick={onClose}>
            <div className="h-12 w-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-brand-500/40 transition-transform group-hover:scale-110">
              CP
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight block text-white">Career Path</span>
              <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-[0.3em] block">Intelligence</span>
            </div>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-6">
            <p className="text-[10px] font-extrabold text-white/40 uppercase tracking-[0.2em]">Main Menu</p>
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={`group flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
              <item.icon size={22} className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              <span className="text-sm font-bold tracking-wide">{item.label}</span>
              {isActive && (
                <motion.div 
                  layoutId="active-nav"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_10px_white]"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/*
         
      <div className="relative z-10 px-4 pb-4">
        <div className="rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 p-4 overflow-hidden relative group">
          <div className="relative z-10">
            <h4 className="text-base font-bold mb-2">Go Pro.</h4>
            <p className="text-xs text-brand-100 mb-3 leading-relaxed">Unlock advanced AI models and priority mentorship.</p>
            <Link to="/pricing" onClick={onClose}>
              <Button className="w-full bg-white text-brand-600 hover:bg-brand-50 border-none rounded-xl py-2 font-bold uppercase tracking-widest text-[10px]">
                Upgrade Now
              </Button>
            </Link>
          </div>
          <Sparkles className="absolute -right-4 -top-4 h-12 w-12 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
       </div>
     </div> 
     */}



      {/* User Profile */}
      <div className="relative z-10 px-6 pb-12">
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
          <div className="h-12 w-12 rounded-2xl bg-slate-800 overflow-hidden border border-white/10">
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
              alt="Avatar" 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-white">{user?.name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{user?.role}</p>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
