import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-cta-dark text-white shadow-md hover:shadow-lg",
        primary:
          "bg-primary text-primary-foreground shadow-md hover:brightness-105",
        secondary:
          "glass text-foreground border border-black/5 shadow-sm hover:bg-white",
        outline:
          "border border-black/10 bg-transparent text-foreground hover:bg-white/60",
        ghost:
          "bg-transparent text-foreground hover:bg-white/60",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:brightness-105",
        link:
          "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-12 px-5 text-[15px]",
        sm: "h-10 px-4 text-sm",
        lg: "h-[52px] px-6 text-[15px]",
        xl: "h-14 px-7 text-base",
        icon: "h-10 w-10",
        iconLg: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
