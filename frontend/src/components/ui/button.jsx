import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius)+0.1rem)] border border-transparent text-sm font-semibold tracking-[-0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary via-blue-500 to-blue-700 text-primary-foreground shadow-[0_22px_44px_-26px_rgba(0,129,253,0.62)] hover:-translate-y-0.5 hover:brightness-105",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_18px_38px_-24px_rgba(239,68,68,0.65)] hover:-translate-y-0.5 hover:bg-destructive/92",
        outline:
          "border-border/70 bg-background/55 text-foreground shadow-[0_18px_30px_-28px_rgba(15,23,42,0.45)] backdrop-blur-md hover:-translate-y-0.5 hover:border-primary/35 hover:bg-secondary/55",
        secondary:
          "bg-secondary/85 text-secondary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:-translate-y-0.5 hover:bg-secondary",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-secondary/55 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-[calc(var(--radius)-0.05rem)] px-3.5 text-xs",
        lg: "h-12 rounded-[calc(var(--radius)+0.2rem)] px-7 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
