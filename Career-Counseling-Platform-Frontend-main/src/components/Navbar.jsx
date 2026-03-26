import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LogOut, User, Briefcase, MessageSquare, BookOpen, LayoutDashboard, MessageCircle, Shield, CreditCard, Sun, Moon } from 'lucide-react';
import { Button } from './ui/BaseComponents';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/80 backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-solid)] text-white font-bold transition-all shadow-lg shadow-brand-500/20">CP</div>
            <span className="text-xl font-bold tracking-tight text-[var(--text-primary)] transition-colors">CareerPath AI</span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-1">
              <NavLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" />
              {isAdmin && <NavLink to="/admin" icon={<Shield size={18} />} label="Admin" />}
              <NavLink to="/counseling" icon={<MessageCircle size={18} />} label="Counseling" />
              <NavLink to="/resources" icon={<BookOpen size={18} />} label="Resources" />
              <NavLink to="/jobs" icon={<Briefcase size={18} />} label="Jobs" />
              <NavLink to="/forum" icon={<MessageSquare size={18} />} label="Forum" />
              <NavLink to="/pricing" icon={<CreditCard size={18} />} label="Pricing" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            className="rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all duration-300"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </Button>

          <div className="h-6 w-px bg-[var(--border-subtle)] mx-1" />

          {user ? (
            <div className="flex items-center gap-4">

              <Link to="/profile" className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-brand-500 transition-colors">
                <div className="h-8 w-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center border border-[var(--border-subtle)]">
                  <User size={16} />
                </div>
                <span className="hidden sm:inline">{user.name}</span>
              </Link>
              <Button variant="ghost" onClick={handleLogout} className="text-[var(--text-secondary)]">
                <LogOut size={18} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all hover:bg-[var(--bg-secondary)] hover:text-brand-500"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
