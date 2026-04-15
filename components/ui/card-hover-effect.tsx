"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export const HoverEffect = ({
  items,
  className,
  onHoverChange,
}: {
  items: {
    title: string;
    description: string;
    key: string;
  }[];
  className?: string;
  onHoverChange?: (item: any) => void;
}) => {
  let [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      className={cn(
        "flex flex-col py-2 px-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl w-52",
        className
      )}
    >
      {items.map((item, idx) => (
        <div
          key={item.key}
          className="relative group block p-1 h-full w-full"
          onMouseEnter={() => {
            setHoveredIndex(idx);
            onHoverChange?.(item);
          }}
          onMouseLeave={() => {
            setHoveredIndex(null);
            onHoverChange?.(null);
          }}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-purple-500/10 dark:bg-purple-500/20 block rounded-xl shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.1 },
                }}
              />
            )}
          </AnimatePresence>
          <div className="relative z-20 px-6 py-2 cursor-pointer text-center">
            <h4 className="text-gray-900 dark:text-gray-100 text-sm font-bold tracking-tight whitespace-nowrap">
              {item.title}
            </h4>
          </div>
        </div>
      ))}
    </div>
  );
};
