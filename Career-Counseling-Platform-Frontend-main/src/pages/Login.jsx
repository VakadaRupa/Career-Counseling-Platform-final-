import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/ui/BaseComponents';
import { LogIn, Mail, Lock, Loader2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-secondary)] px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      <Card className="w-full max-w-md p-8 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white font-bold text-2xl transition-colors">
            CP
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-[var(--text-primary)] transition-colors">Welcome back</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)] transition-colors">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-brand-600 hover:text-brand-500 transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] transition-colors">Email address</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-secondary)]/60">
                  <Mail size={18} />
                </div>
                <Input
                  type="email"
                  required
                  className="pl-10"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] transition-colors">Password</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--text-secondary)]/60">
                  <Lock size={18} />
                </div>
                <Input
                  type="password"
                  required
                  className="pl-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 bg-brand-600 hover:bg-brand-700 text-white transition-all shadow-lg shadow-brand-500/20" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
            Sign in
          </Button>
          
        </form>
      </Card>
    </div>
  );
}
