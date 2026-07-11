import { motion } from 'motion/react';
import { Button } from '../../components/ui/Button';

export function Profile() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-neutral-400 text-sm mt-1">Manage your personal information.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-white/5 bg-neutral-900/50 overflow-hidden"
      >
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 p-1">
              <div className="w-full h-full rounded-full bg-neutral-900 border-4 border-neutral-900 overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=User&background=171717&color=a3a3a3&size=150" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Jane Doe</h2>
              <p className="text-neutral-400 text-sm">jane@example.com</p>
              <div className="mt-3 flex gap-3">
                <Button size="sm" variant="outline">Change Avatar</Button>
                <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">Remove</Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">First Name</label>
              <input type="text" defaultValue="Jane" className="w-full h-10 bg-neutral-950 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Last Name</label>
              <input type="text" defaultValue="Doe" className="w-full h-10 bg-neutral-950 border border-white/10 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Email Address</label>
            <input type="email" defaultValue="jane@example.com" disabled className="w-full h-10 bg-neutral-950/50 border border-white/5 rounded-lg px-3 text-sm text-neutral-500 cursor-not-allowed" />
          </div>

          <div className="pt-4 flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
