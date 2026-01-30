import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Loader } from "@/components/ui/loader"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-brand-gradient text-black shadow-lg hover:shadow-xl hover:brightness-[1.35] hover:saturate-125 transition-all",
        gradient: "bg-brand-gradient text-black shadow-lg hover:shadow-xl hover:brightness-[1.35] hover:saturate-125 transition-all",
        // Убедимся, что текст на градиентных кнопках всегда черный
        'brand-gradient': "bg-brand-gradient text-black shadow-lg hover:shadow-xl hover:brightness-[1.35] hover:saturate-125 transition-all",
        special: "bg-gradient-to-r from-primary via-primary/80 to-primary/60 text-black shadow-xl hover:shadow-2xl hover:shadow-primary/30 hover:brightness-[1.35] hover:saturate-125 transform transition-all duration-300 border-2 border-white/20 hover:border-white/40 backdrop-blur-sm relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/10 before:via-transparent before:to-white/10 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
        glass: "backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/20 dark:border-gray-700/30 shadow-2xl hover:bg-white/95 dark:hover:bg-gray-900/95 hover:brightness-[1.2] transition-all",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80 hover:brightness-[1.3] transition-all",
        outline:
          "border-2 border-primary/20 bg-transparent backdrop-blur-xl hover:bg-primary/30 hover:border-primary/70 hover:brightness-[1.2] transition-all",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/70 hover:brightness-[1.25] transition-all",
        ghost: "hover:bg-accent/90 hover:text-accent-foreground hover:brightness-[1.2] rounded-2xl transition-colors",
        link: "text-primary underline-offset-4 hover:underline hover:brightness-[1.3] hover:text-primary/70 rounded-none transition-colors",
        modern: "bg-white/10 backdrop-blur-xl border border-white/20 text-foreground hover:bg-white/40 hover:border-white/50 hover:brightness-[1.25] transition-all"
      },
      size: {
        default: "h-10 px-4 py-2 sm:h-12 sm:px-6 sm:py-3",
        sm: "h-8 rounded-lg px-3 text-xs sm:h-10 sm:rounded-xl sm:px-4 sm:text-xs",
        lg: "h-12 rounded-xl px-6 text-sm sm:h-14 sm:rounded-2xl sm:px-8 sm:text-base",
        xl: "h-14 rounded-2xl px-8 text-base sm:h-16 sm:rounded-3xl sm:px-10 sm:text-lg",
        responsive: "h-10 px-4 w-full text-xs sm:w-auto sm:h-12 sm:px-6 sm:text-sm",
        icon: "h-10 w-10 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leadingIcon?: React.ReactNode
  trailingIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, leadingIcon, trailingIcon, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "pointer-events-none opacity-80"
        )}
        ref={ref}
        aria-busy={loading || undefined}
        aria-disabled={(props.disabled || loading) || undefined}
        disabled={!asChild ? (props.disabled || loading) : undefined}
        {...props}
      >
        <span className="inline-flex items-center justify-center gap-2">
          {loading ? (
            <Loader className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground" />
          ) : (
            leadingIcon
          )}
          <span className="truncate">{props.children}</span>
          {trailingIcon}
        </span>
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }