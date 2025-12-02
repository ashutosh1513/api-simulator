import * as React from "react";
import { cn } from "../../lib/utils";

// Note: We need to install class-variance-authority for this to work elegantly, 
// but for now I will implement a simpler version to avoid extra dependencies if not strictly needed, 
// or I can just install it. The prompt didn't explicitly ask to avoid it, but to keep it simple 
// I will use standard props and cn.
// Actually, for a professional look, cva is great. Let's stick to simple cn for now to reduce dependency bloat 
// unless I really need it. I'll use a manual variant mapping.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
    size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const variants = {
            primary: "bg-primary text-white hover:bg-primary/90 shadow-sm",
            secondary: "bg-secondary text-white hover:bg-secondary/80",
            ghost: "hover:bg-white/10 text-text",
            danger: "bg-red-600 text-white hover:bg-red-700",
            outline: "border border-border bg-transparent hover:bg-white/5 text-text",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2",
            lg: "h-12 px-8",
            icon: "h-9 w-9 p-0 flex items-center justify-center",
        };

        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button };
