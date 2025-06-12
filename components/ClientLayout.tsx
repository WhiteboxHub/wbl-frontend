// components/ClientLayout.tsx
'use client';

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import {useState, useEffect } from "react";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isViewSection = pathname.startsWith("/view");
  
  const [holdLoad,setHoldLoad] = useState<Boolean>(false)

  useEffect(()=>{
    setTimeout(()=>{
      setHoldLoad(true)
    },300)
  },[])

  return (
    holdLoad ? <>
    {!isViewSection && <Header toggleSidebar={undefined} isOpen={undefined} />}
      {children}
      {!isViewSection && <Footer />}
      {!isViewSection && <ScrollToTop />}
   </> : <></>
  );
}
