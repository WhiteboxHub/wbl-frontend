// "use client";
// import { useState, useEffect } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import googleCalendarPlugin from "@fullcalendar/google-calendar";

// const Calendar = () => {
//   const [selectedEvent, setSelectedEvent] = useState(null);

//   // Google Calendar API configuration
//   const googleCalendarApiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
//   const googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

//   // Function to add custom classes to FullCalendar toolbar elements
//   const addCustomClasses = () => {
//     const toolbar = document.querySelector(".fc-header-toolbar");
//     if (toolbar) {
//       toolbar.classList.add("flex", "flex-col", "sm:flex-row");
//       const toolbarSections = toolbar.querySelectorAll(".fc-toolbar-chunk");
//       toolbarSections.forEach((section) => {
//         section.classList.add("mb-2", "sm:mb-0", "sm:mr-4");
//       });
//     }

//     const calendarTitle = document.querySelector(".fc-toolbar-title");
//     if (calendarTitle) {
//       calendarTitle.classList.add(
//         "text-sm",
//         "sm:text-base",
//         "md:text-md",
//         "lg:text-lg"
//       );
//     }

//     const calendarButtons = document.querySelectorAll(".fc-button");
//     calendarButtons.forEach((button) => {
//       button.classList.add(
//         "text-xs",
//         "sm:text-sm",
//         "lg:text-base",
//         "!capitalize"
//       );
//     });
//   };

//   useEffect(() => {
//     addCustomClasses();
//   }, []);

//   return (
//     // <div className="container mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
//     <div className="container mx-auto max-w-6xl">
//       <div className="rounded-lg border bg-white p-4 text-black shadow-md dark:border-gray-800 dark:bg-gray-500 sm:p-6 lg:p-8">
//         <div className="overflow-x-auto">
//           <div className="min-w-[600px]">
//             <FullCalendar
//               plugins={[dayGridPlugin, timeGridPlugin, googleCalendarPlugin]}
//               initialView="timeGridWeek"
//               initialDate={new Date().toISOString().split("T")[0]} // Start from today
//               headerToolbar={{
//                 left: "prev,next today",
//                 center: "title",
//                 right: "dayGridMonth,timeGridWeek,timeGridDay",
//               }}
//               googleCalendarApiKey={googleCalendarApiKey}
//               events={{
//                 googleCalendarId: googleCalendarId,
//                 color: "grey",
//                 borderColor: "black",
//                 textColor: "white",
//               }}
//               slotMinTime="09:00:00" // Start time at 8 AM
//               height="auto" // Adjust the height to make it responsive
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Calendar;

// old code
// "use client";
// import { useState, useEffect } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import googleCalendarPlugin from "@fullcalendar/google-calendar";

// const Calendar = () => {
//   const [selectedEvent, setSelectedEvent] = useState(null);

//   // Google Calendar API configuration
//   const googleCalendarApiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
//   const googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

//   // Function to add custom classes to FullCalendar toolbar elements
//   const addCustomClasses = () => {
//     const toolbar = document.querySelector(".fc-header-toolbar");
//     if (toolbar) {
//       toolbar.classList.add("flex", "flex-col", "sm:flex-row");
//       const toolbarSections = toolbar.querySelectorAll(".fc-toolbar-chunk");
//       toolbarSections.forEach((section) => {
//         section.classList.add("mb-2", "sm:mb-0", "sm:mr-4");
//       });
//     }

//     const calendarTitle = document.querySelector(".fc-toolbar-title");
//     if (calendarTitle) {
//       calendarTitle.classList.add(
//         "text-sm",
//         "sm:text-base",
//         "md:text-md",
//         "lg:text-lg"
//       );
//     }

//     const calendarButtons = document.querySelectorAll(".fc-button");
//     calendarButtons.forEach((button) => {
//       button.classList.add(
//         "text-xs",
//         "sm:text-sm",
//         "lg:text-base",
//         "!capitalize"
//       );
//     });
//   };

//   useEffect(() => {
//     addCustomClasses();
//   }, []);

