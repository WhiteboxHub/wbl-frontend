// // frntend\app\layout.tsx
// "use client";
// import "node_modules/react-modal-video/css/modal-video.css";
// import "../styles/index.css";
// import Footer from "@/components/Footer";
// import Header from "@/components/Header";
// import ScrollToTop from "@/components/ScrollToTop";
// import { SessionProvider } from "next-auth/react";
// import { usePathname } from "next/navigation";
// import { Providers } from "./providers";
// import { AuthProvider } from "@/utils/AuthContext";

// import { useAuth } from "@/utils/AuthContext";


// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   const pathname = usePathname(); // Get the current pathname

//   // Check if the current route is part of the "/view" folder
//   const isViewSection = pathname.startsWith('/view');

//   return (
//     <html suppressHydrationWarning lang="en">
//       <head>
//         <title>Whitebox-Learning</title>
//         <meta content="width=device-width, initial-scale=1" name="viewport" />
//         <meta
//           name="description"
//           content="A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers."
//         />
//         <link rel="icon" href="/favicon.ico" />
//         <link rel="canonical" href="https://whitebox-learning.com/" />
//       </head>
//       <body className="dark:bg-black">
//       <SessionProvider>
//         <AuthProvider>
//           <Providers>
//             {!isViewSection && <Header />} {/* Conditionally render Header */}

//             <Sidebar />
//             <main className="w-full">
//               {children}
//             </main>

//             {children}

//             {!isViewSection && <Footer />} {/* Conditionally render Footer */}
//             {!isViewSection && <ScrollToTop />} {/* Conditionally render ScrollToTop */}
//           </Providers>
//         </AuthProvider>
//         </SessionProvider>
//       </body>
//     </html>
//   );
// }





// // app/layout.tsx
// import "../styles/index.css";
// import "react-modal-video/css/modal-video.css";
// import ClientProviders from "@/components/ClientProviders";
// import ClientLayout from "@/components/ClientLayout";

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html suppressHydrationWarning lang="en">
//       <head>
//         <title>Whitebox-Learning</title>
//         <meta content="width=device-width, initial-scale=1" name="viewport" />
//         <meta
//           name="description"
//           content="A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers."
//         />
//         <link rel="icon" href="/favicon.ico" />
//         <link rel="canonical" href="https://whitebox-learning.com/" />
//       </head>
//       <body className="dark:bg-black">
//         <ClientProviders>
//           <ClientLayout>{children}</ClientLayout>
//         </ClientProviders>
//       </body>
//     </html>
//   );
// }



// ------------------*********************--


// app/layout.tsx
import "@/styles/index.css";
import "react-modal-video/css/modal-video.css";
import ClientProviders from "@/components/ClientProviders";
import ClientLayout from "@/components/ClientLayout";
import { ReactNode } from "react";

export const metadata = {
  title: "Whitebox-Learning",
  description:
    "A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.theme;
                  if (
                    theme === 'dark' ||
                    (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)
                  ) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://whitebox-learning.com/" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
        <ClientProviders>
          <ClientLayout>{children}</ClientLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
