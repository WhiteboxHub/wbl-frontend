// "use client";

// import React from 'react';
// import { useRouter } from 'next/navigation';
// import { useAuth } from '@/utils/AuthContext';
// import { ArrowLeft, Gift, Users, Star, CheckCircle, Mail, Phone } from 'lucide-react';

// const ReferAndEarnPage = () => {
//   const { isAuthenticated } = useAuth();
//   const router = useRouter();

//   // Redirect if not authenticated
//   React.useEffect(() => {
//     if (!isAuthenticated) {
//       router.push('/login');
//     }
//   }, [isAuthenticated, router]);

//   const handleBack = () => {
//     router.back();
//   };

//   if (!isAuthenticated) {
//     return null; // Will redirect to login
//   }

//   return (
//     <>
//       <main className="container px-4 py-6 sm:px-6">
//         {/* Header */}
//         <nav className="mt-5 flex h-16 flex-col items-start justify-center sm:mt-8 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
//         </nav>

//         {/* Main Content */}
//         <section className="relative flex h-full justify-center lg:min-h-[600px]">
//           <div className="flex w-full flex-col justify-center rounded-3xl bg-gradient-to-tl from-sky-300 via-purple-300 to-indigo-400 p-8 px-10 py-15 text-white shadow-lg dark:bg-gradient-to-br dark:from-dark/50 dark:to-primarylight/25 sm:w-4/5 lg:w-3/4">
//             {/* Header Section */}
//             <div className="text-center mb-8">
//               <div className="flex justify-center mb-4">
//                 <div className="bg-white/20 rounded-full p-4">
//                   <Gift size={40} className="text-white" />
//                 </div>
//               </div>
//               <h2 className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
//                 📢 Candidate Referral Program
//               </h2>
//               <p className="text-gray-700 dark:text-gray-200 text-lg">
//                 We're excited to launch our Referral Program exclusively for our current and previously enrolled candidates of our training programs.
//               </p>
//             </div>

//             {/* Main Message */}
//             <div className="mb-8 bg-white/10 rounded-lg p-6">
//               <p className="text-gray-700 dark:text-gray-200 text-lg mb-4">
//                 Do you know someone — a friend, associate, or family member — who's passionate about Artificial Intelligence and Machine Learning?
//               </p>
//               <p className="text-gray-700 dark:text-gray-200 text-lg">
//                 Refer them to our training programs and help them kickstart a transformative career in tech. As a token of appreciation, you will receive a referral bonus for every successful enrollment made through your reference.
//               </p>
//             </div>

//             {/* How It Works */}
//             <div className="mb-8">
//               <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
//                 <Star className="mr-2" size={24} />
//                 How It Works
//               </h3>
//               <div className="space-y-4">
//                 <div className="bg-white/10 rounded-lg p-4">
//                   <div className="flex items-center space-x-3">
//                     <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
//                     <span className="font-semibold text-gray-800 dark:text-white">Share your referral's name and contact details with us.</span>
//                   </div>
//                 </div>
//                 <div className="bg-white/10 rounded-lg p-4">
//                   <div className="flex items-center space-x-3">
//                     <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
//                     <span className="font-semibold text-gray-800 dark:text-white">Upon their successful enrollment, you receive your referral bonus.</span>
//                   </div>
//                 </div>
//                 <div className="bg-white/10 rounded-lg p-4">
//                   <div className="flex items-center space-x-3">
//                     <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
//                     <span className="font-semibold text-gray-800 dark:text-white">No limits — refer as many as you'd like!</span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Eligibility */}
//             <div className="mb-8">
//               <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
//                 <CheckCircle className="mr-2" size={24} />
//                 Eligibility
//               </h3>
//               <div className="bg-white/10 rounded-lg p-4">
//                 <p className="text-gray-700 dark:text-gray-200">
//                   Referral bonus is applicable only for existing or past enrolled candidates of our training programs.
//                 </p>
//               </div>
//             </div>