//   return (
//     <div className="container mx-auto max-w-6xl">
//       <div className="rounded-lg border bg-white p-4 text-black shadow-md dark:border-gray-800 dark:bg-gray-500 sm:p-6 lg:p-8">
//         <div className="overflow-x-auto">
//           <div className="min-w-[600px]">
//             {/* Add a wrapper with fixed height and enable vertical scroll */}
//             <div className="max-h-[500px] overflow-y-auto">
//               <FullCalendar
//                 plugins={[dayGridPlugin, timeGridPlugin, googleCalendarPlugin]}
//                 initialView="timeGridWeek"
//                 initialDate={new Date().toISOString().split("T")[0]} // Start from today
//                 headerToolbar={{
//                   left: "prev next today",
//                   center: "title",
//                   right: "dayGridMonth,timeGridWeek,timeGridDay",
//                 }}
//                 googleCalendarApiKey={googleCalendarApiKey}
//                 events={{
//                   googleCalendarId: googleCalendarId,
//                   color: "grey",
//                   borderColor: "black",
//                   textColor: "white",
//                 }}
//                 slotMinTime="09:00:00" // Start time at 9 AM
//                 slotMaxTime="33:00:00" // 33 hours (9 AM next day)
//                 scrollTime="09:00:00" // Scroll to 9 AM on load
//                 height="auto" // Adjust the height to make it responsive
//                 eventClick={(info) => {
//                   info.jsEvent.preventDefault(); // Prevent default click behavior
//                   if (info.event.url) {
//                     window.open(info.event.url, "_blank"); // Open the event URL in a new tab
//                   }
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Calendar;




// ////////////odssdssd

// "use client";
// import { useState } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import googleCalendarPlugin from "@fullcalendar/google-calendar";

// const Calendar = () => {
//   const [selectedEvent, setSelectedEvent] = useState(null);

//   const googleCalendarApiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
//   const googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

//   const closeTooltip = () => setSelectedEvent(null);

//   return (
//     <div className="relative container mx-auto max-w-6xl">
//       {/* Calendar Container */}
//       <div className="rounded-lg border bg-white p-4 shadow-md dark:border-gray-800 dark:bg-gray-500 sm:p-6 lg:p-8">
//         <div className="overflow-x-auto">
//           <div className="min-w-[600px]">
//             <div className="max-h-[500px] overflow-y-auto">
//               <FullCalendar
//                 plugins={[dayGridPlugin, timeGridPlugin, googleCalendarPlugin]}
//                 initialView="timeGridWeek"
//                 initialDate={new Date().toISOString().split("T")[0]}
//                 headerToolbar={{
//                   left: "prev,next today",
//                   center: "title",
//                   right: "dayGridMonth,timeGridWeek,timeGridDay",
//                 }}
//                 googleCalendarApiKey={googleCalendarApiKey}
//                 events={{
//                   googleCalendarId: googleCalendarId,
//                 }}
//                 slotMinTime="09:00:00"
//                 slotMaxTime="33:00:00"
//                 scrollTime="09:00:00"
//                 height="auto"
//                 eventClick={(info) => {
//                   info.jsEvent.preventDefault();
//                   setSelectedEvent({
//                     title: info.event.title,
//                     start: info.event.startStr,
//                     end: info.event.endStr,
//                     url: info.event.url || "/",
//                   });
//                 }}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tooltip */}
//       {selectedEvent && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
//           <div className="relative w-[350px] rounded-lg bg-white p-6 shadow-2xl">
//             {/* Close Button */}
//             <button
//               onClick={closeTooltip}
//               className="absolute top-2 right-2 text-gray-600 hover:text-red-600 focus:outline-none"
//               aria-label="Close Tooltip"
//             >
//               ✖
//             </button>

//             {/* Event Details */}
//             <h3 className="text-lg font-bold text-gray-900 mb-4">
//               {selectedEvent.title}
//             </h3>
//             <div className="text-sm text-gray-700 mb-4">
//               <p>
//                 <strong>Start:</strong>{" "}
//                 {new Date(selectedEvent.start).toLocaleString()}
//               </p>
//               <p>
//                 <strong>End:</strong>{" "}
//                 {new Date(selectedEvent.end).toLocaleString()}
//               </p>
//             </div>

//             {/* "Go to Calendar" Button */}
//             <a
//               href={selectedEvent.url}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//             >
//               Go to Calendar
//             </a>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// kkk
// // export default Calendar;
// "use client";
// import { useState } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import googleCalendarPlugin from "@fullcalendar/google-calendar";

// const Calendar = () => {
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

//   const googleCalendarApiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
//   const googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

//   const closeTooltip = () => setSelectedEvent(null);

//   const handleEventClick = (info) => {
//     info.jsEvent.preventDefault();
//     const rect = info.jsEvent.target.getBoundingClientRect();
//     setTooltipPosition({
//       top: rect.top + window.scrollY,
//       left: rect.left + window.scrollX,
//     });
//     setSelectedEvent({
//       title: info.event.title,
//       start: info.event.startStr,
//       end: info.event.endStr,
//       url: info.event.url || "/",
//     });
//   };

