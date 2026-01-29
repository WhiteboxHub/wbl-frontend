import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { apiFetch } from "@/lib/api";
import "react-quill/dist/quill.snow.css";

// ✅ FIX 1: Dynamic import with proper ref forwarding
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill");
    // Create a wrapper component that properly forwards the ref
    const QuillWrapper = ({ forwardedRef, ...props }: any) => (
      <RQ ref={forwardedRef} {...props} />
    );
    QuillWrapper.displayName = "ReactQuill";
    return QuillWrapper;
  },
  { ssr: false }
);

interface QuillWithMentionsProps {
  value: string;
  onChange: (content: string) => void;
  className?: string;
  theme?: string;
  placeholder?: string;
}

export const QuillWithMentions: React.FC<QuillWithMentionsProps> = ({
  value,
  onChange,
  className,
  theme = "snow",
  placeholder,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const quillRef = useRef<any>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ FIX 2: Store cursor position before blur happens
  const lastCursorPosition = useRef<number | null>(null);

  const checkForMention = (
    content: string,
    delta: any,
    source: string,
    editor: any
  ) => {
    if (source !== "user") return;

    const selection = editor.getSelection();
    if (!selection) return;

    const cursorIndex = selection.index;
    
    // ✅ Store cursor position
    lastCursorPosition.current = cursorIndex;
    
    const textBeforeCursor = editor.getText(0, cursorIndex);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtSymbolIndex !== -1) {
      const charBeforeAt =
        lastAtSymbolIndex > 0 ? textBeforeCursor[lastAtSymbolIndex - 1] : " ";
      const distanceFromAt = cursorIndex - lastAtSymbolIndex;

      if (
        (charBeforeAt === " " || charBeforeAt === "\n" || lastAtSymbolIndex === 0) &&
        distanceFromAt <= 30
      ) {
        const query = textBeforeCursor.slice(lastAtSymbolIndex + 1, cursorIndex);

        if (!query.includes("\n")) {
          setSearchTerm(query);
          setShowSuggestions(true);
          return;
        }
      }
    }

    setSearchTerm("");
    setShowSuggestions(false);
  };

  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!searchTerm || searchTerm.length < 2) {
      setSuggestions([]);
      if (searchTerm.length === 0) {
        setShowSuggestions(false);
      }
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
    try {
        const [candidatesData, employeesData] = await Promise.all([
        apiFetch(`/candidates/search-names/${encodeURIComponent(searchTerm)}`),
        apiFetch(`/employees/search?query=${encodeURIComponent(searchTerm)}`)
        ]);

        // Parse results from both
        const candidates = Array.isArray(candidatesData) 
        ? candidatesData 
        : candidatesData.data || [];
        
        const employees = Array.isArray(employeesData) 
        ? employeesData 
        : employeesData.data || [];

        // Add a type to distinguish them (optional)
        const candidatesWithType = candidates.map((c: any) => ({ ...c, type: "candidate" }));
        const employeesWithType = employees.map((e: any) => ({ ...e, type: "employee" }));

        // Combine both arrays
        const combined = [...candidatesWithType, ...employeesWithType];

        if (combined.length > 0) {
        setSuggestions(combined);
        setShowSuggestions(true);
        } else {
        setSuggestions([]);
        setShowSuggestions(false);
        }
    } catch (error) {
        console.error("Failed to fetch suggestions:", error);
    }
    }, 300);

    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchTerm]);

  // ✅ FIX 3: Improved insertMention function
  const insertMention = (candidate: any) => {
    console.log("insertMention called with:", candidate); // Debug log
    
    const editor = quillRef.current?.getEditor?.();
    
    if (!editor) {
      console.error("Editor not found!");
      return;
    }

    // Close suggestions immediately to prevent double-clicks
    setShowSuggestions(false);
    setSearchTerm("");

    // Use requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      try {
        // Focus the editor first
        editor.focus();

        // Get cursor position - use stored position as fallback
        let cursorIndex = lastCursorPosition.current;
        
        const selection = editor.getSelection(true);
        if (selection) {
          cursorIndex = selection.index;
        }

        if (cursorIndex === null) {
          cursorIndex = editor.getLength() - 1;
        }

        const textBeforeCursor = editor.getText(0, cursorIndex);
        const lastAtSymbolIndex = textBeforeCursor.lastIndexOf("@");

        console.log("Cursor index:", cursorIndex, "Last @ index:", lastAtSymbolIndex); // Debug

        if (lastAtSymbolIndex !== -1) {
          const deleteLength = cursorIndex - lastAtSymbolIndex;
          
          // Delete the @ and search text
          editor.deleteText(lastAtSymbolIndex, deleteLength);

          // Insert the mention with formatting
          editor.insertText(
            lastAtSymbolIndex,
            `@${candidate.name}`,
            {
              bold: true,
              color: "#000000",
            }
          );

          // Calculate new cursor position
          const newCursorPos = lastAtSymbolIndex + candidate.name.length + 1;

          // Insert a space after to break formatting
          editor.insertText(
            newCursorPos,
            " ",
            {
              bold: false,
              color: null,
            }
          );

          // Move cursor after the space
          editor.setSelection(newCursorPos + 1, 0);
          
          console.log("Mention inserted successfully!"); // Debug
        }
      } catch (error) {
        console.error("Error inserting mention:", error);
      }
    });
  };

  const ReactQuillComponent = ReactQuill as any;

  return (
    <div className="relative">
      <ReactQuillComponent
        forwardedRef={quillRef}  
        theme={theme}
        value={value}
        onChange={(content: string, delta: any, source: string, editor: any) => {
          onChange(content);
          checkForMention(content, delta, source, editor);
        }}
        className={className}
        placeholder={placeholder}
      />

      {/* ✅ FIX 4: Render backdrop BEFORE suggestions so z-index works correctly */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            console.log("Backdrop clicked"); // Debug
            setShowSuggestions(false);
          }}
        />
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 bottom-full mb-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
          <div className="p-2 text-xs text-gray-400 border-b dark:border-gray-700">
            Suggestions
          </div>
          {suggestions.map((s) => (
            <button
              key={`${s.type}-${s.id}`} 
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("MouseDown on:", s.name); // Debug
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Click on:", s.name); // Debug
                insertMention(s);
              }}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 text-sm transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer"
            >
              <div className="font-medium text-gray-900 dark:text-gray-100">
                {s.name}
              </div>
              <div className="text-xs text-gray-500 truncate">{s.email}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};