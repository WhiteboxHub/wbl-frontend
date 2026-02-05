import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
    className?: string;
    size?: number;
    text?: string;
}

export function Loader({ className, size = 40, text = "Loading..." }: LoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center min-h-[400px] w-full", className)}>
            <Loader2 className="animate-spin text-primary" size={size} />
            <p className="mt-4 text-sm text-muted-foreground">{text}</p>
        </div>
    );
}
