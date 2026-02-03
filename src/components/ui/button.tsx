import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Loader } from "@/components/ui/loader"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-brand-gradient border border-primary/50 shadow-[0_4px_16px_rgba(77,255,195,0.2)] !text-black font-bold hover:shadow-[0_4px_20px_rgba(77,255,195,0.35)] active:scale-[0.98] transition-all duration-300 [&_*]:!text-black",
        gradient:
          "backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-primary/50 text-foreground hover:bg-primary/20 hover:border-primary/80 transition-all duration-300",
        'brand-gradient':
          "backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-primary/50 text-foreground hover:bg-primary/20 hover:border-primary/80 transition-all duration-300",
        special:
          "backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/30 shadow-lg hover:shadow-primary/20 hover:bg-white/20 transition-all duration-300 text-foreground",
        glass:
          "backdrop-blur-xl bg-white/10 dark:bg-black/10 border border-white/20 dark:border-white/10 shadow-sm hover:bg-white/20 dark:hover:bg-white/5 text-foreground transition-all duration-300",
        destructive:
          "backdrop-blur-xl bg-destructive/10 border border-destructive/30 text-destructive shadow-sm hover:bg-destructive/20 hover:border-destructive/50 transition-all duration-300",
        outline:
          "backdrop-blur-xl bg-transparent border border-white/20 dark:border-white/10 hover:bg-white/10 dark:hover:bg-white/5 text-foreground transition-all duration-300",
        secondary:
          "backdrop-blur-xl bg-secondary/30 dark:bg-secondary/10 border border-white/10 text-secondary-foreground hover:bg-secondary/40 transition-all duration-300",
        ghost:
          "hover:bg-white/10 dark:hover:bg-white/10 hover:text-foreground transition-colors",
        link:
          "text-primary underline-offset-4 hover:underline",
        modern:
          "backdrop-blur-2xl bg-white/5 border border-white/10 text-foreground hover:bg-white/10 hover:border-white/20 shadow-lg transition-all duration-300"
      },
      size: {
        default: "h-11 px-5 py-2.5 rounded-full",
        sm: "h-9 rounded-full px-4 text-xs",
        lg: "h-13 rounded-full px-8 text-base",
        xl: "h-14 rounded-full px-10 text-lg",
        responsive: "h-11 px-5 w-full text-sm sm:w-auto sm:h-12 sm:px-6",
        icon: "h-11 w-11 rounded-full",
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