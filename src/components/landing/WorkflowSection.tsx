import { motion } from 'motion/react';
import { Link, Download, Scissors, Mic, ImageIcon, Tag, UploadCloud, ChevronRight } from 'lucide-react';

export function WorkflowSection() {
  const steps = [
    { icon: Link, label: 'Paste Link' },
    { icon: Download, label: 'Download' },
    { icon: Scissors, label: 'AI Editing' },
    { icon: Mic, label: 'AI Subtitle' },
    { icon: ImageIcon, label: 'Thumbnail' },
    { icon: Tag, label: 'SEO' },
    { icon: UploadCloud, label: 'Upload' },
  ];

  return (
    <section className="py-32 relative overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Seamless AI Pipeline</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Our automated workflow handles everything from ingestion to distribution with zero manual effort.
          </p>
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
          {/* Connecting Line (Desktop) */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 hidden md:block -translate-y-1/2" />
          
          {/* Animated Flow Line (Desktop) */}
          <motion.div 
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hidden md:block -translate-y-1/2 origin-left"
          />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative z-10 group flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-white/5 flex items-center justify-center group-hover:border-indigo-500/50 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300 relative">
                <step.icon className="w-6 h-6 text-neutral-400 group-hover:text-indigo-400 transition-colors" />
                
                {/* Energy Pulse */}
                <div className="absolute inset-0 rounded-2xl bg-indigo-500/10 opacity-0 group-hover:opacity-100 animate-ping pointer-events-none" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest group-hover:text-white transition-colors">
                  {step.label}
                </p>
              </div>

              {/* Arrow (Mobile) */}
              {i < steps.length - 1 && (
                <div className="md:hidden mt-4">
                  <ChevronRight className="w-5 h-5 text-neutral-700 rotate-90" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
