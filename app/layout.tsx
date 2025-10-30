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
import { useState, useEffect } from "react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import NewEvent from "@/components/NewEvent";
import ReferralNotificationButton from "@/components/ReferralNotificationButton";
import GoogleAnalytics from "@/components/GoogleAnalytics";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAvatarSection = pathname.startsWith("/avatar");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Poppins:wght@400;500;600;700&display=swap";
    document.head.appendChild(link);
  }, []);

  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <title>
          Whitebox-Learning - AIML Training and Placements in Bay area
        </title>
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <meta
          name="description"
          content="A comprehensive learning ecosystem tailored for developers, machine learning enthusiasts, and data engineers."
        />
        <meta
          name="keywords"
          content="ai/ml training and placement in bay area, ai/ml training and placement in pleasanton, ai/ml training and placement in fremont, ai/ml training in san jose, ca, ai/ml placement support in san francisco, ai/ml job support in bay area, ai/ml live training in oakland, ai/ml placement program in berkeley, ai/ml training near me in bay area, ai/ml corporate training in bay area, ai/ml placement assistance in california, ai/ml placement help in livermore, ai/ml classes in bay area, ca, ai/ml bootcamp in bay area, ai/ml for working professionals in bay area, ai/ml weekend training in bay area, indian ml placement firms, top indian ml placement consultancy, ml job assistance india for bay area, indian companies for ml jobs in us, ml staffing agencies india bay area, indian ai ml placement services, best indian consultancy for ai ml jobs, overseas ml placements from india, ml career support indian consultants, indian recruitment for ml roles us, ml talent acquisition india to usa, indian it consultancy ml placements, india-based ml job consultants, offshore ml placement services, ml employment agencies india, ai/ml advanced training in bay area, ai/ml training with placement in california, ai/ml online courses with certification in bay area, ai/ml job oriented training programs in bay area, ai/ml training for professionals in bay area, ai/ml training with real-world projects in bay area, ai/ml training and career counseling in bay area, ai/ml training for career switchers in bay area, ai/ml training with job guarantee in bay area, ai/ml training and mentorship in bay area, ai/ml training for corporate employees in bay area, ai/ml training with industry experts in bay area, high demand ai/ml training in bay area, popular ai/ml certification in bay area, top ai/ml courses with placement in bay area, best ai/ml training for job seekers in bay area, ai/ml training with high search volume in bay area, trending ai/ml courses in bay area, ai/ml training with most searches in bay area, highly searched ai/ml programs in bay area, gen ai training and placement in pleasanton, gen ai training in fremont, gen ai placement in bay area, gen ai job support in san jose, gen ai live training in san francisco, gen ai job prep in oakland, gen ai training near me in bay area, gen ai job placement in bay area, gen ai resume help in bay area, gen ai interview prep in bay area, gen ai certification courses in bay area, gen ai training for professionals in bay area, gen ai online training in bay area, gen ai training with placement assistance in bay area, gen ai bootcamp in bay area, gen ai training for beginners in bay area, gen ai advanced training in bay area, gen ai training with job support in bay area, gen ai job oriented training programs in bay area, gen ai training with real-world projects in bay area, gen ai training and career counseling in bay area, gen ai training for career switchers in bay area, gen ai training with job guarantee in bay area, gen ai training and mentorship in bay area, gen ai training for corporate employees in bay area, gen ai training with industry experts in bay area, high demand gen ai training in bay area, popular gen ai certification in bay area, top gen ai courses with placement in bay area, best gen ai training for job seekers in bay area, gen ai training with high search volume in bay area, trending gen ai courses in bay area, gen ai training with most searches in bay area, highly searched gen ai programs in bay area, ml training and placement in bay area, ml placement in bay area, ml training and placement in pleasanton, ml training and placement in san francisco, ml placement support in san jose, ml training in oakland, ca, ml training near me in bay area, ml job prep in bay area, ml h1b training in bay area, ml gen ai hybrid training in bay area, ml career guidance in bay area, ml certification courses in bay area, ml training for professionals in bay area, ml online training in bay area, ml training with placement assistance in bay area, ml bootcamp in bay area, ml training for beginners in bay area, ml advanced training in bay area, ml training with job support in bay area, ml job oriented training programs in bay area, ml training with real-world projects in bay area, ml training and career counseling in bay area, ml training for career switchers in bay area, ml training with job guarantee in bay area, ml training and mentorship in bay area, ml training for corporate employees in bay area, ml training with industry experts in bay area, high demand ml training in bay area, popular ml certification in bay area, top ml courses with placement in bay area, best ml training for job seekers in bay area, ml training with high search volume in bay area, trending ml courses in bay area, ml training with most searches in bay area, highly searched ml programs in bay area, data science training and placement in bay area, data science placement in bay area, data science training and placement in san francisco, data science job support in san jose, data science live training in pleasanton, data science training and placement in sf, data science certification courses in bay area, data science training for professionals in bay area, data science online training in bay area, data science training with placement assistance in bay area, data science bootcamp in bay area, data science training for beginners in bay area, data science advanced training in bay area, data science training with job support in bay area, data science job oriented training programs in bay area, data science training with real-world projects in bay area, data science training and career counseling in bay area, data science training for career switchers in bay area, data science training with job guarantee in bay area, data science training and mentorship in bay area, data science training for corporate employees in bay area, data science training with industry experts in bay area, high demand data science training in bay area, popular data science certification in bay area, top data science courses with placement in bay area, best data science training for job seekers in bay area, data science training with high search volume in bay area, trending data science courses in bay area, data science training with most searches in bay area, highly searched data science programs in bay area, ai/ml resume support in bay area, ai/ml interview prep in bay area, ai/ml real-time projects in bay area, ai/ml placement guarantee in bay area, ai/ml low cost training in bay area, ai/ml training for senior professionals in bay area, ai/ml support for h1b in bay area, ai/ml live sessions in bay area, ai/ml corporate batch training in bay area, ai/ml weekend course in bay area, ai/ml career coaching in bay area, ai/ml job placement services in bay area, ai/ml training with visa support in bay area, ai/ml training for international students in bay area, ai/ml training with flexible schedules in bay area, ai/ml training and networking opportunities in bay area, ai/ml training with scholarships in bay area, ai/ml training for veterans in bay area, ai/ml training with financial aid in bay area, ai/ml training and alumni network in bay area, ai/ml training with corporate partnerships in bay area, ai/ml training and hackathons in bay area, ai/ml training with guest lectures in bay area, ai/ml training and workshops in bay area, ai/ml training with continuous learning in bay area, ai/ml training and community events in bay area, ai/ml training with industry collaborations in bay area, ai/ml training and tech talks in bay area, ai/ml training with innovation labs in bay area, high demand ai/ml support services in bay area, popular ai/ml career coaching in bay area, top ai/ml job placement services in bay area, best ai/ml training with visa support in bay area, ai/ml support services with high search volume in bay area, trending ai/ml career services in bay area, ai/ml support services with most searches in bay area, highly searched ai/ml mentorship programs in bay area, aiml training bay area, aiml placement bay area, aiml training and placement pleasanton, aiml training and placement fremont, aiml training san jose ca, aiml placement support san francisco, aiml course bay area, aiml job support bay area, aiml live training oakland, aiml placement program berkeley, aiml training near me bay area, aiml training h1b support bay area, aiml corporate training bay area, aiml placement assistance ca, aiml placement help livermore, aiml classes bay area ca, aiml bootcamp bay area, aiml for working professionals bay area, aiml weekend training bay area, aiml placement track bay area, aiml gen ai training bay area, gen ai training pleasanton placement, gen ai training fremont, gen ai placement bay area, gen ai job support san jose, gen ai live training sf, gen ai job prep oakland, gen ai training near me bay area, ai ml placement bay area, ai ml training sf, ai ml live training san jose, ai ml career support bay area, ai ml job support oakland, ai ml training near me california, ai ml placement fremont, ml training bay area placement, ml placement bay area, ml training pleasanton placement, ml training san francisco placement, ml placement support san jose, ml training oakland ca, ml training near me bay area, ml job prep bay area, ml h1b training bay area, ai ml fundamentals bay area, ai ml certification bay area, ai ml online training bay area, ai ml job placement ca, ai ml hands-on training bay area, aiml resume support bay area, aiml interview prep bay area, aiml real-time projects bay area, aiml placement guarantee bay area, aiml low cost bay area, aiml senior professionals bay area, ai ml support h1b bay area, ai ml live sessions bay area, ai ml corporate batch bay area, ai ml weekend course bay area, aiml professional training ca, aiml executive training bay area, aiml customized training bay area, aiml job oriented training california, aiml placement services bay area, ml gen ai hybrid training bay area, ml career guidance bay area, gen ai job placement bay area, gen ai resume help bay area, gen ai interview prep bay area, data science training bay area placement, data science placement bay area, data science training sf placement, data science job support sj, data science live training pleasanton, aiml training bay area california, aiml placement bay area california, aiml courses bay area ca, aiml bootcamp bay area california, aiml professional training bay area, aiml hands-on training bay area, aiml live training bay area, aiml online training bay area, aiml fundamentals bay area, aiml certification bay area, aiml placement assistance bay area, aiml placement program bay area, aiml training pleasanton, aiml placement pleasanton, aiml training fremont, aiml placement fremont, aiml placement support san jose, aiml training san francisco ca, aiml placement san francisco, gen ai training pleasanton, aiml career change programs bay area, aiml upskilling courses bay area, aiml reskill training bay area, aiml engineer training bay area, machine learning engineer bootcamp bay area, ai developer training bay area, aiml immersive bootcamp bay area, aiml practical training bay area, aiml project-based learning bay area, aiml capstone project training bay area, aiml industry projects bay area, aiml mentorship programs bay area, aiml instructor-led training bay area, aiml blended learning bay area, aiml flexible schedule training bay area, aiml job interview preparation bay area, aiml career counseling bay area, aiml job search strategies bay area, aiml networking events bay area, aiml employer connections bay area, aiml job market insights bay area, aiml career services bay area, aiml for beginners bay area, aiml for non-programmers bay area, aiml for fresh graduates bay area, aiml for experienced professionals bay area, gen ai bootcamp bay area, large language model training bay area, computer vision courses bay area, natural language processing training bay area, deep learning certification bay area, best aiml training bay area for placements, top aiml academies bay area, affordable aiml training bay area, aiml training roi bay area, aiml career programs san mateo, aiml training santa clara, aiml placement palo alto, aiml live classes sunnyvale"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://whitebox-learning.com/" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="dark:bg-black" suppressHydrationWarning>
        <GoogleAnalytics />
        <SessionProvider>
          <AuthProvider>
            <Providers>
              {isAvatarSection ? (
                <>{children}</>
              ) : (
                <>
                  <Header />
                  <Sidebar
                    isOpen={isOpen}
                    toggleSidebar={() => setIsOpen(!isOpen)}
                  />
                  <main className="w-full">{children}</main>
                  <Footer />
                  <ScrollToTop />
                  <ReferralNotificationButton />
                </>
              )}
            </Providers>
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
