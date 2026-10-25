export default function LoginLoading() {
  return (
    <main className="w-full max-w-md animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest/80 backdrop-blur-2xl rounded-[2rem] 
                      shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-white/40 p-8 sm:p-12">
        {/* Logo area */}
        <div className="text-center mb-10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-surface-container-high 
                          animate-pulse mx-auto" />
          <div className="h-8 w-48 bg-surface-container-high 
                          animate-pulse rounded mx-auto" />
          <div className="h-4 w-56 bg-surface-container-high 
                          animate-pulse rounded mx-auto" />
        </div>
        {/* Form fields */}
        <div className="space-y-6">
          {[1,2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-surface-container-high 
                              animate-pulse rounded" />
              <div className="h-12 w-full bg-surface-container-high 
                              animate-pulse rounded-lg" />
            </div>
          ))}
          {/* Button */}
          <div className="h-14 w-full bg-surface-container-high 
                          animate-pulse rounded-xl mt-8" />
        </div>
      </div>
    </main>
  )
}
