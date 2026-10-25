"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { useStudentSidebarStore } from "@/store/sidebarStore";
import { logoutAction } from "@/lib/actions/auth";
import { useClasses } from "@/hooks/use-class";
import { JoinSectionModal } from "./JoinSectionModal";
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

const footerItems = [
  { label: "Profile", icon: "account_circle", href: "/student/profile" },
];

export default function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen, close } = useStudentSidebarStore();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const { data: notificationsData } = useNotifications();

  const notifications = notificationsData?.notifications || [];
  const classNotifs = notifications.filter(
    (n: any) => !n.isRead && ["NEW_POST", "NEW_ASSIGNMENT", "LESSON_PUBLISHED", "ASSESSMENT_GRADED", "CLASS_JOINED"].includes(n.type)
  ).length;

  const getBadgeCount = (label: string) => {
    if (label === "My Section") return classNotifs;
    return 0;
  };

  const { data: classes = [] } = useClasses();
  const firstClassId = classes.length > 0 ? classes[0].id : null;
  const mySectionHref = firstClassId ? `/student/classes/${firstClassId}/feed` : "/student/classes";

  const navItems = [
    { label: "Dashboard", icon: "dashboard", href: "/student/dashboard" },
    { label: "My Section", icon: "school", href: mySectionHref },
  ];

  const handleLogout = async () => {
    await logoutAction();
    router.push("/login");
  };

  const SidebarContent = (
    <div className="bg-slate-50 font-sans text-sm h-screen w-64 border-r border-slate-200 flex flex-col py-6 px-4 gap-2 z-40">
      {/* Header Section */}
      <div className="mb-8 px-2 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Image
            src="/pclu-logo.png"
            alt="Polytechnic College of La Union seal"
            width={44}
            height={48}
            className="h-12 w-auto shrink-0 rounded-full bg-white p-0.5"
          />
          <div>
            <h1 className="text-lg font-black text-blue-900 font-headline-md tracking-tight leading-none">
              Student Portal
            </h1>
            <p className="text-slate-500 font-label-sm text-xs uppercase tracking-wider mt-1 truncate max-w-[150px]">
              {classes.length > 0 ? classes[0].name : "No Section Joined"}
            </p>
          </div>
        </div>

        {classes.length === 0 && (
          <button
            onClick={() => setJoinModalOpen(true)}
            className="mt-4 w-full bg-secondary text-on-secondary rounded-lg py-2 px-6 font-label-md text-label-md hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Join a Section
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          let isActive = false;
          if (item.label === "Dashboard") {
            isActive = pathname === item.href;
          } else if (item.label === "My Section") {
            isActive = pathname.startsWith("/student/classes");
          } else {
            isActive = pathname.startsWith(item.href);
          }
          
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
              {getBadgeCount(item.label) > 0 && (
                <span className="bg-error text-white text-[10px] font-bold px-1.5 min-w-[20px] h-[20px] flex items-center justify-center rounded-full">
                  {getBadgeCount(item.label) > 99 ? '99+' : getBadgeCount(item.label)}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="mt-auto border-t border-slate-200 pt-4 flex flex-col gap-1">
        {footerItems.map((item) => {
          const isActive = item.href === "/student/profile" 
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
                You will be securely logged out of the Student Portal. You will need your credentials to log back in.
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

      <JoinSectionModal open={joinModalOpen} onOpenChange={setJoinModalOpen} />
    </>
  );
}
