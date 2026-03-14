
import React from 'react';
import { User as UserIcon, Settings, Shield, Bell, CreditCard, ChevronRight, LogOut, Heart, Shirt, Camera } from 'lucide-react';
import { User } from '../types';

interface Props {
  user: User;
  onLogout: () => void;
  stats: {
    looks: number;
    wardrobe: number;
  }
}

const Profile: React.FC<Props> = ({ user, onLogout, stats }) => {
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full bg-neutral-900 border-2 border-rose-gold p-1">
            <div className="w-full h-full rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
               <UserIcon className="w-16 h-16 text-neutral-600" />
            </div>
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-rose-gold text-white rounded-full shadow-lg hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center md:text-left space-y-2">
          <h1 className="text-4xl serif text-white">{user.name}</h1>
          <p className="text-neutral-500 font-light">{user.email}</p>
          <div className="flex gap-4 pt-2 justify-center md:justify-start">
            <div className="text-center px-4 py-2 bg-neutral-900 rounded-2xl border border-neutral-800">
              <p className="text-rose-gold text-xl font-bold">{stats.looks}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">AI Looks</p>
            </div>
            <div className="text-center px-4 py-2 bg-neutral-900 rounded-2xl border border-neutral-800">
              <p className="text-rose-gold text-xl font-bold">{stats.wardrobe}</p>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Wardrobe</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <ProfileOption icon={<Bell className="w-5 h-5 text-rose-gold" />} label="Notifications" description="Manage your style alerts and boutique updates" />
        <ProfileOption icon={<Shield className="w-5 h-5 text-rose-gold" />} label="Security" description="Passwords, authentication and privacy" />
        <ProfileOption icon={<CreditCard className="w-5 h-5 text-rose-gold" />} label="Billing" description="Subscription status and payment history" />
        <ProfileOption icon={<Settings className="w-5 h-5 text-rose-gold" />} label="Preferences" description="Theme, language and style profile settings" />
      </div>

      <button 
        onClick={onLogout}
        className="w-full py-4 rounded-2xl border border-rose-gold/20 text-rose-gold flex items-center justify-center gap-2 hover:bg-rose-gold/10 transition-all font-medium"
      >
        <LogOut className="w-5 h-5" /> Sign Out from Boutique
      </button>
    </div>
  );
};

const ProfileOption = ({ icon, label, description }: { icon: React.ReactNode, label: string, description: string }) => (
  <button className="w-full glass p-6 rounded-3xl flex items-center justify-between group hover:border-rose-gold/40 transition-all">
    <div className="flex items-center gap-6">
      <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div className="text-left">
        <h4 className="text-white font-medium group-hover:text-rose-gold transition-colors">{label}</h4>
        <p className="text-neutral-500 text-sm font-light">{description}</p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-neutral-700 group-hover:text-rose-gold group-hover:translate-x-1 transition-all" />
  </button>
);

export default Profile;