//   return (
//     <div className="relative container mx-auto max-w-6xl">
//       {/* Calendar Container */}
//       <div className="rounded-lg border bg-white p-4 shadow-md dark:border-gray-800 dark:bg-gray-500 sm:p-6 lg:p-8">
//         <div className="overflow-x-auto">
//           <div className="min-w-[600px]">
//             <div className="max-h-[500px] overflow-y-auto">
//               <FullCalendar
//                 plugins={[dayGridPlugin, timeGridPlugin, googleCalendarPlugin]}
//                 initialView="timeGridWeek"
//                 initialDate={new Date().toISOString().split("T")[0]}
//                 headerToolbar={{
//                   left: "prev,next today",
//                   center: "title",
//                   right: "dayGridMonth,timeGridWeek,timeGridDay",
//                 }}
//                 googleCalendarApiKey={googleCalendarApiKey}
//                 events={{
//                   googleCalendarId: googleCalendarId,
//                 }}
//                 slotMinTime="09:00:00"
//                 slotMaxTime="33:00:00"
//                 scrollTime="09:00:00"
//                 height="auto"
//                 eventClick={handleEventClick}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Tooltip */}
//       {selectedEvent && (
//         <div
//           className="fixed z-50 bg-black/50"
//           style={{ top: 0, left: 0, right: 0, bottom: 0 }}
//         >
//           <div
//             className="absolute w-[250px] rounded-lg bg-white p-4 shadow-lg transform transition-transform duration-300 ease-in-out"
//             style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
//           >
//             {/* Close Button */}
//             <button
//               onClick={closeTooltip}
//               className="absolute top-2 right-2 text-gray-600 hover:text-red-600 focus:outline-none"
//               aria-label="Close Tooltip"
//             >
//               ✖
//             </button>

//             {/* Event Details */}
//             <h3 className="text-sm font-bold text-gray-900 mb-2">
//               {selectedEvent.title}
//             </h3>
//             <div className="text-xs text-gray-700 mb-2">
//               <p>
//                 <strong>Start:</strong>{" "}
//                 {new Date(selectedEvent.start).toLocaleString()}
//               </p>
//               <p>
//                 <strong>End:</strong>{" "}
//                 {new Date(selectedEvent.end).toLocaleString()}
//               </p>
//             </div>

//             {/* "Go to Calendar" Button */}
//             <a
//               href={selectedEvent.url}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="block w-full rounded-lg bg-blue-600 px-3 py-1.5 text-center text-white text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
//             >
//               Go to Calendar
//             </a>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Calendar;


// "use client";
// import { useState, useEffect, useMemo, useCallback } from "react";
// import { createPortal } from "react-dom";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import timeGridPlugin from "@fullcalendar/timegrid";
// import googleCalendarPlugin from "@fullcalendar/google-calendar";

// const Calendar = () => {
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [cachedEvents, setCachedEvents] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Google Calendar API configuration
//   const googleCalendarApiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
//   const googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

//   // Function to add custom classes to FullCalendar toolbar elements
//   const addCustomClasses = () => {
//     const toolbar = document.querySelector(".fc-header-toolbar");
//     if (toolbar) {
//       toolbar.classList.add("flex", "flex-col", "sm:flex-row");
//       const toolbarSections = toolbar.querySelectorAll(".fc-toolbar-chunk");
//       toolbarSections.forEach((section) => {
//         section.classList.add("mb-2", "sm:mb-0", "sm:mr-4");
//       });
//     }

//     const calendarTitle = document.querySelector(".fc-toolbar-title");
//     if (calendarTitle) {
//       calendarTitle.classList.add(
//         "text-sm",
//         "sm:text-base",
//         "md:text-md",
//         "lg:text-lg"
//       );
//     }

//     const calendarButtons = document.querySelectorAll(".fc-button");
//     calendarButtons.forEach((button) => {
//       button.classList.add(
//         "text-xs",
//         "sm:text-sm",
//         "lg:text-base",
//         "!capitalize"
//       );
//     });
//   };

//   useEffect(() => {
//     addCustomClasses();
//   }, []);

//   const memoizedEvents = useMemo(() => {
//     return {
//       googleCalendarId: googleCalendarId,
//       color: "grey",
//       borderColor: "black",
//       textColor: "white",
//     };
//   }, [googleCalendarId]);

//   const handleEventClick = useCallback((info) => {
//     info.jsEvent.preventDefault(); // Prevent default click behavior
//     setSelectedEvent(info.event);
//   }, []);

//   const handleClosePopup = useCallback(() => {
//     setSelectedEvent(null);
//   }, []);

