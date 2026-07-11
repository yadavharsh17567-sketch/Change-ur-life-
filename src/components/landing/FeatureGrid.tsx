import { motion } from 'motion/react';
import { 
  Scissors, 
  Mic, 
  ImageIcon, 
  Tag, 
  UploadCloud, 
  Layout, 
  Activity, 
  Youtube, 
  Music, 
  Palette 
} from 'lucide-react';

const features = [
  { 
    icon: Scissors, 
    title: "AI Clip Detection", 
    desc: "Automatically identifies high-retention moments from long videos and live streams.",
    color: "indigo"
  },
  { 
    icon: Mic, 
    title: "Auto Subtitle", 
    desc: "Generates ultra-accurate, styled subtitles with dynamic animations for higher engagement.",
    color: "purple"
  },
  { 
    icon: ImageIcon, 
    title: "AI Thumbnails", 
    desc: "Creates eye-catching thumbnails optimized for click-through rate using AI image generation.",
    color: "pink"
  },
  { 
    icon: Tag, 
    title: "SEO Generator", 
    desc: "Optimizes titles, descriptions, and tags for the YouTube algorithm automatically.",
    color: "blue"
  },
  { 
    icon: UploadCloud, 
    title: "Auto Upload", 
    desc: "Direct integration with YouTube to publish your videos as soon as they are ready.",
    color: "emerald"
  },
  { 
    icon: Activity, 
    title: "Pipeline Monitor", 
    desc: "Real-time tracking of every stage in your video automation workflow.",
    color: "amber"
  },
  { 
    icon: Youtube, 
    title: "Multi-Account", 
    desc: "Manage and publish to multiple YouTube channels from a single unified dashboard.",
    color: "red"
  },
  { 
    icon: Music, 
    title: "Smart Music", 
    desc: "Automatically syncs viral background music and sound effects to your clips.",
    color: "violet"
  },
  { 
    icon: Palette, 
    title: "Brand Kits", 
    desc: "Maintain consistent branding across all your shorts with custom fonts and colors.",
    color: "cyan"
  },
];

export function FeatureGrid() {
  return (
    <section className="py-32 relative px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Enterprise-Grade Features</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Everything you need to scale your content empire without hiring a full production team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="p-8 rounded-3xl bg-neutral-900/40 backdrop-blur-xl border border-white/5 hover:border-white/10 hover:bg-neutral-800/40 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Card Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/5 blur-[60px] group-hover:bg-indigo-500/10 transition-colors" />
              
              <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              <h3 className="text-xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-neutral-400 leading-relaxed text-sm">
                {feature.desc}
              </p>

              <div className="mt-8 flex items-center gap-2">
                <div className="h-1 w-12 rounded-full bg-indigo-500/30 group-hover:bg-indigo-500 transition-colors" />
                <div className="h-1 w-1 rounded-full bg-white/10" />
                <div className="h-1 w-1 rounded-full bg-white/10" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
