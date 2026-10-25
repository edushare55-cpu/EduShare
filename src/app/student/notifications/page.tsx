"use client";

import React from "react";
import { useNotifications, useMarkNotificationsRead, useClearReadNotifications } from "@/hooks/use-notifications";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function StudentNotificationsPage() {
  const router = useRouter();
  const { data: notifData, isLoading } = useNotifications();
  const notifications = notifData?.notifications || [];
  const { mutate: markRead } = useMarkNotificationsRead();
  const { mutate: clearRead, isPending: isClearing } = useClearReadNotifications();

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((n: any) => !n.isRead).map((n: any) => n.id);
    if (unreadIds.length > 0) markRead(unreadIds);
  };

  const hasReadNotifications = notifications.some((n: any) => n.isRead);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markRead([notification.id]);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-on-surface tracking-tight mb-2">Notifications</h1>
          <p className="text-on-surface-variant text-lg">Your activity notifications.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => clearRead()} 
            disabled={!hasReadNotifications || isClearing}
            variant="outline" 
            className="border-error/20 hover:bg-error/10 text-error shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] mr-2">delete</span>
            Delete all
          </Button>
          <Button onClick={handleMarkAllRead} variant="outline" className="border-outline-variant/50 hover:bg-surface-container text-on-surface shadow-sm">
            <span className="material-symbols-outlined text-[18px] mr-2">done_all</span>
            Mark as read all
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center p-12 text-on-surface-variant font-body-lg">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="flex flex-col gap-4">
          {notifications.map((notification: any) => (
            <Card
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 flex items-start gap-4 transition-all cursor-pointer hover:bg-surface-container-low ${
                notification.isRead ? "bg-surface-container-lowest opacity-70" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">
                  {notification.type === "NEW_POST" ? "feed" :
                   notification.type === "NEW_COMMENT" ? "forum" :
                   notification.type === "NEW_SUBMISSION" ? "assignment_turned_in" :
                   "notifications"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-body-md text-on-surface">{notification.message}</p>
                <p className="font-label-sm text-on-surface-variant mt-1">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(notification.createdAt))}
                </p>
              </div>
              {!notification.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markRead([notification.id]);
                  }}
                  className="w-8 h-8 rounded-full hover:bg-primary/10 text-primary flex items-center justify-center transition-colors"
                  title="Mark as read"
                >
                  <span className="material-symbols-outlined text-[20px]">check</span>
                </button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 text-on-surface-variant font-body-lg bg-surface-container-lowest rounded-xl border border-outline-variant/30">
          You have no notifications.
        </div>
      )}
    </div>
  );
}
