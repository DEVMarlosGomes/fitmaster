import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-950/72 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props} />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-lg border border-border/70 bg-card/88 shadow-[0_36px_90px_-46px_rgba(15,23,42,0.8)] ring-1 ring-white/[0.05] backdrop-blur-2xl sm:rounded-[calc(var(--radius)+0.55rem)]",
        "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        "max-h-[88vh]",
        "flex flex-col",
        "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}>
      <div className="flex flex-col max-h-[85vh] overflow-hidden">
        {children}
      </div>
      <DialogPrimitive.Close
        className="absolute right-4 top-4 z-10 rounded-full border border-border/70 bg-background/65 p-1.5 opacity-80 ring-offset-background transition-all hover:opacity-100 hover:border-primary/35 hover:bg-background/85 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-5 pb-4 sm:p-6 sm:pb-4 flex-shrink-0", className)}
    {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogBody = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex-1 min-h-0 overflow-y-auto px-5 py-4 sm:px-6", className)}
    {...props} />
)
DialogBody.displayName = "DialogBody"

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-0 p-5 pt-4 sm:p-6 sm:pt-4 flex-shrink-0 border-t border-border/70", className)}
    {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props} />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
