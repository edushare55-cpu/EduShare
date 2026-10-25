"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useParams } from "next/navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { useFacultySidebarStore } from "@/store/sidebarStore";
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

// footerItems removed to avoid redundancy with the header

export default function FacultySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const { isOpen, close } = useFacultySidebarStore();
  const { data: notificationsData } = useNotifications();

  const notifications = notificationsData?.notifications || [];
  const classNotifs = notifications.filter(
    (n: any) => !n.isRead && ["CLASS_JOINED", "NEW_SUBMISSION", "NEW_COMMENT"].includes(n.type)
  ).length;

  const getBadgeCount = (href: string) => {
    if (href === "/faculty/classes") return classNotifs;
    return 0;
  };

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/faculty/dashboard" },
    { label: "My Sections", icon: "school", href: "/faculty/classes" },
  ];

  const footerItems = [
    { label: "Profile", icon: "account_circle", href: "/faculty/profile" },
  ];

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  const SidebarContent = (
    <div className="bg-slate-50 font-sans text-sm h-screen w-64 border-r border-slate-200 flex flex-col py-6 px-4 gap-2 z-40">
      {/* Header Section */}
      <div className="mb-8 px-2 flex items-center gap-3">
        <Image
          src="/pclu-logo.png"
          alt="Polytechnic College of La Union seal"
          width={44}
          height={48}
          className="h-12 w-auto shrink-0 rounded-full bg-white p-0.5"
        />
        <div>
          <h1 className="text-lg font-black text-blue-900 font-headline-md tracking-tight leading-none">
            Faculty Portal
          </h1>
          <p className="text-slate-500 font-label-sm text-xs uppercase tracking-wider mt-1">
            Intro to Computing
          </p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={`flex items-center justify-between px-3 py-2 transition-all duration-200 ${
                isActive
                  ? "bg-white text-blue-900 font-bold border-r-4 border-blue-900 rounded-l-lg hover:bg-slate-100 focus:ring-2 focus:ring-blue-500/20"
                  : "text-slate-500 hover:text-blue-900 rounded-lg hover:bg-slate-100 focus:ring-2 focus:ring-blue-500/20"
              }`}
            >
              <div className="flex items-center gap-2">
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

      {/* Footer Navigation */}
      <div className="mt-auto border-t border-slate-200 pt-4 flex flex-col gap-1">
        {footerItems.map((item) => {
          const isActive = item.href === "/faculty/profile" 
            ? pathname === item.href 
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={close}
              className={`flex items-center gap-2 px-3 py-2 transition-all duration-200 ${
                isActive
                  ? "bg-white text-blue-900 font-bold border-r-4 border-blue-900 rounded-l-lg hover:bg-slate-100 focus:ring-2 focus:ring-blue-500/20"
                  : "text-slate-500 hover:text-blue-900 rounded-lg hover:bg-slate-100 focus:ring-2 focus:ring-blue-500/20"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-error hover:bg-error-container/20 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-error/20 w-full text-left">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>
                logout
              </span>
              Log Out
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-md bg-surface border border-outline-variant/30 rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold text-on-surface">Are you sure you want to log out?</AlertDialogTitle>
              <AlertDialogDescription className="text-on-surface-variant">
                You will be securely logged out of the Faculty Portal. You will need your credentials to log back in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-outline-variant/50 hover:bg-surface-container text-on-surface">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout} className="bg-primary hover:bg-primary/90 text-white rounded-lg">
                Log Out
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
      <div className="hidden md:flex sticky left-0 top-0 h-screen z-40">
        {SidebarContent}
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <div className="md:hidden">
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 transition-opacity"
            onClick={close}
          />
        )}
        <div
          className={`fixed left-0 top-0 h-full w-64 z-50 transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {SidebarContent}
        </div>
      </div>
    </>
  );
}
