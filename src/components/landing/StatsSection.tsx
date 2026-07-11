import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

export function StatsSection() {
  return (
    <section className="py-12 border-y border-white/5 bg-neutral-950/50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
        <StatItem value={50} suffix="K+" label="Videos Processed" />
        <StatItem value={1} decimal={.2} suffix="M+" label="AI Captions Generated" />
        <StatItem value={98} suffix="%" label="Upload Success Rate" />
        <StatItem value={120} suffix="+" label="Countries" />
      </div>
    </section>
  );
}

function StatItem({ value, decimal = 0, suffix, label }: { value: number; decimal?: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-black text-white mb-2 flex items-center justify-center">
        {decimal > 0 ? (count + decimal).toFixed(1) : Math.floor(count)}
        <span className="text-indigo-500 ml-1">{suffix}</span>
      </div>
      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
    </div>
  );
}
