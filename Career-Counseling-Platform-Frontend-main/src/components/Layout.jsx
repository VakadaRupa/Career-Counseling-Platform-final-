import React, { useState } from 'react';
import { User, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Button } from './ui/BaseComponents';
import { Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] flex transition-colors duration-300">
      {/* Side Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[0.16,1,0.3,1] ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'}`}>
        {/* Top Header */}
        <header className="h-20 bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] sticky top-0 z-40 px-4 md:px-8 flex items-center justify-between transition-colors duration-300">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-colors flex items-center justify-center gap-2"
              aria-label="Toggle Menu"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]/60 group-hover:text-[var(--text-primary)] transition-colors">Menu</span>
            </button>

            <div className="flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest transition-colors">
              <Link to="/dashboard" className="hover:text-brand-500 transition-colors">Home</Link>
              <span className="text-[var(--border-subtle)]">/</span>
              <span className="text-[var(--text-primary)] truncate max-w-[80px] md:max-w-none transition-colors">{location.pathname.split('/')[1] || 'Dashboard'}</span>
            </div>
            <div className="h-4 w-px bg-slate-100 mx-4 hidden lg:block" />
          </div>

          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleTheme}
              className="rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all duration-300"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </Button>


            <div className="h-8 w-px bg-slate-100 mx-2" />

            <Link to="/profile" className="flex items-center gap-3 pl-2 group">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-bold text-[var(--text-primary)] leading-none group-hover:text-brand-500 transition-colors">My Account</span>
                <span className="text-[10px] text-[var(--text-secondary)] mt-1 uppercase tracking-widest transition-colors">Settings</span>
              </div>
              <div className="h-10 w-10 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] group-hover:border-brand-300 transition-colors overflow-hidden">
                <User size={20} />
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
