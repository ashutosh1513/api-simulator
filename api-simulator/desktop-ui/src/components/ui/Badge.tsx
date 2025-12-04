import * as React from "react";
import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = "default", ...props }, ref) => {
        const variants = {
            default: "bg-secondary text-text",
            GET: "bg-green-900/30 text-green-400 border border-green-900",
            POST: "bg-orange-900/30 text-orange-400 border border-orange-900",
            PUT: "bg-blue-900/30 text-blue-400 border border-blue-900",
            DELETE: "bg-red-900/30 text-red-400 border border-red-900",
            PATCH: "bg-purple-900/30 text-purple-400 border border-purple-900",
        };

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    variants[variant],
                    className
                )}
                {...props}
            />
        );
    }
);
Badge.displayName = "Badge";

export { Badge };
