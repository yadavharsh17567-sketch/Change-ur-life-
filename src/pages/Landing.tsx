import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ParticlesBackground } from '../components/landing/ParticlesBackground';
import { LandingHero } from '../components/landing/LandingHero';
import { StatsSection } from '../components/landing/StatsSection';
import { WorkflowSection } from '../components/landing/WorkflowSection';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { DemoSection } from '../components/landing/DemoSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { PricingSection } from '../components/landing/PricingSection';
import { LandingFooter } from '../components/landing/LandingFooter';

export function Landing() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-20 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3 font-black text-2xl tracking-tighter text-white">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-indigo-600 shadow-lg shadow-indigo-500/20">
              <span className="text-white font-black text-lg">AI</span>
            </div>
            <span className="hidden sm:block">Change Ur Life</span>
          </div>
          
          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#workflow">Workflow</NavLink>
            <NavLink href="#pricing">Pricing</NavLink>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-bold uppercase tracking-widest text-neutral-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link to="/register">
              <Button size="lg" className="bg-white text-black hover:bg-neutral-200 rounded-2xl px-6 h-11 text-sm font-black uppercase tracking-widest">
                Start Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Background Layer */}
      <ParticlesBackground />

      {/* Main Content Sections */}
      <main className="relative z-10">
        <LandingHero />
        <StatsSection />
        <div id="workflow">
          <WorkflowSection />
        </div>
        <div id="features">
          <FeatureGrid />
        </div>
        <DemoSection />
        <TestimonialsSection />
        <div id="pricing">
          <PricingSection />
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="text-sm font-bold uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
    >
      {children}
    </a>
  );
}
