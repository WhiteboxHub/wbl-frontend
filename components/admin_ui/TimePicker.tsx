import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // HH:MM:SS
  onChange: (value: string) => void;
  label?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Parse the current time value
  const timeVal = value || "00:00:00";
  const parts = timeVal.split(":");
  const h24 = parseInt(parts[0] || "00");
  const minStr = parts[1] || "00";
  const min = parseInt(minStr);
  
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 || 12;

  const updateTime = (newH12: number, newMin: number, newAMPM: string) => {
    let h = newH12;
    if (newAMPM === "PM" && h < 12) h += 12;
    if (newAMPM === "AM" && h === 12) h = 0;
    const finalTime = `${h.toString().padStart(2, "0")}:${newMin.toString().padStart(2, "0")}:00`;
    onChange(finalTime);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const displayTime = `${h12.toString().padStart(2, "0")}:${minStr} ${ampm}`;

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 sm:text-sm mb-1">
          {label}
        </label>
      )}
      
      <div 
        onClick={() => setIsOpen(true)}
        className="relative w-full flex items-center rounded-lg border border-blue-200 bg-white dark:bg-darklight dark:text-gray-200 px-3 py-1.5 text-xs shadow-sm cursor-pointer hover:border-blue-400 transition-colors sm:text-sm"
      >
        <Clock className="w-3.5 h-3.5 text-blue-500 mr-2" />
        <span className="flex-grow font-semibold tracking-tight">{displayTime}</span>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[998]" onClick={() => setIsOpen(false)} />
          
          <div 
            className="absolute left-0 mt-1 z-[999] w-[260px] bg-white dark:bg-darklight border border-blue-100 rounded-2xl shadow-2xl overflow-hidden p-3 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-stretch bg-blue-50/30 dark:bg-gray-900/50 rounded-xl p-2 h-[220px]">
              
              {/* HOURS COLUMN - Stronger Header */}
              <div className="flex flex-col items-center w-14 h-full">
                <div className="flex-shrink-0 text-[11px] uppercase font-black text-blue-700 mb-2 border-b-2 border-blue-100 w-full text-center pb-1">Hr</div>
                <div className="flex-grow overflow-y-auto w-full space-y-0.5 py-1 scroll-smooth no-scrollbar">
                  {hours.map(h => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateTime(h, min, ampm)}
                      className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs transition-all ${
                        h12 === h 
                          ? "bg-blue-600 text-white font-bold shadow-md" 
                          : "text-gray-500 hover:bg-blue-50"
                      }`}
                    >
                      {h.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* MINUTES COLUMN - Stronger Header */}
              <div className="flex flex-col items-center w-14 h-full border-l border-r border-blue-50">
                <div className="flex-shrink-0 text-[11px] uppercase font-black text-blue-700 mb-2 border-b-2 border-blue-100 w-full text-center pb-1">Min</div>
                <div className="flex-grow overflow-y-auto w-full space-y-0.5 py-1 scroll-smooth no-scrollbar">
                  {minutes.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => updateTime(h12, m, ampm)}
                      className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs transition-all ${
                        min === m 
                          ? "bg-blue-600 text-white font-bold shadow-md" 
                          : "text-gray-500 hover:bg-blue-50"
                      }`}
                    >
                      {m.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* AM/PM COLUMN - Stronger Header */}
              <div className="flex flex-col items-center w-14 h-full">
                <div className="flex-shrink-0 text-[11px] uppercase font-black text-blue-700 mb-2 border-b-2 border-blue-100 w-full text-center pb-1">AM/PM</div>
                <div className="flex flex-col justify-center h-full space-y-3 pb-4">
                  {["AM", "PM"].map(a => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => updateTime(h12, min, a)}
                      className={`w-10 h-10 flex items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                        ampm === a 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "text-gray-400 hover:bg-blue-50"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-2.5">
               <button 
                 type="button" 
                 onClick={() => setIsOpen(false)}
                 className="w-full py-2 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm active:scale-95 uppercase tracking-wider"
               >
                 DONE
               </button>
            </div>
          </div>
        </>
      )}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
