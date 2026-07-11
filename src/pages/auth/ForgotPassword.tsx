import { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate reset
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-white/5 shadow-lg border border-white/10">
            <img 
              src="/logo.png" 
              alt="CUL Logo" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-indigo-500 font-bold text-xl">CUL</span>';
              }}
            />
          </div>
        </div>

        {!isSent ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">Reset password</h1>
              <p className="text-neutral-400 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-2">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 bg-neutral-950/50 border border-white/10 rounded-xl pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 text-base mt-2 gap-2 group" disabled={isLoading}>
                {isLoading ? 'Sending link...' : 'Send reset link'}
                {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </Button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-neutral-400 text-sm mb-6">We've sent a password reset link to <span className="text-white font-medium">{email}</span></p>
            <Button variant="outline" className="w-full h-12" onClick={() => setIsSent(false)}>
              Didn't receive it? Click to resend
            </Button>
          </div>
        )}

        <div className="mt-8">
          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-indigo-300 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
