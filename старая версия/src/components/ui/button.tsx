import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "btn inline-flex items-center justify-center gap-2 font-bold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        primary: "btn-primary hover:shadow-lg hover:-translate-y-2",
        default: "btn-primary hover:shadow-lg hover:-translate-y-2", // alias for primary
        secondary: "btn-secondary hover:shadow-lg hover:-translate-y-2", 
        ghost: "btn-ghost hover:shadow-md hover:-translate-y-1",
        outline: "btn-secondary hover:shadow-lg hover:-translate-y-2", // alias for secondary
        destructive: "bg-red-500 text-white border border-red-600 hover:bg-red-600 shadow-md hover:shadow-lg hover:-translate-y-2", 
        warm: "bg-accent-warm text-black font-bold border border-accent-warm-hover hover:bg-accent-warm-hover hover:shadow-warm hover:-translate-y-2", 
        cool: "bg-accent-cool text-white border border-accent-cool-hover hover:bg-accent-cool-hover hover:shadow-cool hover:-translate-y-2", 
        soft: "bg-background-soft text-foreground border border-border hover:bg-background-muted hover:shadow-md hover:-translate-y-2", 
        link: "text-primary hover:text-primary-hover underline hover:no-underline", 
        natural: "bg-gradient-primary text-black font-bold hover:shadow-primary hover:-translate-y-2", 
      },
      size: {
        sm: "btn-sm",
        md: "btn-md",
        lg: "btn-lg",
        icon: "btn-sm w-8 h-8 p-0 rounded-lg", // square icon button
        responsive: "btn-md w-full", // full width responsive
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? "Загрузка..." : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }