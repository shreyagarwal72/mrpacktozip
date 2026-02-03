import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const expressiveButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0 active:scale-[0.96] hover:scale-[1.02]",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-expressive-primary to-expressive-glow text-white shadow-expressive hover:shadow-expressive-lg",
        secondary: "bg-expressive-surface text-expressive-foreground border border-expressive-border hover:bg-expressive-surface-hover",
        outline: "border-2 border-expressive-primary text-expressive-primary bg-transparent hover:bg-expressive-primary/10",
        ghost: "text-expressive-foreground hover:bg-expressive-surface",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg",
      },
      size: {
        default: "h-12 px-6 py-3 text-base rounded-full",
        sm: "h-10 px-4 py-2 text-sm rounded-full",
        lg: "h-14 px-8 py-4 text-lg rounded-full",
        icon: "h-12 w-12 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ExpressiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof expressiveButtonVariants> {
  asChild?: boolean
}

const ExpressiveButton = React.forwardRef<HTMLButtonElement, ExpressiveButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(expressiveButtonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        {...props}
      />
    )
  },
)
ExpressiveButton.displayName = "ExpressiveButton"

export { ExpressiveButton, expressiveButtonVariants }
