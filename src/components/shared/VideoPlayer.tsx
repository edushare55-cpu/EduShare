"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useSendHeartbeat } from "@/hooks/use-lessons";

interface VideoPlayerProps {
  src:           string;
  lessonId:      string;
  videoDuration: number;
  initialHighestSecond?: number;
  initialWatchedSeconds?: number;
  className?:    string;
  onCompleted?:  () => void;
}

/**
 * VideoPlayer — Custom native <video> component with:
 * - 5-second heartbeat to POST progress
 * - Strict Anti-seek: completely blocks seeking forwards AND backwards
 * - 95% completion threshold ring on progress bar
 * - Premium custom controls UI
 */
export default function VideoPlayer({
  src,
  lessonId,
  videoDuration,
  initialHighestSecond = 0,
  initialWatchedSeconds = 0,
  className,
  onCompleted,
}: VideoPlayerProps) {
  const videoRef       = useRef<HTMLVideoElement>(null);
  const heartbeatRef   = useRef<NodeJS.Timeout | null>(null);
  const watchedRef     = useRef(initialWatchedSeconds);
  const highestRef     = useRef(initialHighestSecond);
  const lastTimeRef    = useRef(0);
  const completedRef   = useRef(false);
  const [isPlaying, setIsPlaying]   = useState(false);
  const [isMuted, setIsMuted]       = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(videoDuration || 0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { mutate: sendHeartbeat } = useSendHeartbeat(lessonId);

  const completionThreshold = Math.floor(videoDuration * 0.95);

  // ─── Heartbeat ─────────────────────────────────────────────────────────────
  const fireHeartbeat = useCallback(() => {
    sendHeartbeat(
      { 
        watchedSeconds: Math.floor(watchedRef.current), 
        highestSecond: Math.floor(highestRef.current) 
      },
      {
        onSuccess: (result) => {
          if (result.justCompleted && !completedRef.current) {
            completedRef.current = true;
            onCompleted?.();
          }
        },
      }
    );
  }, [sendHeartbeat, onCompleted]);

  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(fireHeartbeat, 5000);
  }, [fireHeartbeat]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // ─── Video event handlers ───────────────────────────────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const ct = video.currentTime;
    setCurrentTime(ct);

    // Accumulate watched time
    const delta = ct - lastTimeRef.current;
    if (delta > 0 && delta < 2) {
      watchedRef.current += delta;
    }
    lastTimeRef.current = ct;

    // Update highest second (monotonically increasing)
    if (ct > highestRef.current) {
      highestRef.current = ct;
    }
  }, []);

  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Strict linear viewing: completely disable fast forward and backward seeking
    const delta = video.currentTime - lastTimeRef.current;
    if (Math.abs(delta) > 2) {
      video.currentTime = lastTimeRef.current;
    }
  }, []);

  const handlePlay  = useCallback(() => { setIsPlaying(true);  startHeartbeat(); }, [startHeartbeat]);
  const handlePause = useCallback(() => { setIsPlaying(false); stopHeartbeat(); fireHeartbeat(); }, [stopHeartbeat, fireHeartbeat]);
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    stopHeartbeat();
    fireHeartbeat();
  }, [stopHeartbeat, fireHeartbeat]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) setDuration(video.duration);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.addEventListener("timeupdate",    handleTimeUpdate);
    video.addEventListener("seeking",       handleSeeking);
    video.addEventListener("play",          handlePlay);
    video.addEventListener("pause",         handlePause);
    video.addEventListener("ended",         handleEnded);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate",    handleTimeUpdate);
      video.removeEventListener("seeking",       handleSeeking);
      video.removeEventListener("play",          handlePlay);
      video.removeEventListener("pause",         handlePause);
      video.removeEventListener("ended",         handleEnded);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      stopHeartbeat();
    };
  }, [handleTimeUpdate, handleSeeking, handlePlay, handlePause, handleEnded, handleLoadedMetadata, stopHeartbeat]);

  // ─── Control actions ────────────────────────────────────────────────────────
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Progress bar clicking is disabled to strictly enforce linear viewing
    e.preventDefault();
  };

  // Auto-hide controls
  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    if (isPlaying) {
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  // ─── Formatting ─────────────────────────────────────────────────────────────
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const pct95 = completionThreshold / (duration || videoDuration || 1);
  const progressPct = (currentTime / (duration || videoDuration || 1));
  const isCompleted  = highestRef.current >= completionThreshold;

  return (
    <div
      className={cn(
        "relative bg-black rounded-xl overflow-hidden group select-none",
        className
      )}
      onMouseMove={resetControlsTimer}
      onClick={togglePlay}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        preload="metadata"
        playsInline
      />

      {/* ── Completion badge ─────────────────────────────────────────── */}
      {isCompleted && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2
                        bg-green-500/90 text-white text-xs font-bold px-3 py-1.5
                        rounded-full backdrop-blur-sm shadow-lg">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
          Lesson Complete
        </div>
      )}

      {/* ── Controls overlay ─────────────────────────────────────────── */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col justify-end",
          "bg-gradient-to-t from-black/70 via-transparent to-transparent",
          "transition-opacity duration-300",
          showControls || !isPlaying ? "opacity-100" : "opacity-0"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div
            className="relative w-full h-1.5 bg-white/30 rounded-full cursor-pointer
                       hover:h-2.5 transition-all duration-150 group/bar"
            onClick={handleProgressClick}
          >
            {/* 95% completion marker */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-yellow-400 z-10"
              style={{ left: `${pct95 * 100}%` }}
              title="95% — assessment unlocks here"
            />
            {/* Watched progress */}
            <div
              className="h-full bg-white rounded-full transition-all duration-100"
              style={{ width: `${Math.min(progressPct * 100, 100)}%` }}
            />
            {/* Scrubber handle */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white
                         rounded-full shadow-md opacity-0 group-hover/bar:opacity-100
                         transition-opacity"
              style={{ left: `calc(${Math.min(progressPct * 100, 100)}% - 7px)` }}
            />
          </div>
        </div>

        {/* Bottom controls row */}
        <div className="flex items-center gap-3 px-4 pb-3" onClick={(e) => e.stopPropagation()}>
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="text-white hover:text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="text-white hover:text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isMuted ? "volume_off" : "volume_up"}
            </span>
          </button>

          {/* Time */}
          <span className="text-white/80 text-xs font-mono ml-1">
            {fmt(currentTime)} / {fmt(duration || videoDuration)}
          </span>

          {/* Spacer */}
          <div className="flex-1" />

          {/* 95% unlock hint */}
          {!isCompleted && (
            <span className="text-yellow-400/80 text-[11px] font-medium">
              Watch to {fmt(completionThreshold)} to unlock assessment
            </span>
          )}

          {/* Fullscreen */}
          <button
            onClick={() => videoRef.current?.requestFullscreen()}
            className="text-white hover:text-white/80 transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">fullscreen</span>
          </button>
        </div>
      </div>

      {/* Center play icon when paused */}
      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer pointer-events-none"
          onClick={togglePlay}
        >
          <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center
                          backdrop-blur-sm">
            <span className="material-symbols-outlined text-white text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
