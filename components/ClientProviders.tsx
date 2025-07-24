// // components/ClientProviders.tsx
// 'use client';

// import { SessionProvider } from "next-auth/react";
// import { AuthProvider } from "@/utils/AuthContext";
// import { Providers } from "@/app/providers";

// export default function ClientProviders({ children }: { children: React.ReactNode }) {
//   return (
//     <SessionProvider>
//       <AuthProvider>
//         <Providers>{children}</Providers>
//       </AuthProvider>
//     </SessionProvider>
//   );

// }

// -------------

"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/utils/AuthContext";
import { Providers } from "@/app/providers";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("hydrated");
    document.body.classList.remove("hydrated-hidden");
  }, []);

  return (
    <SessionProvider>
      <AuthProvider>
        <Providers>{children}</Providers>
        
      </AuthProvider>
    </SessionProvider>
  );
}


// "use client";

// import { useEffect } from "react";
// import { SessionProvider } from "next-auth/react";
// import { AuthProvider } from "@/utils/AuthContext";
// import { Providers } from "@/app/providers";
// import { Toaster } from "react-hot-toast";
// import SessionStatusWatcher from "@/components/SessionStatusWatcher";

// export default function ClientProviders({ children }: { children: React.ReactNode }) {
//   useEffect(() => {
//     document.documentElement.classList.add("hydrated");
//     document.body.classList.remove("hydrated-hidden");
//   }, []);

//   return (
//     <SessionProvider>
//       <AuthProvider>
//         <Providers>
//           <Toaster position="bottom-center" />
//           <SessionStatusWatcher />
//           {children}
//         </Providers>
//       </AuthProvider>
//     </SessionProvider>
//   );
// }
