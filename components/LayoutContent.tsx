// // components/LayoutContent.tsx
// "use client";

// import { usePathname } from "next/navigation";
// import Footer from "@/components/Footer";
// import Header from "@/components/Header";
// import Sidebar from "@/components/Sidebar";
// import ScrollToTop from "@/components/ScrollToTop";
// import { SessionProvider } from "next-auth/react";
// import { Providers } from "@/app/providers";
// import { AuthProvider } from "@/utils/AuthContext";

// export default function LayoutContent({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname();
//   const isViewSection = pathname.startsWith("/view");

//   return (
//     <SessionProvider>
//       <AuthProvider>
//         <Providers>
//           {!isViewSection && <Header />}
//           <Sidebar />
//           <main className="w-full">{children}</main>
//           {!isViewSection && <Footer />}
//           {!isViewSection && <ScrollToTop />}
//         </Providers>
//       </AuthProvider>
//     </SessionProvider>
//   );
// }



// -------*************---------


"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { SessionProvider } from "next-auth/react";
import { Providers } from "@/app/providers";
import { AuthProvider } from "@/utils/AuthContext";

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const isViewSection = pathname.startsWith("/view");

  if (!isHydrated) return null; // Delay render until client-side

  return (
    <SessionProvider>
      <AuthProvider>
        <Providers>
          {!isViewSection && <Header toggleSidebar={undefined} isOpen={undefined} />}
          <Sidebar isOpen={undefined} toggleSidebar={undefined} />
          <main className="w-full">{children}</main>
          {!isViewSection && <Footer />}
          {!isViewSection && <ScrollToTop />}
        </Providers>
      </AuthProvider>
    </SessionProvider>
  );
}
