import * as React from "react"
import { cn } from "../../lib/utils"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: "start" | "end" | "center"
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

const DropdownMenuContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

const DropdownMenu: React.FC<DropdownMenuProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              open,
              setOpen,
            })
          }
          return child
        })}
      </div>
    </DropdownMenuContext.Provider>
  )
}

const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps & { open?: boolean; setOpen?: (open: boolean) => void }> = ({
  children,
  className,
  open,
  setOpen,
}) => {
  return (
    <div
      onClick={() => setOpen?.(!open)}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </div>
  )
}

const DropdownMenuContent: React.FC<DropdownMenuContentProps & { open?: boolean; setOpen?: (open: boolean) => void }> = ({
  children,
  className,
  align = "end",
  open,
  setOpen,
}) => {
  if (!open) return null

  const alignClass = {
    start: "left-0",
    end: "right-0",
    center: "left-1/2 -translate-x-1/2",
  }[align]

  return (
    <div
      className={cn(
        "absolute min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md mt-1 z-50",
        alignClass,
        className
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onClose: () => setOpen?.(false),
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

const DropdownMenuItem: React.FC<DropdownMenuItemProps & { onClose?: () => void }> = ({
  children,
  onClick,
  className,
  disabled,
  onClose,
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick()
      onClose?.()
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground",
        !disabled && "hover:bg-accent hover:text-accent-foreground",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </div>
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
}

