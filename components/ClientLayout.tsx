// // components/ClientLayout.tsx
// 'use client';

// import { usePathname } from "next/navigation";
// import Header from "@/components/Header";
// import Footer from "@/components/Footer";
// import ScrollToTop from "@/components/ScrollToTop";
// import Sidebar from "@/components/Sidebar";
// import {useState, useEffect } from "react";

// export default function ClientLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   const isViewSection = pathname.startsWith("/view");
  
//   const [holdLoad,setHoldLoad] = useState<Boolean>(false)

//   useEffect(()=>{
//     setTimeout(()=>{
//       setHoldLoad(true)
//     },500)
//   },[])

//   return (
//     holdLoad ? <>
//     {!isViewSection && <Header />}
//       {children}
//       {!isViewSection && <Footer />}
//       {!isViewSection && <ScrollToTop />}
//    </> : <></>
//   );
// }


'use client';

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import Sidebar from "@/components/Sidebar";
import { useState, useEffect, useMemo, useCallback } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isViewSection = pathname.startsWith("/view");

  const [holdLoad, setHoldLoad] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  
  useEffect(() => {
    const timer = setTimeout(() => setHoldLoad(true), 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  return holdLoad ? (
    <>
      {!isViewSection && <Header />}
      {!isViewSection && (
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      )}
      {/* <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} /> */}
      <main className="w-full">{children}</main>
      {!isViewSection && <Footer />}
      {!isViewSection && <ScrollToTop />}
    </>
  ) : null;
}