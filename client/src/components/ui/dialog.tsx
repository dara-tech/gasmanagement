import * as React from "react"
import { cn } from "../../lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  fullScreen?: boolean
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, fullScreen }) => {
  React.useEffect(() => {
    if (open) {
      document.body.classList.add('dialog-open')
    } else {
      document.body.classList.remove('dialog-open')
    }
    
    // Cleanup on unmount
    return () => {
      document.body.classList.remove('dialog-open')
    }
  }, [open])

  if (!open) return null

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50">
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => onOpenChange?.(false)}
        />
        <div className="relative z-50 w-full h-full bg-background">
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50 w-full max-w-lg mx-4 bg-background rounded-lg shadow-lg p-4 md:p-6 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return <div className={cn("", className)}>{children}</div>
}

const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">{children}</div>
}

const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>
}

const DialogDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className
}) => {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4", className)}>{children}</div>
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
}

