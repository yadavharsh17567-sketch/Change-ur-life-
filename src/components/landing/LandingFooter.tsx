import { Link } from 'react-router-dom';
import { Twitter, Github, Disc as Discord, Youtube, ArrowUpRight } from 'lucide-react';

export function LandingFooter() {
  const links = {
    Product: ['Features', 'Workflow', 'Demo', 'Pricing'],
    Resources: ['Documentation', 'API Reference', 'Community', 'Roadmap'],
    Company: ['About', 'Blog', 'Careers', 'Legal'],
    Legal: ['Privacy Policy', 'Terms of Service', 'Cookie Policy']
  };

  return (
    <footer className="pt-32 pb-12 border-t border-white/5 relative overflow-hidden px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-3 font-bold text-2xl tracking-tighter text-white">
              <img src="/logo.png" alt="CUL Logo" className="w-16 h-16 object-contain" />
              <span>Change Ur Life</span>
            </div>
            <p className="text-neutral-400 max-w-xs text-sm leading-relaxed">
              The world's most advanced AI video automation platform for creators, brands, and media teams.
            </p>
            <div className="flex gap-4">
              <SocialLink icon={Twitter} />
              <SocialLink icon={Discord} />
              <SocialLink icon={Github} />
              <SocialLink icon={Youtube} />
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-6">{title}</h4>
              <ul className="space-y-4">
                {items.map(item => (
                  <li key={item}>
                    <Link to="#" className="text-neutral-500 hover:text-white transition-colors text-sm font-medium flex items-center gap-1 group">
                      {item}
                      <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-y-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-neutral-600 text-xs font-medium uppercase tracking-widest">
            © 2026 Change Ur Life. Built for the future of content.
          </p>
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">All Systems Operational</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({ icon: Icon }: { icon: any }) {
  return (
    <Link to="#" className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-neutral-500 hover:text-white hover:bg-white/10 transition-all group">
      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
    </Link>
  );
}
