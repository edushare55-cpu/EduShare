import type { Metadata } from "next";
import { Settings, Shield, Globe, Bell, Database } from "lucide-react";

export const metadata: Metadata = { title: "Settings" };

export default function AdminSettingsPage() {
  return (
    <div className="p-8 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="font-headline-lg text-on-surface tracking-tight">Platform Settings</h1>
        <p className="font-body-md text-on-surface-variant mt-2">Configure platform-wide settings and system preferences.</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-12 text-center shadow-sm relative overflow-hidden">
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6 shadow-inner">
            <Settings className="w-10 h-10 animate-[spin_6s_linear_infinite]" />
          </div>
          
          <h2 className="text-2xl font-bold text-on-surface mb-3">Settings Dashboard Coming in V2</h2>
          <p className="text-on-surface-variant mb-8 leading-relaxed">
            We are building a comprehensive settings dashboard that will allow you to control global platform behavior, security policies, and notification defaults from one centralized location.
          </p>

          <div className="grid grid-cols-2 gap-4 w-full text-left">
            <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex gap-3">
              <Shield className="w-5 h-5 text-secondary mt-0.5" />
              <div>
                <div className="font-bold text-sm text-on-surface">Security</div>
                <div className="text-xs text-on-surface-variant">Auth & Roles</div>
              </div>
            </div>
            <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex gap-3">
              <Globe className="w-5 h-5 text-tertiary mt-0.5" />
              <div>
                <div className="font-bold text-sm text-on-surface">Branding</div>
                <div className="text-xs text-on-surface-variant">Logos & Colors</div>
              </div>
            </div>
            <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex gap-3">
              <Bell className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="font-bold text-sm text-on-surface">Alerts</div>
                <div className="text-xs text-on-surface-variant">System Email</div>
              </div>
            </div>
            <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/20 flex gap-3">
              <Database className="w-5 h-5 text-error mt-0.5" />
              <div>
                <div className="font-bold text-sm text-on-surface">Backups</div>
                <div className="text-xs text-on-surface-variant">Data Export</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
