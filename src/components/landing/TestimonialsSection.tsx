import { motion } from 'motion/react';
import { Star, Youtube } from 'lucide-react';

const testimonials = [
  {
    name: "Alex Rivera",
    channel: "@AlexTech",
    subs: "1.2M",
    text: "This AI platform has completely revolutionized my content workflow. I used to spend hours editing shorts, now it's done in minutes with better results.",
    image: "https://i.pravatar.cc/150?u=alex"
  },
  {
    name: "Sarah Chen",
    channel: "@SarahCreates",
    subs: "450K",
    text: "The auto-subtitle feature is a game changer. My retention rates have jumped by 40% since I started using their dynamic caption styles.",
    image: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    name: "Marcus Jordan",
    channel: "@MJVlogs",
    subs: "890K",
    text: "Uploading to multiple channels used to be a nightmare. Now I just paste a link and the AI handles distribution across my whole network.",
    image: "https://i.pravatar.cc/150?u=marcus"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-32 relative px-6 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Trusted by the Best</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Join thousands of professional creators who are scaling their reach with our AI automation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-8 rounded-3xl bg-neutral-900/50 border border-white/5 hover:border-indigo-500/30 transition-all duration-300 relative group"
            >
              <div className="flex items-center gap-4 mb-6">
                <img src={t.image} className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/10" alt={t.name} />
                <div>
                  <h4 className="font-bold text-white">{t.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <Youtube className="w-3 h-3 text-red-500" />
                    {t.channel} • {t.subs} Subs
                  </div>
                </div>
              </div>
              
              <div className="flex gap-1 mb-4 text-amber-500">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
              </div>

              <p className="text-neutral-400 leading-relaxed italic">
                "{t.text}"
              </p>

              {/* Decorative accent */}
              <div className="absolute bottom-4 right-8 text-indigo-500 opacity-10 group-hover:opacity-30 transition-opacity">
                <Star className="w-12 h-12 fill-current" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
