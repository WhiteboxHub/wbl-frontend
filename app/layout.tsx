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

import "../styles/index.css";
import "react-modal-video/css/modal-video.css";
import ClientProviders from "@/components/ClientProviders";
import ClientLayout from "@/components/ClientLayout";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <title>Whitebox-Learning</title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta
          name="description"
          content="A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers."
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://whitebox-learning.com/" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body className="hydrated-hidden dark:bg-black">
        <ClientProviders>
          <ClientLayout>{children}</ClientLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
