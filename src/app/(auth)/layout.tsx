import React from "react";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex bg-surface">
      {/* Left Panel - Visual/Brand (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-secondary-container/20 flex-col justify-center p-16">
        {/* Abstract Orbs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/20 blur-[100px] rounded-full pointer-events-none mix-blend-multiply"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[30rem] h-[30rem] bg-secondary/15 blur-[120px] rounded-full pointer-events-none mix-blend-multiply"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-tertiary/20 blur-[80px] rounded-full pointer-events-none mix-blend-multiply"></div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/pclu-logo.png"
              alt="Polytechnic College of La Union seal"
              width={58}
              height={62}
              className="h-16 w-auto object-contain drop-shadow-sm"
              priority
            />
            <h1 className="text-4xl font-black text-on-surface tracking-tight">EduShare</h1>
          </div>
          
          <h2 className="text-5xl font-black leading-tight text-on-surface mb-6">
            Empowering the <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Next Generation
            </span>
          </h2>
          
          <p className="text-xl text-on-surface-variant leading-relaxed">
            A unified academic portal for the Polytechnic College of La Union. Seamlessly manage classes, submissions, and resources in one platform.
          </p>
        </div>
      </div>

      {/* Right Panel - Authentication Forms */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Subtle mobile background blur */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-primary/5 via-surface to-secondary/5"></div>
        
        <main className="w-full max-w-md relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