//             {/* Contact Section */}
//             <div className="mb-8">
//               <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
//                 Let's grow the community together!
//               </h3>
//               <p className="text-gray-700 dark:text-gray-200 mb-4">
//                 For referrals, please contact us at:
//               </p>
//               <div className="space-y-3">
//                 <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
//                   <Mail className="text-blue-500" size={20} />
//                   <span className="text-gray-700 dark:text-gray-200 font-semibold">
//                     recruiting@whitebox-learning.com
//                   </span>
//                 </div>
//                 <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
//                   <Phone className="text-green-500" size={20} />
//                   <span className="text-gray-700 dark:text-gray-200 font-semibold">
//                     925-557-1053
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Call to Action */}
//             <div className="text-center">
//               <button
//                 onClick={() => window.open('mailto:recruiting@whitebox-learning.com?subject=AIML Training Referral', '_blank')}
//                 className="rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 py-3 px-6 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl hover:from-indigo-900 hover:to-purple-400"
//               >
//                 Contact for Referrals
//               </button>
//             </div>
//           </div>

//           {/* Background Decoration */}
//           <div className="absolute top-1/2 left-1/2 -z-10 hidden w-full -translate-x-1/2 -translate-y-1/2 transform md:block">
//             <svg
//               className="h-full w-full"
//               viewBox="0 0 1440 969"
//               fill="none"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <mask
//                 id="mask0_95:1005"
//                 style={{ maskType: "alpha" }}
//                 maskUnits="userSpaceOnUse"
//                 x="0"
//                 y="0"
//                 width="1440"
//                 height="969"
//               >
//                 <rect width="1440" height="969" fill="#090E34" />
//               </mask>
//               <g mask="url(#mask0_95:1005)">
//                 <path
//                   opacity="0.1"
//                   d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
//                   fill="url(#paint0_linear_95:1005)"
//                 />
//                 <path
//                   opacity="0.1"
//                   d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
//                   fill="url(#paint1_linear_95:1005)"
//                 />
//               </g>
//               <defs>
//                 <linearGradient
//                   id="paint0_linear_95:1005"
//                   x1="1178.4"
//                   y1="151.853"
//                   x2="780.959"
//                   y2="453.581"
//                   gradientUnits="userSpaceOnUse"
//                 >
//                   <stop stopColor="#10B981" />
//                   <stop offset="1" stopColor="#10B981" stopOpacity="0" />
//                 </linearGradient>
//                 <linearGradient
//                   id="paint1_linear_95:1005"
//                   x1="160.5"
//                   y1="220"
//                   x2="1099.45"
//                   y2="1192.04"
//                   gradientUnits="userSpaceOnUse"
//                 >
//                   <stop stopColor="#10B981" />
//                   <stop offset="1" stopColor="#10B981" stopOpacity="0" />
//                 </linearGradient>
//               </defs>
//             </svg>
//           </div>
//         </section>
//       </main>
//     </>
//   );
// };

// export default ReferAndEarnPage; 

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/utils/AuthContext';
import { ArrowLeft, Gift, Users, Star, CheckCircle, Mail, Phone } from 'lucide-react';

const ReferAndEarnPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleBack = () => {
    router.back();
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <>
      <main className="container px-4 py-6 sm:px-6">
        {/* Header */}
        <nav className="mt-5 flex h-16 flex-col items-start justify-center sm:mt-8 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
        </nav>

        {/* Main Content */}
        <section className="relative flex h-full justify-center lg:min-h-[600px]">
          <div className="flex w-full flex-col justice-center rounded-3xl bg-gradient-to-tl from-sky-300 via-purple-300 to-indigo-400 p-8 px-10 py-15 text-white shadow-lg dark:bg-gradient-to-br dark:from-dark/50 dark:to-primarylight/25 sm:w-4/5 lg:w-3/4">
            {/* Header Section */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="bg-white/20 rounded-full p-4">
                  <Gift size={40} className="text-white" />
                </div>
              </div>
              <h2 className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">
                📢 Candidate Referral Program
              </h2>
              <p className="text-gray-700 dark:text-gray-200 text-lg">
                We&rsquo;re excited to launch our Referral Program exclusively for our current and previously enrolled candidates of our training programs.
              </p>
            </div>

            {/* Main Message */}
            <div className="mb-8 bg-white/10 rounded-lg p-6">
              <p className="text-gray-700 dark:text-gray-200 text-lg mb-4">
                Do you know someone — a friend, associate, or family member — who&rsquo;s passionate about Artificial Intelligence and Machine Learning?
              </p>
              <p className="text-gray-700 dark:text-gray-200 text-lg">
                Refer them to our training programs and help them kickstart a transformative career in tech. As a token of appreciation, you will receive a referral bonus for every successful enrollment made through your reference.
              </p>
            </div>

            {/* How It Works */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <Star className="mr-2" size={24} />
                How It Works
              </h3>
              <div className="space-y-4">
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <span className="font-semibold text-gray-800 dark:text-white">Share your referral&apos;s name and contact details with us.</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <span className="font-semibold text-gray-800 dark:text-white">Upon their successful enrollment, you receive your referral bonus.</span>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <span className="font-semibold text-gray-800 dark:text-white">No limits — refer as many as you&apos;d like!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Eligibility */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
                <CheckCircle className="mr-2" size={24} />
                Eligibility
              </h3>
              <div className="bg-white/10 rounded-lg p-4">
                <p className="text-gray-700 dark:text-gray-200">
                  Referral bonus is applicable only for existing or past enrolled candidates of our training programs.
                </p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Let&rsquo;s grow the community together!
              </h3>
              <p className="text-gray-700 dark:text-gray-200 mb-4">
                For referrals, please contact us at:
              </p>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
                  <Mail className="text-blue-500" size={20} />
                  <span className="text-gray-700 dark:text-gray-200 font-semibold">
                    recruiting@whitebox-learning.com
                  </span>
                </div>
                <div className="flex items-center space-x-3 bg-white/10 rounded-lg p-4">
                  <Phone className="text-green-500" size={20} />
                  <span className="text-gray-700 dark:text-gray-200 font-semibold">
                    925-557-1053
                  </span>
                </div>
              </div>
            </div>

            {/* Call to Action */}
            <div className="text-center">
              <button
                onClick={() => window.open('mailto:recruiting@whitebox-learning.com?subject=AIML Training Referral', '_blank')}
                className="rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 py-3 px-6 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 hover:bg-gradient-to-tl hover:from-indigo-900 hover:to-purple-400"
              >
                Contact for Referrals
              </button>
            </div>
          </div>

          {/* Background Decoration */}
          <div className="absolute top-1/2 left-1/2 -z-10 hidden w-full -translate-x-1/2 -translate-y-1/2 transform md:block">
            <svg
              className="h-full w-full"
              viewBox="0 0 1440 969"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <mask
                id="mask0_95:1005"
                style={{ maskType: "alpha" }}
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width="1440"
                height="969"
              >
                <rect width="1440" height="969" fill="#090E34" />
              </mask>
              <g mask="url(#mask0_95:1005)">
                <path
                  opacity="0.1"
                  d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
                  fill="url(#paint0_linear_95:1005)"
                />
                <path
                  opacity="0.1"
                  d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
                  fill="url(#paint1_linear_95:1005)"
                />
              </g>
              <defs>
                <linearGradient
                  id="paint0_linear_95:1005"
                  x1="1178.4"
                  y1="151.853"
                  x2="780.959"
                  y2="453.581"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#10B981" />
                  <stop offset="1" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_95:1005"
                  x1="160.5"
                  y1="220"
                  x2="1099.45"
                  y2="1192.04"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#10B981" />
                  <stop offset="1" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </section>
      </main>
    </>
  );
};

export default ReferAndEarnPage;
