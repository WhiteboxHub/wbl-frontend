"use client";
import "node_modules/react-modal-video/css/modal-video.css";
import "../styles/index.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ScrollToTop from "@/components/ScrollToTop";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Providers } from "./providers";
import { AuthProvider } from "@/utils/AuthContext";
import { useState } from "react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
// import { AGGridTable } from "@/components/AGGridTable";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAvatarSection = pathname.startsWith("/avatar");
  const [isOpen, setIsOpen] = useState(false);

  const rowData = [{ id: 1, name: "Test User" }];
  const columnDefs = [
    { headerName: "ID", field: "id" },
    { headerName: "Name", field: "name" },
  ];

  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <title>Whitebox-Learning</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta
          name="description"
          content="A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://whitebox-learning.com/" />
      </head>
      <body className="dark:bg-black">
        <SessionProvider>
          <AuthProvider>
            <Providers>
              {isAvatarSection ? (
                // For /avatar pages, render ONLY the children.
                // The AvatarLayout will handle its own UI.
                <>{children}</>
              ) : (
                // For all other pages, render the main site layout.
                <>
                  <Header />
                  <Sidebar
                    isOpen={isOpen}
                    toggleSidebar={() => setIsOpen(!isOpen)}
                  />
                  <main className="w-full">{children}</main>
                  <Footer />
                  <ScrollToTop />
                </>
              )}
            </Providers>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}


