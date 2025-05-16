"use client";
import { useState } from "react";

const Accordion = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-300 text-blue-500 last:border-none dark:border-gray-800">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 focus:outline-none"
      >
        <span className="text-sm font-medium sm:text-lg">{title}</span>

        {/* Consistent Down Arrow SVG */}
        <svg
          className={`h-6 w-6 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-transparent">
          <p className="text-sm text-gray-900 dark:text-white sm:text-base">
            {content}
          </p>
        </div>
      )}
    </div>
  );
};

export default Accordion;
