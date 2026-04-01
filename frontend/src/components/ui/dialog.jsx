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
      "fixed inset-0 z-50 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    style={{ background: "var(--modal-overlay)" }}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      data-radix-dialog-content=""
      className={cn(
        /* Positioning */
        "fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        /* Size — mobile full-width, desktop constrained */
        "w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] max-w-lg",
        /* On mobile, anchor to bottom instead */
        "max-h-[92dvh] sm:max-h-[88dvh]",
        /* Layout */
        "flex flex-col",
        /* Styling */
        "rounded-2xl sm:rounded-[calc(var(--radius)+0.55rem)]",
        "border shadow-2xl ring-1",
        /* Animations */
        "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        className
      )}
      style={{
        background: "var(--modal-bg)",
        borderColor: "var(--modal-border)",
        boxShadow: "0 36px 90px -36px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
        backdropFilter: "blur(28px) saturate(140%)",
      }}
      {...props}
    >
      <div className="flex flex-col max-h-[90dvh] sm:max-h-[86dvh] overflow-hidden">
        {children}
      </div>
      <DialogPrimitive.Close
        className={cn(
          "absolute right-3.5 top-3.5 z-10",
          "flex h-7 w-7 items-center justify-center rounded-full",
          "border opacity-70 ring-offset-background transition-all",
          "hover:opacity-100 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:pointer-events-none"
        )}
        style={{
          background: "var(--modal-bg)",
          borderColor: "var(--modal-border)",
        }}
      >
        <X className="h-3.5 w-3.5" />
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
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      "px-5 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-4",
      "flex-shrink-0",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogBody = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex-1 min-h-0 overflow-y-auto",
      "px-5 py-4 sm:px-6",
      /* Custom scrollbar on mobile */
      "scrollbar-thin",
      className
    )}
    {...props}
  />
)
DialogBody.displayName = "DialogBody"

const DialogFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      "px-5 pt-4 pb-5 sm:px-6 sm:py-4",
      "flex-shrink-0",
      "border-t",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-foreground", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
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
