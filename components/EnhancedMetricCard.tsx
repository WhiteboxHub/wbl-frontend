import { ReactNode } from "react";
import { Card, CardContent } from "@/components/admin_ui/card";
import { cn } from "@/lib/utils";

interface EnhancedMetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: "default" | "purple" | "blue" | "green" | "orange" | "red" | "teal" | "pink" | "emerald" | "indigo" | "fuchsia" | "cyan" | "amber";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const variantStyles = {
  default: {
    bg: "bg-white",
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    border: "border-gray-200"
  },
  purple: {
    bg: "bg-white",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    border: "border-purple-200"
  },
  blue: {
    bg: "bg-white",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    border: "border-blue-200"
  },
  green: {
    bg: "bg-white",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    border: "border-green-200"
  },
  orange: {
    bg: "bg-white",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    border: "border-orange-200"
  },
  red: {
    bg: "bg-white",
    iconBg: "bg-rose-200 shadow-md shadow-rose-400/40",
    iconColor: "text-rose-700",
    border: "border-rose-300"
  },
  teal: {
    bg: "bg-white",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    border: "border-teal-200"
  },
  pink: {
    bg: "bg-white",
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    border: "border-pink-200"
  },
  emerald: {
    bg: "bg-white",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    border: "border-emerald-200"
  },
  indigo: {
    bg: "bg-white",
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    border: "border-indigo-200"
  },
  fuchsia: {
    bg: "bg-white",
    iconBg: "bg-fuchsia-100",
    iconColor: "text-fuchsia-600",
    border: "border-fuchsia-200"
  },
  cyan: {
    bg: "bg-white",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
    border: "border-cyan-200"
  },
  amber: {
    bg: "bg-white",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    border: "border-amber-200"
  },
};

export function EnhancedMetricCard({
  title,
  value,
  icon,
  variant = "default",
  trend,
  className
}: EnhancedMetricCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={cn(
      styles.bg,
      styles.border,
      "transition-all duration-200 hover:shadow-md hover:scale-105",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-600 mb-2">{title}</div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {trend && (
              <div className={cn(
                "flex items-center text-xs mt-2 font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {Math.abs(trend.value)}% from last period
              </div>
            )}
          </div>
          {icon && (
            <div className={cn(
              "p-2 rounded-lg",
              styles.iconBg
            )}>
              <div className={cn("h-5 w-5", styles.iconColor)}>
                {icon}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}