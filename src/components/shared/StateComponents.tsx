interface ErrorStateProps {
  message:  string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center 
                    py-xl text-center gap-md">
      <div className="w-16 h-16 rounded-full bg-error-container 
                      flex items-center justify-center">
        <span className="material-symbols-outlined text-error text-[32px]">
          error_outline
        </span>
      </div>
      <div>
        <p className="font-headline-md text-on-surface mb-xs">
          Something went wrong
        </p>
        <p className="font-body-sm text-on-surface-variant max-w-sm">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-md py-sm rounded-lg
                     border border-primary text-primary font-label-md
                     hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            refresh
          </span>
          Try again
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon:        string
  title:       string
  description: string
  action?:     { label: string; onClick: () => void }
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center 
                    py-xl text-center gap-md">
      <div className="w-16 h-16 rounded-full bg-surface-container-high 
                      flex items-center justify-center">
        <span className="material-symbols-outlined text-on-surface-variant 
                         text-[32px]">
          {icon}
        </span>
      </div>
      <div>
        <p className="font-headline-md text-on-surface mb-xs">{title}</p>
        <p className="font-body-sm text-on-surface-variant max-w-sm">
          {description}
        </p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-md py-sm rounded-lg
                     bg-secondary text-on-secondary font-label-md
                     hover:opacity-90 transition-opacity shadow-level-1"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
