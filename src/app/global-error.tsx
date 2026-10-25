"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-surface p-4 animate-in fade-in duration-500">
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-10 md:p-16 max-w-2xl w-full text-center shadow-lg relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-error/5 blur-3xl rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-error-container text-on-error-container rounded-3xl flex items-center justify-center mb-8 shadow-inner animate-pulse">
                <AlertOctagon className="w-12 h-12" />
              </div>
              
              <h1 className="text-4xl font-black text-on-surface tracking-tight mb-4">Something went wrong!</h1>
              
              <p className="text-on-surface-variant text-lg max-w-md mx-auto mb-10 leading-relaxed">
                An unexpected error has occurred. We've been notified and are looking into the issue.
              </p>

              {process.env.NODE_ENV !== "production" && (
                <div className="bg-error-container/20 text-on-error-container p-4 rounded-xl text-sm font-mono text-left w-full mb-8 overflow-auto max-h-48">
                  {error.message || "Unknown error"}
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <button 
                  onClick={() => reset()}
                  className="px-6 py-3 rounded-xl bg-error text-on-error font-bold hover:bg-error/90 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Try Again
                </button>
                <Link 
                  href="/"
                  className="px-6 py-3 rounded-xl border-2 border-outline-variant text-on-surface-variant font-bold hover:bg-surface-container hover:text-on-surface transition-colors flex items-center justify-center gap-2"
                >
                  <Home className="w-5 h-5" />
                  Return Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
