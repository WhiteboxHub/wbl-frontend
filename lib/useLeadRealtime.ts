// // "use client";

// // import { useEffect, useRef } from "react";
// // import { appDB } from "./dexieDB";

// // // ✅ Real-time WebSocket endpoint
// // const WS_URL = "ws://localhost:8000/api/ws/leads";

// // interface WSMessage {
// //   type: "lead_added" | "lead_updated" | "lead_deleted";
// //   data: any;
// // }

// // export function useLeadRealtime() {
// //   const wsRef = useRef<WebSocket | null>(null);

// //   const connect = () => {
// //     const ws = new WebSocket(WS_URL);
// //     wsRef.current = ws;

// //     ws.onopen = () => {
// //       console.log("✅ WebSocket connected (real-time leads)");
// //     };

// //     ws.onmessage = async (event) => {
// //       try {
// //         const msg: WSMessage = JSON.parse(event.data);

// //         if (msg.type === "lead_added") {
// //           await appDB?.leads.put({
// //             ...msg.data,
// //             synced: true,
// //             lastSync: new Date().toISOString(),
// //             lastModified: msg.data.lastModified || new Date().toISOString(),
// //             _action: null,
// //           });
// //         }

// //         if (msg.type === "lead_updated") {
// //           await appDB?.leads.put({
// //             ...msg.data,
// //             synced: true,
// //             lastSync: new Date().toISOString(),
// //             lastModified: msg.data.lastModified || new Date().toISOString(),
// //             _action: null,
// //           });
// //         }

// //         if (msg.type === "lead_deleted") {
// //           if (msg.data.id) {
// //             await appDB?.leads.delete(msg.data.id);
// //           }
// //         }
// //       } catch (err) {
// //         console.error("❌ WS parse failed:", err);
// //       }
// //     };

// //     ws.onclose = () => {
// //       console.warn("⚠ WS closed. Reconnecting in 2 seconds...");
// //       setTimeout(connect, 2000);
// //     };

// //     ws.onerror = () => {
// //       console.error("❌ WebSocket error");
// //       ws.close();
// //     };
// //   };

// //   useEffect(() => {
// //     connect();
// //     return () => wsRef.current?.close();
// //   }, []);
// // }









// "use client";

// import { useEffect, useRef } from "react";
// import { appDB } from "./dexieDB";

// // ✅ Real-time WebSocket endpoint
// const WS_URL = "ws://localhost:8000/api/ws/leads";

// interface WSMessage {
//   action: "add" | "update" | "delete";
//   table: string;
//   data?: any;
//   id?: number;
// }

// export function useLeadRealtime() {
//   const wsRef = useRef<WebSocket | null>(null);
//   const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

//   const connect = () => {
//     try {
//       const ws = new WebSocket(WS_URL);
//       wsRef.current = ws;

//       ws.onopen = () => {
//         console.log("✅ WebSocket connected (real-time leads)");
//         // Clear any pending reconnection attempts
//         if (reconnectTimeoutRef.current) {
//           clearTimeout(reconnectTimeoutRef.current);
//         }
//       };

//       ws.onmessage = async (event) => {
//         try {
//           const msg: WSMessage = JSON.parse(event.data);
          
//           // Only process leads table messages
//           if (msg.table !== "leads") return;

//           const now = new Date().toISOString();

//           switch (msg.action) {
//             case "add":
//               if (msg.data) {
//                 await appDB?.leads.put({
//                   ...msg.data,
//                   synced: true,
//                   lastSync: now,
//                   lastModified: msg.data.lastModified || msg.data.entry_date || now,
//                   _action: null,
//                   version: (msg.data.version || 0) + 1,
//                 });
//                 console.log("✅ Real-time: Lead added", msg.data.id);
//               }
//               break;

//             case "update":
//               if (msg.data && msg.data.id) {
//                 await appDB?.leads.put({
//                   ...msg.data,
//                   synced: true,
//                   lastSync: now,
//                   lastModified: msg.data.lastModified || msg.data.entry_date || now,
//                   _action: null,
//                   version: (msg.data.version || 0) + 1,
//                 });
//                 console.log("✅ Real-time: Lead updated", msg.data.id);
//               }
//               break;

//             case "delete":
//               if (msg.id) {
//                 await appDB?.leads.delete(msg.id);
//                 console.log("✅ Real-time: Lead deleted", msg.id);
//               }
//               break;

//             default:
//               console.warn("❌ Unknown WebSocket action:", msg.action);
//           }
//         } catch (err) {
//           console.error("❌ WS message processing failed:", err);
//         }
//       };

//       ws.onclose = (event) => {
//         console.warn(`⚠ WebSocket closed (code: ${event.code}). Reconnecting in 2 seconds...`);
        
//         // Clean up
//         if (reconnectTimeoutRef.current) {
//           clearTimeout(reconnectTimeoutRef.current);
//         }
        
//         // Reconnect after delay (with exponential backoff in production)
//         reconnectTimeoutRef.current = setTimeout(connect, 2000);
//       };

//       ws.onerror = (error) => {
//         console.error("❌ WebSocket error:", error);
//         ws.close(); // Trigger onclose for reconnection
//       };

//     } catch (error) {
//       console.error("❌ WebSocket connection failed:", error);
//       // Retry connection after delay
//       reconnectTimeoutRef.current = setTimeout(connect, 2000);
//     }
//   };

//   useEffect(() => {
//     connect();
    
//     return () => {
//       // Cleanup on unmount
//       if (reconnectTimeoutRef.current) {
//         clearTimeout(reconnectTimeoutRef.current);
//       }
//       if (wsRef.current) {
//         wsRef.current.close();
//       }
//     };
//   }, []);

//   // Optional: Export manual reconnect function
//   const reconnect = () => {
//     if (wsRef.current) {
//       wsRef.current.close();
//     } else {
//       connect();
//     }
//   };

//   return { reconnect };
// }