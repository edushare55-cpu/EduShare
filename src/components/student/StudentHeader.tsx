"use client";

import React, { useEffect, useState, useRef } from "react";
import { useStudentSidebarStore } from "@/store/sidebarStore";
import { useAuthStore } from "@/store/auth.store";
import { useNotifications, useMarkNotificationsRead, useClearReadNotifications } from "@/hooks/use-notifications";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

export default function StudentHeader() {
  const { toggle } = useStudentSidebarStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData } = useNotifications();
  const { mutate: markRead } = useMarkNotificationsRead();
  const { mutate: clearRead } = useClearReadNotifications();
  
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount ?? 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: any) => {
    setIsNotificationsOpen(false);
    if (!notification.isRead) {
      markRead([notification.id]);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleReadAll = () => {
    if (unreadCount === 0) return;
    const unreadIds = notifications.filter((n: any) => !n.isRead).map((n: any) => n.id);
    if (unreadIds.length > 0) markRead(unreadIds);
  };

  const handleClearAll = () => {
    if (unreadCount > 0) return;
    clearRead();
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "S";

  return (
    <header className="flex justify-between items-center w-full px-6 h-16 sticky top-0 z-40 bg-surface-container-lowest/90 backdrop-blur-md border-b border-surface-variant shadow-sm font-sans text-primary">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="md:hidden flex items-center justify-center p-2 rounded-md hover:bg-surface-container-low transition-colors"
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            menu
          </span>
        </button>
      </div>



      {/* Right Side */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors group"
          >
            <span
              className="material-symbols-outlined group-hover:text-primary transition-colors"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-surface-container-lowest">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest border border-surface-variant rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-4 border-b border-surface-variant flex justify-between items-center">
                <h3 className="font-semibold text-on-surface">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-xs bg-primary-container text-on-primary-container px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-on-surface-variant">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="divide-y divide-surface-variant/50">
                    {notifications.slice(0, 3).map((notif: any) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left p-4 hover:bg-surface-container-low transition-colors flex gap-3 ${
                          !notif.isRead ? "bg-primary/5" : ""
                        }`}
                      >
                        <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${!notif.isRead ? "bg-primary" : "bg-transparent"}`} />
                        <div>
                          <p className={`text-sm ${!notif.isRead ? "font-medium text-on-surface" : "text-on-surface-variant"}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-outline mt-1">
                            {formatTimeAgo(notif.createdAt)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {notifications.length > 0 && (
                <div className="flex flex-col">
                  <div className="p-3 border-t border-surface-variant bg-surface-container flex items-center justify-between">
                    <button
                      onClick={handleReadAll}
                      className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                        unreadCount === 0 
                          ? "text-on-surface-variant opacity-50 cursor-default" 
                          : "text-on-surface-variant hover:text-primary"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">done_all</span>
                      Mark all as read
                    </button>
                    <button
                      onClick={handleClearAll}
                      disabled={unreadCount > 0}
                      className={`text-xs font-medium flex items-center gap-1 transition-colors ${
                        unreadCount > 0 
                          ? "text-on-surface-variant opacity-50 cursor-not-allowed" 
                          : "text-error hover:bg-error-container/20 px-2 py-1 -mr-2 rounded-md"
                      }`}
                      title={unreadCount > 0 ? "You must read all notifications before clearing." : "Clear all notifications"}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Clear all
                    </button>
                  </div>
                </div>
              )}
              <Link
                href="/student/notifications"
                onClick={() => setIsNotificationsOpen(false)}
                className="p-3 border-t border-surface-variant bg-surface-container-lowest text-center text-sm font-medium text-primary hover:bg-surface-container-low transition-colors block w-full"
              >
                See all notifications
              </Link>
            </div>
          )}
        </div>

        {/* Avatar */}
        <Link href="/student/profile" className="ml-2">
          <Avatar className="w-8 h-8 cursor-pointer border border-surface-variant hover:ring-2 hover:ring-secondary hover:ring-offset-2 hover:ring-offset-surface-container-lowest transition-all">
            <AvatarImage src={user?.avatarUrl || ""} alt={user?.name || "Student"} className="object-cover" />
            <AvatarFallback className="bg-secondary-container text-on-secondary-container font-bold text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
