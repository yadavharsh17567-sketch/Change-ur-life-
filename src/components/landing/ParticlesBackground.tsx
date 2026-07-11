import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function ParticlesBackground() {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; duration: number; delay: number }[]>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 10,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Aurora Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      
      {/* Animated Grid */}
      <div 
        className="absolute inset-0 opacity-[0.15]" 
        style={{ 
          backgroundImage: 'linear-gradient(to right, #4f4f4f 1px, transparent 1px), linear-gradient(to bottom, #4f4f4f 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)'
        }} 
      />

      {/* Floating Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear",
          }}
        />
      ))}

      {/* Light Beams */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent opacity-30" />
    </div>
  );
}
