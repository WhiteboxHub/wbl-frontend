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

"use client";
import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import googleCalendarPlugin from "@fullcalendar/google-calendar";

const Calendar = () => {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const googleCalendarApiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY;
  const googleCalendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

  const closeTooltip = () => setSelectedEvent(null);

  return (
    <div className="relative container mx-auto max-w-6xl">
      {/* Calendar Container */}
      <div className="rounded-lg border bg-white p-4 shadow-md dark:border-gray-800 dark:bg-gray-500 sm:p-6 lg:p-8">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="max-h-[500px] overflow-y-auto">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, googleCalendarPlugin]}
                initialView="timeGridWeek"
                initialDate={new Date().toISOString().split("T")[0]}
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                googleCalendarApiKey={googleCalendarApiKey}
                events={{
                  googleCalendarId: googleCalendarId,
                }}
                slotMinTime="09:00:00"
                slotMaxTime="33:00:00"
                scrollTime="09:00:00"
                height="auto"
                eventClick={(info) => {
                  info.jsEvent.preventDefault();
                  setSelectedEvent({
                    title: info.event.title,
                    start: info.event.startStr,
                    end: info.event.endStr,
                    url: info.event.url || "/",
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-[350px] rounded-lg bg-white p-6 shadow-2xl">
            {/* Close Button */}
            <button
              onClick={closeTooltip}
              className="absolute top-2 right-2 text-gray-600 hover:text-red-600 focus:outline-none"
              aria-label="Close Tooltip"
            >
              ✖
            </button>

            {/* Event Details */}
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedEvent.title}
            </h3>
            <div className="text-sm text-gray-700 mb-4">
              <p>
                <strong>Start:</strong>{" "}
                {new Date(selectedEvent.start).toLocaleString()}
              </p>
              <p>
                <strong>End:</strong>{" "}
                {new Date(selectedEvent.end).toLocaleString()}
              </p>
            </div>

            {/* "Go to Calendar" Button */}
            <a
              href={selectedEvent.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Go to Calendar
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
