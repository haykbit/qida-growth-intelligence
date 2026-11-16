import { Slot } from "@radix-ui/react-slot";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { AlertCircle, X } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TableHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/92",
        secondary: "border border-border bg-card text-card-foreground shadow-sm hover:bg-secondary",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground",
        danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: { sm: "h-8 px-3", md: "h-10 px-4", icon: "size-9" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
});
Button.displayName = "Button";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(16,24,40,0.025)]", className)} {...props} />
));
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col gap-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

export const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-base font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm leading-5 text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

const badgeVariants = cva("inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-xs font-medium leading-none", {
  variants: {
    tone: {
      neutral: "border-slate-200 bg-slate-50 text-slate-600",
      info: "border-sky-200 bg-sky-50 text-sky-700",
      success: "border-emerald-200 bg-emerald-50 text-emerald-700",
      warning: "border-amber-200 bg-amber-50 text-amber-700",
      danger: "border-rose-200 bg-rose-50 text-rose-700",
      violet: "border-violet-200 bg-violet-50 text-violet-700",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn("h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15", className)} {...props} />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn("h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15", className)} {...props} />
));
Select.displayName = "Select";

export const Separator = forwardRef<React.ElementRef<typeof SeparatorPrimitive.Root>, React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>>(({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
  <SeparatorPrimitive.Root ref={ref} decorative={decorative} orientation={orientation} className={cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)} {...props} />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;
export const TooltipContent = forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 8, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-w-xs rounded-md bg-foreground px-3 py-2 text-xs leading-5 text-background shadow-lg",
        "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=delayed-open]:fade-in-0",
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export function Progress({ value, className, indicatorClassName }: { value: number; className?: string; indicatorClassName?: string }) {
  const bounded = Math.max(0, Math.min(100, value));
  return <div aria-label={`${Math.round(bounded)} %`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={bounded} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)} role="progressbar"><div className={cn("h-full rounded-full bg-accent transition-transform", indicatorClassName)} style={{ transform: `translateX(-${100 - bounded}%)` }} /></div>;
}

export const Alert = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn("relative grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-lg border border-border bg-card p-4 text-sm", className)} {...props}><AlertCircle className="mt-0.5 size-4" />{children}</div>
));
Alert.displayName = "Alert";
export const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h5 ref={ref} className={cn("font-semibold leading-none", className)} {...props} />);
AlertTitle.displayName = "AlertTitle";
export const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("col-start-2 text-sm leading-5 text-muted-foreground", className)} {...props} />);
AlertDescription.displayName = "AlertDescription";

export const Tabs = TabsPrimitive.Root;
export const TabsList = forwardRef<React.ElementRef<typeof TabsPrimitive.List>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>>(({ className, ...props }, ref) => <TabsPrimitive.List ref={ref} className={cn("inline-flex h-10 items-center rounded-md bg-secondary p-1 text-muted-foreground", className)} {...props} />);
TabsList.displayName = TabsPrimitive.List.displayName;
export const TabsTrigger = forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>>(({ className, ...props }, ref) => <TabsPrimitive.Trigger ref={ref} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm", className)} {...props} />);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
export const TabsContent = forwardRef<React.ElementRef<typeof TabsPrimitive.Content>, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(({ className, ...props }, ref) => <TabsPrimitive.Content ref={ref} className={cn("mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} {...props} />);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export const Table = forwardRef<HTMLTableElement, TableHTMLAttributes<HTMLTableElement>>(({ className, ...props }, ref) => <div className="relative w-full overflow-auto"><table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} /></div>);
Table.displayName = "Table";
export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />);
TableHeader.displayName = "TableHeader";
export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(({ className, ...props }, ref) => <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />);
TableBody.displayName = "TableBody";
export const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(({ className, ...props }, ref) => <tr ref={ref} className={cn("border-b transition-colors hover:bg-muted/50", className)} {...props} />);
TableRow.displayName = "TableRow";
export const TableHead = forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => <th ref={ref} className={cn("h-11 px-4 text-left align-middle text-xs font-semibold text-muted-foreground", className)} {...props} />);
TableHead.displayName = "TableHead";
export const TableCell = forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(({ className, ...props }, ref) => <td ref={ref} className={cn("p-4 align-middle", className)} {...props} />);
TableCell.displayName = "TableCell";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-slate-200", className)} />;
}

export function Dialog({ open, title, description, onClose, children }: { open: boolean; title: string; description?: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div><h2 id="dialog-title" className="font-semibold text-slate-950">{title}</h2>{description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}</div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar"><X className="size-4" /></Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
