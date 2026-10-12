// /WhiteboxHub/whiteboxLearning-wbl/components/Hero/index.tsx
'use client'
import AnimatedCarousel from "@/components/AnimatedCarousel";
import VideoModal from "@/components/VideoModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from 'react';
import { useAuth } from "@/utils/AuthContext";

const Hero = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userData, setUserData] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');

    if (accessToken) {
      // Store the access token in local storage
      localStorage.setItem('access_token', accessToken);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

    }
  }, [searchParams, router]);

  return (
    <>
      <section id="home" className="relative z-10 overflow-hidden pt-20 pb-8 sm:pt-24 sm:pb-10">
        <div className="container">
          <div className="-mx-4 flex flex-wrap">
            <div className="w-full px-4 sm:px-0">
              <div className="wow fadeInUp text-center" data-wow-delay=".2s">
                <h1 className="mb-4 text-2xl font-bold leading-tight text-black dark:text-white sm:text-3xl sm:leading-tight md:text-4xl md:leading-tight">
                  Whitebox Learning
                </h1>
                
                <AnimatedCarousel onWatchDemo={() => setIsVideoModalOpen(true)} />

                {/* Bottom Tagline (Matches Picture Exactly) */}
                <div className="max-w-7xl mx-auto px-4 text-center mt-8 sm:mt-10">
                  <p className="text-sm sm:text-base md:text-lg font-medium leading-relaxed text-body-color dark:text-gray-400">
                    A comprehensive learning ecosystem tailored for Engineers and Machine Learning enthusiasts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Modal */}
        <VideoModal 
          isOpen={isVideoModalOpen} 
          onClose={() => setIsVideoModalOpen(false)} 
        />
        <div className="absolute top-0 right-0 z-[-1] opacity-30 lg:opacity-100">
          <svg
            width="450"
            height="556"
            viewBox="0 0 450 556"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="277"
              cy="63"
              r="225"
              fill="url(#paint0_linear_25:217)"
            />
            <circle
              cx="17.9997"
              cy="182"
              r="18"
              fill="url(#paint1_radial_25:217)"
            />
            <circle
              cx="76.9997"
              cy="288"
              r="34"
              fill="url(#paint2_radial_25:217)"
            />
            <circle
              cx="325.486"
              cy="302.87"
              r="180"
              transform="rotate(-37.6852 325.486 302.87)"
              fill="url(#paint3_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="184.521"
              cy="315.521"
              r="132.862"
              transform="rotate(114.874 184.521 315.521)"
              stroke="url(#paint4_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="356"
              cy="290"
              r="179.5"
              transform="rotate(-30 356 290)"
              stroke="url(#paint5_linear_25:217)"
            />
            <circle
              opacity="0.8"
              cx="191.659"
              cy="302.659"
              r="133.362"
              transform="rotate(133.319 191.659 302.659)"
              fill="url(#paint6_linear_25:217)"
            />
            <defs>
              <linearGradient
                id="paint0_linear_25:217"
                x1="-54.5003"
                y1="-178"
                x2="222"
                y2="288"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <radialGradient
                id="paint1_radial_25:217"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(17.9997 182) rotate(90) scale(18)"
              >
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <radialGradient
                id="paint2_radial_25:217"
                cx="0"
                cy="0"
                r="1"
                gradientUnits="userSpaceOnUse"
                gradientTransform="translate(76.9997 288) rotate(90) scale(34)"
              >
                <stop offset="0.145833" stopColor="#4A6CF7" stopOpacity="0" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0.08" />
              </radialGradient>
              <linearGradient
                id="paint3_linear_25:217"
                x1="226.775"
                y1="-66.1548"
                x2="292.157"
                y2="351.421"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint4_linear_25:217"
                x1="184.521"
                y1="182.159"
                x2="184.521"
                y2="448.882"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint5_linear_25:217"
                x1="356"
                y1="110"
                x2="356"
                y2="470"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="white" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint6_linear_25:217"
                x1="118.524"
                y1="29.2497"
                x2="166.965"
                y2="338.63"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>
    </>
  );
};

export default Hero;

