
import React, { useState } from 'react';
import { LogIn, Mail, Lock, UserPlus, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: (user: any) => void;
}

const Auth: React.FC<Props> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate auth
    onLogin({ id: '1', email, name: 'Guest User' });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      
      <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="glass p-8 md:p-12 rounded-[40px] shadow-2xl border border-rose-gold/20">
          <div className="text-center mb-10 space-y-2">
            <h1 className="text-5xl serif text-white tracking-tight">WardrobeX</h1>
            <p className="text-neutral-400 font-light tracking-widest uppercase text-xs">A New Dimension of Fashion</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-rose-gold transition-colors" />
                <input
                  type="email"
                  placeholder="Email Address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-rose-gold/50 transition-all placeholder:text-neutral-600"
                />
              </div>

              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500 group-focus-within:text-rose-gold transition-colors" />
                <input
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-900/50 border border-neutral-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:border-rose-gold/50 transition-all placeholder:text-neutral-600"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-rose-gold text-white py-4 rounded-2xl font-semibold hover:bg-rose-gold/90 transition-all flex items-center justify-center gap-2 group shadow-xl shadow-rose-gold/10"
            >
              {isLogin ? (
                <>
                  Enter Boutique <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                <>
                  Create Account <UserPlus className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-neutral-600 text-sm font-light uppercase tracking-widest">Or</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <button
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-8 py-4 border border-neutral-800 text-neutral-400 rounded-2xl hover:bg-neutral-800 transition-all text-sm font-medium"
          >
            {isLogin ? "Need an account? Join the Club" : "Already a member? Sign in"}
          </button>
          
          <p className="text-center mt-8 text-neutral-600 text-xs font-light tracking-wide">
            By entering, you agree to our Terms of Luxury.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
