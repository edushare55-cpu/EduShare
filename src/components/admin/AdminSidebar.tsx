"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { useSidebarStore } from "@/store/sidebarStore";
import { logoutAction } from "@/lib/actions/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const navItems = [
  { label: "Dashboard", icon: "dashboard", href: "/admin/dashboard" },
  { label: "User Management", icon: "group", href: "/admin/users" },
  { label: "Sections", icon: "class", href: "/admin/sections" },
  { label: "Reports", icon: "description", href: "/admin/reports" },
  { label: "Audit Logs", icon: "history", href: "/admin/audit-logs" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useSidebarStore();

  const { data: notificationsData } = useNotifications();
  const notifications = notificationsData?.notifications || [];
  const unreadReports = notifications.filter((n: any) => !n.isRead && n.type === "NEW_REPORT").length;
  const unreadUsers = notifications.filter((n: any) => !n.isRead && n.type === "USER_REGISTERED").length;

  const getBadgeCount = (href: string) => {
    if (href === "/admin/reports") return unreadReports;
    if (href === "/admin/users") return unreadUsers;
    return 0;
  };

  const handleSignOut = async () => {
    await logoutAction();
    router.push("/login");
  };

  const SidebarContent = (
    <div className="flex flex-col h-full py-6 w-64 bg-primary-container text-secondary-fixed-dim border-r border-primary-container shadow-2xl font-sans text-sm font-medium">
      {/* Logo Section */}
      <div className="px-6 mb-8 flex items-center gap-3">
        <Image
          src="/pclu-logo.png"
          alt="Polytechnic College of La Union seal"
          width={44}
          height={48}
          className="h-12 w-auto shrink-0 rounded-full bg-white p-0.5"
        />
        <div>
          <h1 className="text-lg font-black text-white tracking-tight leading-none">
            EduShare
          </h1>
          <p className="text-xs text-secondary-fixed-dim/70 mt-1">
            Polytechnic Admin
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex flex-col gap-1 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close} // Close sidebar on mobile when navigating
              className={`px-4 py-3 flex items-center justify-between transition-all duration-200 ${
                isActive
                  ? "bg-primary/50 text-white border-l-4 border-secondary-fixed-dim hover:bg-primary/30"
                  : "text-secondary-fixed-dim/70 hover:text-white hover:bg-primary/30 hover:translate-x-1"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 0" }}
                >
                  {item.icon}
                </span>
                {item.label}
              </div>
              {getBadgeCount(item.href) > 0 && (
                <span className="bg-error text-white text-[10px] font-bold px-1.5 min-w-[20px] h-[20px] flex items-center justify-center rounded-full">
                  {getBadgeCount(item.href) > 99 ? '99+' : getBadgeCount(item.href)}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* System Status Indicator */}
      <div className="px-6 mt-auto mb-6">
        <div className="bg-primary/30 rounded-lg p-3 text-xs text-white border border-secondary-fixed-dim/20 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 block" />
          System Status: Online
        </div>
      </div>

      {/* Bottom Links */}
      <div className="border-t border-primary/50 pt-4 px-2 flex flex-col gap-1">
        {/* Removed Support Link */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              className="w-full text-left text-secondary-fixed-dim/70 hover:text-white px-4 py-3 flex items-center gap-3 hover:bg-primary/30 transition-all duration-200 hover:translate-x-1"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                logout
              </span>
              Sign Out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md bg-surface border border-outline-variant/30 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-on-surface">Are you sure you want to sign out?</AlertDialogTitle>
              <AlertDialogDescription className="text-on-surface-variant">
                You will be securely logged out of the Admin Portal. You will need your credentials to log back in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-outline-variant/50 hover:bg-surface-container text-on-surface">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSignOut} className="bg-primary hover:bg-primary/90 text-white rounded-lg">
                Sign Out
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex fixed left-0 top-0 h-full z-50">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <div className="md:hidden">
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={close}
          />
        )}
        {/* Drawer */}
        <div
          className={`fixed left-0 top-0 h-full z-50 transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {SidebarContent}
        </div>
      </div>
    </>
  );
}
