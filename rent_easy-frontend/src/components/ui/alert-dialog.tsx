import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slot } from "@radix-ui/react-slot"
// This is a minimal implementation of AlertDialog to avoid compilation errors.
// The user should run `npx shadcn@latest add alert-dialog` to replace this with the real Radix-based component.

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <div className="fixed inset-0 z-40" onClick={() => onOpenChange?.(false)} />
      <div className="z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full left-[50%] top-[50%]">
        {children}
      </div>
    </div>
  );
}

export function AlertDialogContent({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2", className)}>{children}</div>
}

export function AlertDialogHeader({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-2 text-center sm:text-left", className)}>{children}</div>
}

export function AlertDialogFooter({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>{children}</div>
}

export function AlertDialogTitle({ children, className }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>
}


export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  asChild?: boolean;
}

export function AlertDialogDescription({ children, className, asChild }: AlertDialogDescriptionProps) {
  const Comp = asChild ? Slot : "p"
  return <Comp className={cn("text-sm text-muted-foreground", className)}>{children}</Comp>
}

export function AlertDialogAction({ children, onClick, className }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button onClick={onClick} className={className}>{children}</Button>
}

export function AlertDialogCancel({ children, onClick, className }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button variant="outline" onClick={onClick} className={className}>{children}</Button>
}
