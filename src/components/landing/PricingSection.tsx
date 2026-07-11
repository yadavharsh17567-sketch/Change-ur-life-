import { motion } from 'motion/react';
import { Check, Zap, Rocket, Globe } from 'lucide-react';
import { Button } from '../ui/Button';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: "Starter",
    price: "0",
    desc: "Perfect for testing the AI automation flow.",
    icon: Zap,
    features: [
      "5 AI-generated shorts / month",
      "Auto subtitles & captions",
      "Basic SEO optimization",
      "Manual YouTube upload",
      "Community support"
    ],
    color: "slate"
  },
  {
    name: "Pro",
    price: "49",
    desc: "Everything you need to grow your channel fast.",
    icon: Rocket,
    features: [
      "Unlimited AI-generated shorts",
      "Premium subtitle styles",
      "AI thumbnail generator",
      "Auto upload to YouTube",
      "3 Connected YT accounts",
      "Priority AI processing"
    ],
    popular: true,
    color: "indigo"
  },
  {
    name: "Enterprise",
    price: "199",
    desc: "Scale your content network across infinite channels.",
    icon: Globe,
    features: [
      "Everything in Pro plan",
      "Infinite YouTube accounts",
      "Advanced brand kits",
      "Custom AI model training",
      "Dedicated account manager",
      "API access for developers"
    ],
    color: "purple"
  }
];

export function PricingSection() {
  return (
    <section className="py-32 relative px-6 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Simple, Premium Pricing</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto">
            Choose the plan that fits your content goals and scale your reach with AI.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`p-8 rounded-[2rem] border relative overflow-hidden transition-all duration-500 group ${
                plan.popular 
                  ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_80px_rgba(99,102,241,0.1)] scale-105 z-10' 
                  : 'bg-neutral-900/40 backdrop-blur-xl border-white/5 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-indigo-500 text-[10px] font-bold text-white uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/5`}>
                  <plan.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-neutral-400">{plan.desc}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">${plan.price}</span>
                  <span className="text-neutral-500 font-bold uppercase text-xs tracking-widest">/ Month</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span className="text-sm text-neutral-300 font-medium">{f}</span>
                  </div>
                ))}
              </div>

              <Link to="/register">
                <Button 
                  className={`w-full py-6 rounded-2xl text-base font-bold ${
                    plan.popular 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20' 
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/5'
                  }`}
                >
                  Get Started
                </Button>
              </Link>

              {/* Background Glow */}
              <div className={`absolute -bottom-24 -right-24 w-48 h-48 blur-[80px] opacity-20 pointer-events-none ${
                plan.popular ? 'bg-indigo-500' : 'bg-neutral-500'
              }`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
