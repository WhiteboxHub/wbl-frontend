"use client";

import { cn } from "@/lib/utils";
import React, { useEffect, useState } from "react";

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "slow",
  orientation = "horizontal",
  pauseOnHover = true,
  className,
}: {
  items: {
    name: string;
    date: string;
    client: string;
  }[];
  direction?: "left" | "right" | "up" | "down";
  speed?: "fast" | "normal" | "slow";
  orientation?: "horizontal" | "vertical";
  pauseOnHover?: boolean;
  className?: string;
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const scrollerRef = React.useRef<HTMLUListElement>(null);

  useEffect(() => {
    addAnimation();
  }, [items]);

  const [start, setStart] = useState(false);
  function addAnimation() {
    if (containerRef.current && scrollerRef.current) {
      const existingChildren = Array.from(scrollerRef.current.children);
      if (existingChildren.length > items.length) {
        for (let i = existingChildren.length - 1; i >= items.length; i--) {
          scrollerRef.current.removeChild(existingChildren[i]);
        }
      }

      const scrollerContent = Array.from(scrollerRef.current.children);

      scrollerContent.forEach((item) => {
        const duplicatedItem = item.cloneNode(true);
        if (scrollerRef.current) {
          scrollerRef.current.appendChild(duplicatedItem);
        }
      });

      getDirection();
      getSpeed();
      setStart(true);
    }
  }
  const getDirection = () => {
    if (containerRef.current) {
      if (direction === "left" || direction === "up") {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "normal"
        );
      } else {
        containerRef.current.style.setProperty(
          "--animation-direction",
          "reverse"
        );
      }
    }
  };
  const getSpeed = () => {
    if (containerRef.current) {
      let baseDuration = 40; // fast
      if (speed === "normal") baseDuration = 60;
      else if (speed === "slow") baseDuration = 100;

      const duration = (items.length * baseDuration) / 5; 
      containerRef.current.style.setProperty("--animation-duration", `${duration}s`);
    }
  };
  return (
    <div
      ref={containerRef}
      className={cn(
        "scroller relative z-20 px-4",
        orientation === "vertical" 
          ? "overflow-y-auto overflow-x-hidden max-h-full scrollbar-thin scrollbar-thumb-purple-500/40 scrollbar-track-transparent hover:scrollbar-thumb-purple-500/60 transition-colors" 
          : "overflow-hidden",
        className
      )}
    >
      <ul
        ref={scrollerRef}
        className={cn(
          "flex shrink-0 py-4 flex-nowrap",
          orientation === "horizontal" ? "w-max flex-row" : "h-max flex-col w-full",
          start && (orientation === "horizontal" ? "animate-scroll" : "animate-scroll-vertical hover:[animation-play-state:paused]"),
          pauseOnHover && orientation === "horizontal" && "hover:[animation-play-state:paused]"
        )}
      >
        {items.map((item, idx) => (
          <li
            className={cn(
                "px-3 py-2 rounded-lg bg-gray-900 dark:bg-[#f8f7ff] shadow-xl border border-gray-800 dark:border-purple-100 flex-shrink-0",
                orientation === "horizontal" ? "w-[240px] mx-3" : "w-full mb-3 last:mb-0"
            )}
            key={item.name + idx}
          >
            <div className="flex justify-between text-xs font-medium mb-1">
              <span className="truncate max-w-[120px] text-white dark:text-gray-900">
                {item.name}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {item.date}
              </span>
            </div>
            <div className="text-[11px] text-gray-300 dark:text-gray-600 truncate">
              {item.client}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
