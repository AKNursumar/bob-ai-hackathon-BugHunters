import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Anchor, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AuthPage({ mode = 'login' }: { mode?: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex selection:bg-[#1677C8] selection:text-white">
      {/* Left side: Form */}
      <div className="w-full lg:w-[480px] bg-white flex flex-col justify-center px-8 sm:px-16 py-12 relative z-10 shadow-2xl">
        <Link to="/" className="flex items-center gap-2.5 mb-16">
          <div className="w-8 h-8 grid place-items-center rounded-lg"
            style={{ background: 'linear-gradient(135deg, #1677C8, #145B8C)' }}>
            <Anchor className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-[#071A2B] tracking-tight uppercase">
            HARBORLINE
          </span>
        </Link>

        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#071A2B] mb-2 tracking-tight">
            {mode === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="text-[13px] text-[#617080]">
            {mode === 'login'
              ? 'Enter your credentials to access the command layer.'
              : 'Join Harborline to predict and plan port operations.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-bold text-[#617080] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-[#98A8B4]" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-[#DCE3E8] rounded-lg text-[13px] focus:ring-2 focus:ring-[#1677C8]/20 focus:border-[#1677C8] transition-colors outline-none"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#617080] uppercase tracking-wider mb-1.5">
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-[#98A8B4]" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-[#DCE3E8] rounded-lg text-[13px] focus:ring-2 focus:ring-[#1677C8]/20 focus:border-[#1677C8] transition-colors outline-none"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-[#617080] uppercase tracking-wider">
                Password
              </label>
              {mode === 'login' && (
                <a href="#" className="text-[11px] font-semibold text-[#1677C8] hover:underline">
                  Forgot password?
                </a>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-[#98A8B4]" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-[#DCE3E8] rounded-lg text-[13px] focus:ring-2 focus:ring-[#1677C8]/20 focus:border-[#1677C8] transition-colors outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-[13px] font-bold text-white bg-[#1677C8] hover:bg-[#145B8C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1677C8] transition-colors mt-2"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-[13px] text-[#617080]">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-[#1677C8] hover:underline">
                Sign up
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#1677C8] hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right side: Cinematic Image */}
      <div className="hidden lg:flex flex-1 relative bg-[#071A2B] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: 'url(/hero.jpg)' }}
        />
        <div className="absolute inset-0 grid-overlay opacity-30" style={{ backgroundSize: '60px 60px' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071A2B] via-transparent to-transparent opacity-80" />
        
        {/* Subtle decorative overlays */}
        <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="xMidYMid slice">
          <line x1="10%" y1="0" x2="10%" y2="100%" stroke="#4CA3E3" strokeWidth="1" strokeDasharray="4,8" />
          <line x1="0" y1="20%" x2="100%" y2="20%" stroke="#4CA3E3" strokeWidth="1" strokeDasharray="4,8" />
          <circle cx="10%" cy="20%" r="5" fill="none" stroke="#4CA3E3" strokeWidth="2" />
        </svg>

        <div className="absolute bottom-12 left-12 max-w-md">
          <div className="eyebrow-blue mb-3 text-[#4CA3E3]">Port Operations Intelligence</div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight tracking-tight">
            See the port before the congestion.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed">
            Harborline turns live port signals into congestion forecasts, operational insight and 72-hour plans.
          </p>
        </div>
      </div>
    </div>
  );
}