//   return (
//     <div className="container mx-auto max-w-6xl">
//       <div className="rounded-lg border bg-white p-4 text-black shadow-md dark:border-gray-800 dark:bg-gray-500 sm:p-6 lg:p-8">
//         <div className="overflow-x-auto">
//           <div className="min-w-[600px]">
//             {/* Add a wrapper with fixed height and enable vertical scroll */}
//             <div className="max-h-[500px] overflow-y-auto">
//               <FullCalendar
//                 plugins={[dayGridPlugin, timeGridPlugin, googleCalendarPlugin]}
//                 initialView="timeGridWeek"
//                 initialDate={new Date().toISOString().split("T")[0]} // Start from today
//                 headerToolbar={{
//                   left: "prev next today",
//                   center: "title",
//                   right: "dayGridMonth,timeGridWeek,timeGridDay",
//                 }}
//                 googleCalendarApiKey={googleCalendarApiKey}
//                 events={memoizedEvents}
//                 slotMinTime="09:00:00" // Start time at 9 AM
//                 slotMaxTime="33:00:00" // 33 hours (9 AM next day)
//                 scrollTime="09:00:00" // Scroll to 9 AM on load
//                 height="auto" // Adjust the height to make it responsive
//                 eventClick={handleEventClick}
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//       {selectedEvent && createPortal(
//         <EventPopup event={selectedEvent} onClose={handleClosePopup} />,
//         document.body
//       )}
//     </div>
//   );
// };

// const EventPopup = ({ event, onClose }) => {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full relative">
//         <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800">
//           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
//           </svg>
//         </button>
//         <h2 className="text-lg font-bold mb-2">{event.title}</h2>
//         <p className="text-gray-700 mb-4">{event.start.toLocaleString()}</p>
//         <button
//           onClick={() => window.open(event.url, "_blank")}
//           className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
//         >
//           Open Calendar
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Calendar;


"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import googleCalendarPlugin from "@fullcalendar/google-calendar";

const Calendar = () => {
  const [hoveredEvent, setHoveredEvent] = useState(null);
  const [eventPosition, setEventPosition] = useState({ top: 0, left: 0 });
  const timeoutRef = useRef(null);
  const popupRef = useRef(null);
  const [isPopupHovered, setIsPopupHovered] = useState(false);

  // Google Calendar API configuration
  const googleCalendarApiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
  const googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

  const memoizedEvents = useMemo(() => {
    return {
      googleCalendarId: googleCalendarId,
      color: "grey",
      borderColor: "black",
      textColor: "white",
    };
  }, [googleCalendarId]);

  const handleEventMouseEnter = useCallback((info) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    const eventEl = info.el;
    if (eventEl) {
      const rect = eventEl.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate the position of the popup
      let top = rect.top + window.scrollY + 20;
      let left = rect.left + window.scrollX + 20;

      // Adjust position if the popup goes out of the viewport
      if (left + 200 > viewportWidth) {
        left = viewportWidth - 220;
      }
      if (top + 100 > viewportHeight) {
        top = viewportHeight - 120;
      }

      setEventPosition({ top, left });
      setHoveredEvent(info.event);
    }
  }, []);

  const handleEventMouseLeave = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (!isPopupHovered) {
        setHoveredEvent(null);
      }
    }, 100); // Add a slight delay to prevent flickering
  }, [isPopupHovered]);

  const handlePopupMouseEnter = useCallback(() => {
    setIsPopupHovered(true);
  }, []);

  const handlePopupMouseLeave = useCallback(() => {
    setIsPopupHovered(false);
    handleEventMouseLeave();
  }, [handleEventMouseLeave]);

  const handlePopupClick = useCallback((event) => {
    if (event.url) {
      window.open(event.url, "_blank");
    }
  }, []);

  // Prevent the default event click behavior
  const handleEventClick = useCallback((info) => {
    info.jsEvent.preventDefault();
  }, []);

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="rounded-lg border bg-white shadow-md dark:border-gray-800 dark:bg-gray-500">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="max-h-[500px] overflow-y-auto">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, googleCalendarPlugin]}
                initialView="timeGridWeek"
                initialDate={new Date().toISOString().split("T")[0]}
                headerToolbar={{
                  left: "prev next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                googleCalendarApiKey={googleCalendarApiKey}
                events={memoizedEvents}
                slotMinTime="09:00:00"
                slotMaxTime="33:00:00"
                scrollTime="09:00:00"
                height="auto"
                eventMouseEnter={handleEventMouseEnter}
                eventMouseLeave={handleEventMouseLeave}
                eventClick={handleEventClick} // Prevent default event click behavior
              />
            </div>
          </div>
        </div>
      </div>
      {hoveredEvent && createPortal(
        <EventPopup
          event={hoveredEvent}
          position={eventPosition}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
          onClick={handlePopupClick}
          popupRef={popupRef}
        />,
        document.body
      )}
    </div>
  );
};

const EventPopup = ({ event, position, onMouseEnter, onMouseLeave, onClick, popupRef }) => {
  return (
    <div
      ref={popupRef}
      className="absolute bg-white p-3 rounded-lg shadow-lg max-w-xs w-full z-50 transition-transform transform cursor-pointer"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => onClick(event)}
    >
      <h2 className="text-md font-bold mb-1 text-gray-800">{event.title}</h2>
      <p className="text-sm text-gray-700">{event.start.toLocaleString()}</p>
    </div>
  );
};

export default Calendar;
