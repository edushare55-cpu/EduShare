import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 animate-in fade-in duration-500">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-10 md:p-16 max-w-2xl w-full text-center shadow-lg relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-primary-container text-on-primary-container rounded-3xl flex items-center justify-center mb-8 shadow-inner transform -rotate-6">
            <FileQuestion className="w-12 h-12" />
          </div>
          
          <h1 className="text-8xl font-black text-primary tracking-tighter mb-4 opacity-90">404</h1>
          <h2 className="text-3xl font-bold text-on-surface mb-4">Page Not Found</h2>
          
          <p className="text-on-surface-variant text-lg max-w-md mx-auto mb-10 leading-relaxed">
            We couldn't find the page you're looking for. It might have been moved, deleted, or perhaps the URL is incorrect.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link 
              href="/"
              className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
