"use client";

import React, { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface SpeedGraderLayoutProps {
  classId: string;
  entityTitle: string;
  studentName: string;
  leftPaneContent: React.ReactNode;
  rightPaneContent: React.ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export function SpeedGraderLayout({
  classId,
  entityTitle,
  studentName,
  leftPaneContent,
  rightPaneContent,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: SpeedGraderLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Native drag-to-resize handler — no third-party package needed
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current || !leftPaneRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newLeftWidth = ((ev.clientX - containerRect.left) / containerRect.width) * 100;
      // Clamp between 25% and 75%
      leftPaneRef.current.style.width = `${Math.min(75, Math.max(25, newLeftWidth))}%`;
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] w-full flex flex-col bg-surface-container-lowest overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex-none h-16 border-b border-outline-variant/30 px-4 flex items-center justify-between bg-surface-container-low">
        <div className="flex items-center gap-4">
          <Link href={`/faculty/classes/${classId}/submissions`}>
            <Button variant="ghost" size="sm" className="gap-2 text-on-surface-variant hover:text-primary">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div className="h-6 w-px bg-outline-variant/30" />
          <div>
            <h1 className="text-sm font-semibold text-on-surface truncate max-w-[300px]">
              {entityTitle}
            </h1>
            <p className="text-xs text-on-surface-variant">SpeedGrader View</p>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-on-surface mr-2">{studentName}</span>
          <div className="flex items-center gap-1 border border-outline-variant/30 rounded-lg p-0.5 bg-surface-container-lowest shadow-sm">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-md"
              disabled={!hasPrev}
              onClick={onPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-outline-variant/30" />
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-md"
              disabled={!hasNext}
              onClick={onNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Split Interface — pure CSS flex, no third-party panels */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* Left Pane */}
        <div
          ref={leftPaneRef}
          style={{ width: "65%" }}
          className="relative overflow-auto bg-surface-container-lowest"
        >
          {leftPaneContent}
        </div>

        {/* Drag Divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          className="w-1.5 flex-none bg-outline-variant/20 hover:bg-primary/50 active:bg-primary/70 transition-colors flex items-center justify-center cursor-col-resize z-10 group select-none"
        >
          <div className="h-8 w-1 rounded-full bg-outline-variant/50 group-hover:bg-primary transition-colors" />
        </div>

        {/* Right Pane */}
        <div className="flex-1 relative overflow-auto bg-surface-container-low/30 border-l border-outline-variant/30 shadow-inner">
          {rightPaneContent}
        </div>
      </div>
    </div>
  );
}
