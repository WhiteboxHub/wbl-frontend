// // frntend\app\login\page.tsx
// "use client";
// import Link from "next/link";
// import UserDashboard from "@/app/user_dashboard/page";
// import { useRouter, useSearchParams } from "next/navigation";
// import { Suspense, useEffect, useState } from "react";
// import { useAuth } from "@/utils/AuthContext";
// import { signIn, useSession } from "next-auth/react";
// import { SignInResponse } from "next-auth/react";

// const SigninPage = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [gloading, setGLoading] = useState(false);
//   const [responseStatus, setResponseStatus] = useState("");
//   const [loggedIn, setLoggedIn] = useState(false);
//   const { data: session, status } = useSession();
//   const [googleMessage, setGoogleMessage] = useState(""); // Google login message
//   const [googleStatus, setGoogleStatus] = useState(""); // Status for Google login

//   const { login } = useAuth();
//   const router = useRouter();
//   const searchParams = useSearchParams(); // Use searchParams to get query parameters
//   const callbackUrl = searchParams.get("redirect") || "/";

//   // Extend SignInResponse to include a message property
//   interface ExtendedSignInResponse extends SignInResponse {
//     message?: string; // Optional message property
//   }

//   const handleGoogleSignIn = async () => {
//     setGoogleMessage(""); // Clear previous messages at the start
//     setGoogleStatus(""); // Clear previous status at the start
//     setGLoading(true); // Set gloading to true

//     // Call the signIn function and cast the response type
//     const response: ExtendedSignInResponse | undefined = (await signIn(
//       "google",
//       { redirect: false }
//     )) as ExtendedSignInResponse;

//     if (!response) {
//       // setGoogleMessage("No response received from Google sign-in.");
//       setGoogleStatus("error");
//       setGLoading(false); // Set gloading to false
//       return;
//     }

//     // Handle success response
//     if (response.url) {
//       // console.log("Google SignIn Response:", response);
//       const url = new URL(response.url);
//       const status = url.searchParams.get("status");
//       if (status === "registered") {
//         setGoogleMessage("Registered successfully!");
//         setGoogleStatus("success");
//       } else if (status === "inactive") {
//         setGoogleMessage("Inactive account. Please contact admin.");
//         setGoogleStatus("error");
//       } else if (status === "active") {
//         setGoogleMessage("Logged in successfully!");
//         setGoogleStatus("success");

//           router.push('/');

//       } else {
//         setGoogleMessage("Unexpected status received: " + status);
//         setGoogleStatus("error");
//       }
//     } else {
//       setGoogleMessage("No status returned from Google sign-in.");
//       setGoogleStatus("error");
//     }

//     setGLoading(false); // Set gloading to false at the end
//   };

//  // useEffect to handle session changes
//  useEffect(() => {
//   if (session?.user?.status === "inactive") {
//     setGoogleMessage("Inactive account. Please contact admin.");
//     setGoogleStatus("error");
//   } else if (session?.user?.status === "registered") {
//     setGoogleMessage("Registered successfully !!");
//     setGoogleStatus("success");
//   } else if (session?.user?.status === "active") {
//     setGoogleMessage("Logged in successfully!");
//     setGoogleStatus("success");
//     router.push('/');  }
// }, [session, router]);

//   // Reset messages on component mount
//   useEffect(() => {
//     setMessage("");
//     setGoogleMessage("");
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (loading) return;
//     setLoading(true);

//     const formData = new URLSearchParams();
//     formData.append("username", email); // Replace 'username' with the actual input field name
//     formData.append("password", password); // Replace 'password' with the actual input field name

//     try {
//       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/x-www-form-urlencoded",
//         },
//         body: formData,
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setMessage(data.message || "Login successful!");
//         setResponseStatus("success");
//         login(data.access_token);
//         setLoggedIn(true); // Set logged-in state to true
//         router.push(callbackUrl);
//       } else {
//         setResponseStatus("error");
//         setMessage(data.detail || "Failed to login");
//       }
//     } catch (error) {
//       setResponseStatus("error");
//       setMessage(error.detail || "An error occurred during login");
//     } finally {
//       setLoading(false);
//     }
//     setEmail("");
//     setPassword("");
//   };

//   const handleInputFocus = () => {
//     setMessage("");
//   };

//   const handleCloseMessage = () => {
//     setMessage("");
//   };

//   // Check if access token exists on load and redirect if present
//   useEffect(() => {
//     // console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
//     const accessToken = localStorage.getItem("access_token");
//     if (accessToken) {
//       router.push(callbackUrl);
//     }
//   }, [router, callbackUrl]);

//   if (loggedIn) {
//     return <UserDashboard />;
//   }

//   const handleCloseGoogleMessage = () => {
//     setGoogleMessage(""); // Close the message box
//   };

//   return (
//     <Suspense fallback={<div>LOADING...</div>}>
//       <section className="relative z-10 mt-10 overflow-hidden pt-20 pb-16 md:pb-20 lg:pt-[100px] lg:pb-28">
//         <div className="container">
//           <div className="flex flex-wrap">
//             <div className="w-full">
//               <div className="mx-auto max-w-[500px] rounded-3xl bg-gradient-to-br from-pink-400 to-sky-200 p-6 px-10 dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500/30 sm:p-[60px]">
//                 <h3 className="mb-3 text-center text-lg font-bold text-black dark:text-white sm:text-2xl md:text-3xl">
//                   Welcome back!
//                 </h3>
//                 <p className="md:text-md mb-7 text-center text-xs font-semibold text-gray-700 dark:text-white sm:mb-11 sm:text-sm">
//                   Sign In to your account
//                 </p>
//                 <button
//   className="dark:shadow-signUp mb-4 flex w-full items-center justify-center rounded-3xl bg-white py-2 px-5 text-sm font-medium text-primary shadow-one dark:bg-white dark:text-black sm:mb-6 sm:py-3 sm:text-base"
//   onClick={handleGoogleSignIn}
//   disabled={gloading} // Disable button while gloading
// >
//   {gloading ? (
//     <div className="flex items-center justify-center text-center   sm:text-2xl">
//       Loading
//       <svg
//         xmlns="http://www.w3.org/2000/svg"
//         viewBox="0 0 24 24"
//         fill="currentColor"
//         className="h-5 w-5 mr-2  sm:h-8 sm:w-8"

//       >
//         <circle cx="4" cy="12" r="3" fill="currentColor">
//           <animate
//             id="svgSpinners3DotsScale0"
//             attributeName="r"
//             begin="0;svgSpinners3DotsScale1.end-0.2s"
//             dur="0.6s"
//             values="3;.2;3"
//           />
//         </circle>
//         <circle cx="12" cy="12" r="3" fill="currentColor">
//           <animate
//             attributeName="r"
//             begin="svgSpinners3DotsScale0.end-0.48s"
//             dur="0.6s"
//             values="3;.2;3"
//           />
//         </circle>
//         <circle cx="20" cy="12" r="3" fill="currentColor">
//           <animate
//             id="svgSpinners3DotsScale1"
//             attributeName="r"
//             begin="svgSpinners3DotsScale0.end-0.36s"
//             dur="0.6s"
//             values="3;.2;3"
//           />
//         </circle>
//       </svg>

//     </div>
//   ) : (
//     <>
//       <span className="mr-3">
//         <svg
//           width="20"
//           height="20"
//           viewBox="0 0 20 20"
//           fill="none"
//           xmlns="http://www.w3.org/2000/svg"
//           // className="h-5 w-5 sm:h-8 sm:w-8"
//         >
//           <g clipPath="url(#clip0_95:967)">
//             <path
//               d="M20.0001 10.2216C20.0122 9.53416 19.9397 8.84776 19.7844 8.17725H10.2042V11.8883H15.8277C15.7211 12.539 15.4814 13.1618 15.1229 13.7194C14.7644 14.2769 14.2946 14.7577 13.7416 15.1327L13.722 15.257L16.7512 17.5567L16.961 17.5772C18.8883 15.8328 19.9997 13.266 19.9997 10.2216"
//               fill="#4285F4"
//             />
//             <path
//               d="M10.2042 20.0001C12.9592 20.0001 15.2721 19.1111 16.9616 17.5778L13.7416 15.1332C12.88 15.7223 11.7235 16.1334 10.2042 16.1334C8.91385 16.126 7.65863 15.7206 6.61663 14.9747C5.57464 14.2287 4.79879 13.1802 4.39915 11.9778L4.27957 11.9878L1.12973 14.3766L1.08856 14.4888C1.93689 16.1457 3.23879 17.5387 4.84869 18.512C6.45859 19.4852 8.31301 20.0005 10.2046 20.0001"
//               fill="#34A853"
//             />
//             <path
//               d="M4.39911 11.9777C4.17592 11.3411 4.06075 10.673 4.05819 9.99996C4.0623 9.32799 4.17322 8.66075 4.38696 8.02225L4.38127 7.88968L1.19282 5.4624L1.08852 5.51101C0.372885 6.90343 0.00012207 8.4408 0.00012207 9.99987C0.00012207 11.5589 0.372885 13.0963 1.08852 14.4887L4.39911 11.9777Z"
//               fill="#FBBC05"
//             />
//             <path
//               d="M10.2042 3.86663C11.6663 3.84438 13.0804 4.37803 14.1498 5.35558L17.0296 2.59996C15.1826 0.901848 12.7366 -0.0298855 10.2042 -3.6784e-05C8.3126 -0.000477834 6.45819 0.514732 4.8483 1.48798C3.2384 2.46124 1.93649 3.85416 1.08813 5.51101L4.38775 8.02225C4.79132 6.82005 5.56974 5.77231 6.61327 5.02675C7.6568 4.28118 8.91279 3.87541 10.2042 3.86663Z"
//               fill="#EB4335"
//             />
//           </g>
//           <defs>
//             <clipPath id="clip0_95:967">
//               <rect width="20" height="20" fill="white" />
//             </clipPath>
//           </defs>
//         </svg>
//       </span>
//       Sign In with Google
//     </>
//   )}
// </button>

//                 <div className="mb-8 flex items-center justify-center">
//                   <span className="hidden h-[1px] w-full max-w-[70px] bg-body-color sm:block"></span>
//                   <p className="md:text-md w-full px-5 text-center text-xs font-semibold text-gray-700 dark:text-white sm:text-sm">
//                     Or, Sign In with email
//                   </p>
//                   <span className="hidden h-[1px] w-full max-w-[70px] bg-body-color sm:block"></span>
//                 </div>
//                 <form
//                   onSubmit={handleSubmit}
//                   className="md:text-md text-xs text-black dark:text-white sm:text-sm"
//                 >
//                   <div className="mb-6 sm:mb-8">
//                     <label
//                       htmlFor="email"
//                       className="mb-3 block font-bold text-dark dark:text-white"
//                     >
//                       Email Address <span className="text-[red]">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       name="email"
//                       placeholder="Enter your email"
//                       className="dark:shadow-signUp w-full rounded-3xl border border-transparent py-2 px-5 text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                       onFocus={handleInputFocus}
//                       required
//                     />
//                   </div>
//                   <div className="mb-8">
//                     <label
//                       htmlFor="password"
//                       className="mb-3 block font-bold text-dark dark:text-white"
//                     >
//                       Password <span className="text-[red]">*</span>
//                     </label>
//                     <input
//                       type="password"
//                       name="password"
//                       placeholder="Enter your password"
//                       className="dark:shadow-signUp w-full rounded-3xl border border-transparent py-2 px-5 text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
//                       value={password}
//                       onChange={(e) => setPassword(e.target.value)}
//                       onFocus={handleInputFocus}
//                       required
//                     />
//                   </div>
//                   <div>
//                     <a
//                       href="/forgot_password"
//                       className="mb-3 block font-bold text-dark dark:text-white"
//                     >
//                       Forgot Password?
//                     </a>
//                   </div>
//                   {loading ? (
//                     <div className="text-md mb-4 text-center font-bold text-black dark:text-white sm:text-2xl">
//                       Loading&nbsp;
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         viewBox="0 0 24 24"
//                         className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
//                       >
//                         <circle cx="4" cy="12" r="3" fill="currentColor">
//                           <animate
//                             id="svgSpinners3DotsScale0"
//                             attributeName="r"
//                             begin="0;svgSpinners3DotsScale1.end-0.2s"
//                             dur="0.6s"
//                             values="3;.2;3"
//                           />
//                         </circle>
//                         <circle cx="12" cy="12" r="3" fill="currentColor">
//                           <animate
//                             attributeName="r"
//                             begin="svgSpinners3DotsScale0.end-0.48s"
//                             dur="0.6s"
//                             values="3;.2;3"
//                           />
//                         </circle>
//                         <circle cx="20" cy="12" r="3" fill="currentColor">
//                           <animate
//                             id="svgSpinners3DotsScale1"
//                             attributeName="r"
//                             begin="svgSpinners3DotsScale0.end-0.36s"
//                             dur="0.6s"
//                             values="3;.2;3"
//                           />
//                         </circle>
//                       </svg>
//                     </div>
//                   ) : (
//                     <button
//                       type="submit"
//                       className="hover:shadow-signUp flex w-full items-center justify-center rounded-3xl bg-primary py-2 px-6 font-bold text-white transition duration-300 ease-in-out hover:bg-opacity-80 sm:py-3"
//                     >
//                       Login
//                     </button>
//                   )}
//                   {message && (
//                     <div
//                       className={`${
//                         responseStatus === "success"
//                           ? "border-green-400 bg-green-100 text-green-700"
//                           : "border-red-400 bg-red-100 text-red-700"
//                       } relative mt-4 flex items-center justify-between rounded-xl px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base`}
//                       role="alert"
//                     >
//                       <div>
//                         <strong className="font-bold">
//                           {responseStatus === "success" ? "Success" : "Error"} -{" "}
//                         </strong>
//                         <span className="">{message}</span>
//                       </div>
//                       <button
//                         onClick={handleCloseMessage}
//                         className="ml-4 bg-transparent text-lg font-bold text-red-700 hover:text-red-900 focus:outline-none"
//                       >
//                         &times;
//                       </button>
//                     </div>
//                   )}
//                   {googleMessage && (
//                     <div
//                       className={`${
//                         googleStatus === "success"
//                           ? "border-green-400 bg-green-100 text-green-700"
//                           : "border-red-400 bg-red-100 text-red-700"
//                       } relative mt-4 flex items-center justify-between rounded-xl px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base`}
//                       role="alert"
//                     >
//                       <div>
//                         <strong className="font-bold">
//                           {googleStatus === "success" ? "Success" : "Error"} -{" "}
//                         </strong>
//                         <span>{googleMessage}</span>
//                       </div>
//                       <button
//                         onClick={handleCloseGoogleMessage}
//                         className="ml-4 bg-transparent text-lg font-bold text-red-700 hover:text-red-900 focus:outline-none"
//                       >
//                         &times;
//                       </button>
//                     </div>
//                   )}
//                 </form>
//                 <p className="md:text-md mt-4 text-center text-xs font-semibold text-black dark:text-white sm:text-sm">
//                   Don’t have an account?{" "}
//                   <Link
//                     href="/signup"
//                     className="md:text-md text-xs font-extrabold text-primary hover:underline sm:text-sm"
//                   >
//                     Register
//                   </Link>
//                 </p>
//               </div>
//             </div>
//           </div>
//         </div>
//         <div className="absolute right-0 top-0 z-[-1]">
//           <svg
//             width="1440"
//             height="969"
//             viewBox="0 0 1440 969"
//             fill="none"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <mask
//               id="mask0_95:1005"
//               style={{ maskType: "alpha" }}
//               maskUnits="userSpaceOnUse"
//               x="0"
//               y="0"
//               width="1440"
//               height="969"
//             >
//               <rect width="1440" height="969" fill="#090E34" />
//             </mask>
//             <g mask="url(#mask0_95:1005)">
//               <path
//                 opacity="0.1"
//                 d="M1086.96 297.978L632.959 554.978L935.625 535.926L1086.96 297.978Z"
//                 fill="url(#paint0_linear_95:1005)"
//               />
//               <path
//                 opacity="0.1"
//                 d="M1324.5 755.5L1450 687V886.5L1324.5 967.5L-10 288L1324.5 755.5Z"
//                 fill="url(#paint1_linear_95:1005)"
//               />
//             </g>
//             <defs>
//               <linearGradient
//                 id="paint0_linear_95:1005"
//                 x1="1178.4"
//                 y1="151.853"
//                 x2="780.959"
//                 y2="453.581"
//                 gradientUnits="userSpaceOnUse"
//               >
//                 <stop stopColor="#4A6CF7" />
//                 <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
//               </linearGradient>
//               <linearGradient
//                 id="paint1_linear_95:1005"
//                 x1="160.5"
//                 y1="220"
//                 x2="1099.45"
//                 y2="1192.04"
//                 gradientUnits="userSpaceOnUse"
//               >
//                 <stop stopColor="#4A6CF7" />
//                 <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
//               </linearGradient>
//             </defs>
//           </svg>
//         </div>
//       </section>
//     </Suspense>
//   );
// };
// export default SigninPage;

// frntend\app\login\page.tsx
"use client";
import Link from "next/link";
import UserDashboard from "@/app/user_dashboard/page";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { signIn, useSession } from "next-auth/react";
import { SignInResponse } from "next-auth/react";

const SigninPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [gloading, setGLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const { data: session, status } = useSession();
  const [googleMessage, setGoogleMessage] = useState(""); // Google login message
  const [googleStatus, setGoogleStatus] = useState(""); // Status for Google login
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); // Use searchParams to get query parameters
  const callbackUrl = searchParams.get("redirect") || "/";

  // Extend SignInResponse to include a message property
  interface ExtendedSignInResponse extends SignInResponse {
    message?: string; // Optional message property
  }

  const handleGoogleSignIn = async () => {
    setGoogleMessage(""); // Clear previous messages at the start
    setGoogleStatus(""); // Clear previous status at the start
    setGLoading(true); // Set gloading to true

    // Call the signIn function and cast the response type
    const response: ExtendedSignInResponse | undefined = (await signIn(
      "google",
      { redirect: false }
    )) as ExtendedSignInResponse;

    if (!response) {
      // setGoogleMessage("No response received from Google sign-in.");
      setGoogleStatus("error");
      setGLoading(false); // Set gloading to false
      return;
    }

    // Handle success response
    if (response.url) {
      // console.log("Google SignIn Response:", response);
      const url = new URL(response.url);
      const status = url.searchParams.get("status");
      if (status === "registered") {
        setGoogleMessage("Registered successfully!");
        setGoogleStatus("success");
      } else if (status === "inactive") {
        setGoogleMessage("Inactive account. Please contact admin.");
        setGoogleStatus("error");
      } else if (status === "active") {
        setGoogleMessage("Logged in successfully!");
        setGoogleStatus("success");

        router.push("/");
      } else {
        setGoogleMessage("Unexpected status received: " + status);
        setGoogleStatus("error");
      }
    } else {
      setGoogleMessage("No status returned from Google sign-in.");
      setGoogleStatus("error");
    }

    setGLoading(false); // Set gloading to false at the end
  };

  // // **************************************************************
  // useEffect to handle session changes
  useEffect(() => {
    if (session?.user?.status === "inactive") {
      setGoogleMessage("Inactive account. Please contact admin.");
      setGoogleStatus("error");
    } else if (session?.user?.status === "registered") {
      setGoogleMessage("Registered successfully !!");
      setGoogleStatus("success");
    } else if (session?.user?.status === "active") {
      setGoogleMessage("Logged in successfully!");
      setGoogleStatus("success");
      router.push("/");
    }
  }, [session, router]);
  
  // // **************************************************************

  // Reset messages on component mount
  useEffect(() => {
    setMessage("");
    setGoogleMessage("");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", email); // Replace 'username' with the actual input field name
    formData.append("password", password); // Replace 'password' with the actual input field name

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || "Login successful!");
        setResponseStatus("success");
        login(data.access_token);
        setLoggedIn(true); // Set logged-in state to true
        router.push(callbackUrl);
      } else {
        setResponseStatus("error");
        setMessage(data.detail || "Failed to login");
      }
    } catch (error) {
      setResponseStatus("error");
      setMessage(error.detail || "An error occurred during login");
    } finally {
      setLoading(false);
    }
    setEmail("");
    setPassword("");
  };

  const handleInputFocus = () => {
    setMessage("");
  };

  const handleCloseMessage = () => {
    setMessage("");
  };

  // Check if access token exists on load and redirect if present
  useEffect(() => {
    // console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      router.push(callbackUrl);
    }
  }, [router, callbackUrl]);

  if (loggedIn) {
    return <UserDashboard />;
  }

  const handleCloseGoogleMessage = () => {
    setGoogleMessage(""); // Close the message box
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Suspense fallback={<div>LOADING...</div>}>
      <section className="relative z-10 mt-10 overflow-hidden pt-20 pb-16 md:pb-20 lg:pt-[100px] lg:pb-28">
        <div className="container">
          <div className="flex flex-wrap">
            <div className="w-full">
              <div className="mx-auto max-w-[500px] rounded-3xl bg-gradient-to-br from-pink-400 to-sky-200 p-6 px-10 dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500/30 sm:p-[60px]">
                <h3 className="mb-3 text-center text-lg font-bold text-black dark:text-white sm:text-2xl md:text-3xl">
                  Welcome back!
                </h3>
                <p className="md:text-md mb-7 text-center text-xs font-semibold text-gray-700 dark:text-white sm:mb-11 sm:text-sm">
                  Sign In to your account
                </p>
                <button
                  className="dark:shadow-signUp mb-4 flex w-full items-center justify-center rounded-xl bg-white py-2 px-5 text-sm font-medium text-primary shadow-one dark:bg-white dark:text-black sm:mb-6 sm:py-3 sm:text-base"
                  onClick={handleGoogleSignIn}
                  disabled={gloading} // Disable button while gloading
                >
                  {gloading ? (
                    // <div className="flex items-center justify-center text-center   sm:text-2xl">
                    //   Loading
                    //   <svg
                    //     xmlns="http://www.w3.org/2000/svg"
                    //     viewBox="0 0 24 24"
                    //     fill="currentColor"
                    //     className="h-5 w-5 mr-2  sm:h-8 sm:w-8"
                    //   >
                    //     <circle cx="4" cy="12" r="3" fill="currentColor">
                    //       <animate
                    //         id="svgSpinners3DotsScale0"
                    //         attributeName="r"
                    //         begin="0;svgSpinners3DotsScale1.end-0.2s"
                    //         dur="0.6s"
                    //         values="3;.2;3"
                    //       />
                    //     </circle>
                    //     <circle cx="12" cy="12" r="3" fill="currentColor">
                    //       <animate
                    //         attributeName="r"
                    //         begin="svgSpinners3DotsScale0.end-0.48s"
                    //         dur="0.6s"
                    //         values="3;.2;3"
                    //       />
                    //     </circle>
                    //     <circle cx="20" cy="12" r="3" fill="currentColor">
                    //       <animate
                    //         id="svgSpinners3DotsScale1"
                    //         attributeName="r"
                    //         begin="svgSpinners3DotsScale0.end-0.36s"
                    //         dur="0.6s"
                    //         values="3;.2;3"
                    //       />
                    //     </circle>
                    //   </svg>
                    // </div>
                    <div className="flex items-center justify-center text-center text-sm sm:text-base">
                      Loading
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="mr-1 h-4 w-4 sm:h-5 sm:w-5" // Reduced size here
                      >
                        <circle cx="4" cy="12" r="2" fill="currentColor">
                          {" "}
                          {/* Reduced r */}
                          <animate
                            id="svgSpinners3DotsScale0"
                            attributeName="r"
                            begin="0;svgSpinners3DotsScale1.end-0.2s"
                            dur="0.6s"
                            values="2;.2;2" // Adjusted values to match smaller size
                          />
                        </circle>
                        <circle cx="12" cy="12" r="2" fill="currentColor">
                          <animate
                            attributeName="r"
                            begin="svgSpinners3DotsScale0.end-0.48s"
                            dur="0.6s"
                            values="2;.2;2"
                          />
                        </circle>
                        <circle cx="20" cy="12" r="2" fill="currentColor">
                          <animate
                            id="svgSpinners3DotsScale1"
                            attributeName="r"
                            begin="svgSpinners3DotsScale0.end-0.36s"
                            dur="0.6s"
                            values="2;.2;2"
                          />
                        </circle>
                      </svg>
                    </div>
                  ) : (
                    <>
                      <span className="mr-3">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g clipPath="url(#clip0_95:967)">
                            <path
                              d="M20.0001 10.2216C20.0122 9.53416 19.9397 8.84776 19.7844 8.17725H10.2042V11.8883H15.8277C15.7211 12.539 15.4814 13.1618 15.1229 13.7194C14.7644 14.2769 14.2946 14.7577 13.7416 15.1327L13.722 15.257L16.7512 17.5567L16.961 17.5772C18.8883 15.8328 19.9997 13.266 19.9997 10.2216"
                              fill="#4285F4"
                            />
                            <path
                              d="M10.2042 20.0001C12.9592 20.0001 15.2721 19.1111 16.9616 17.5778L13.7416 15.1332C12.88 15.7223 11.7235 16.1334 10.2042 16.1334C8.91385 16.126 7.65863 15.7206 6.61663 14.9747C5.57464 14.2287 4.79879 13.1802 4.39915 11.9778L4.27957 11.9878L1.12973 14.3766L1.08856 14.4888C1.93689 16.1457 3.23879 17.5387 4.84869 18.512C6.45859 19.4852 8.31301 20.0005 10.2046 20.0001"
                              fill="#34A853"
                            />
                            <path
                              d="M4.39911 11.9777C4.17592 11.3411 4.06075 10.673 4.05819 9.99996C4.0623 9.32799 4.17322 8.66075 4.38696 8.02225L4.38127 7.88968L1.19282 5.4624L1.08852 5.51101C0.372885 6.90343 0.00012207 8.4408 0.00012207 9.99987C0.00012207 11.5589 0.372885 13.0963 1.08852 14.4887L4.39911 11.9777Z"
                              fill="#FBBC05"
                            />
                            <path
                              d="M10.2042 3.86663C11.6663 3.84438 13.0804 4.37803 14.1498 5.35558L17.0296 2.59996C15.1826 0.901848 12.7366 -0.0298855 10.2042 -3.6784e-05C8.3126 -0.000477834 6.45819 0.514732 4.8483 1.48798C3.2384 2.46124 1.93649 3.85416 1.08813 5.51101L4.38775 8.02225C4.79132 6.82005 5.56974 5.77231 6.61327 5.02675C7.6568 4.28118 8.91279 3.87541 10.2042 3.86663Z"
                              fill="#EB4335"
                            />
                          </g>
                          <defs>
                            <clipPath id="clip0_95:967">
                              <rect width="20" height="20" fill="white" />
                            </clipPath>
                          </defs>
                        </svg>
                      </span>
                      Sign In with Google
                    </>
                  )}
                </button>

                <div className="mb-8 flex items-center justify-center">
                  <span className="hidden h-[1px] w-full max-w-[70px] bg-body-color sm:block"></span>
                  <p className="md:text-md w-full px-5 text-center text-xs font-semibold text-gray-700 dark:text-white sm:text-sm">
                    Or, Sign In with email
                  </p>
                  <span className="hidden h-[1px] w-full max-w-[70px] bg-body-color sm:block"></span>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="md:text-md text-xs text-black dark:text-white sm:text-sm"
                >
                  <div className="mb-6 sm:mb-8">
                    <label
                      htmlFor="email"
                      className="mb-3 block font-bold text-dark dark:text-white"
                    >
                      Email Address <span className="text-[red]">*</span>
                    </label>
                    <input
                      type="text"
                      name="email"
                      placeholder="Enter your email"
                      className="dark:shadow-signUp w-full rounded-xl border border-transparent py-2 px-5 text-black placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onFocus={handleInputFocus}
                      required
                    />
                  </div>

                  <div className="relative mb-6 sm:mb-8">
                    <label
                      htmlFor="password"
                      className="mb-3 block font-bold text-dark dark:text-white"
                    >
                      Password <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        // className="w-full py-2 pl-4 pr-10 text-body-color placeholder-body-color border border-transparent rounded-3xl outline-none focus:border-primary focus-visible:shadow-none dark:bg-white"
                        className="dark:shadow-signUp w-full rounded-xl border border-transparent py-2 px-5 text-black placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={handleInputFocus}
                        required
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center text-black dark:text-white"
                        onClick={togglePasswordVisibility}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M2 2L22 22"
                              stroke="#555555"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2884M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335"
                              stroke="#555555"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M14 14.2362C13.4692 14.7112 12.7684 15.0001 12 15.0001C10.3431 15.0001 9 13.657 9 12.0001C9 11.1764 9.33193 10.4303 9.86932 9.88818"
                              stroke="#555555"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        ) : (
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12"
                              stroke="#555555"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M1 12C1 12 5 20 12 20C19 20 23 12 23 12"
                              stroke="#555555"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <circle
                              cx="12"
                              cy="12"
                              r="3"
                              stroke="#555555"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <a
                      href="/forgot_password"
                      className="mb-3 block font-bold text-dark dark:text-white"
                    >
                      Forgot Password?
                    </a>
                  </div>
                  {loading ? (
                    <div className="text-md mb-4 text-center font-bold text-black dark:text-white sm:text-2xl">
                      Loading&nbsp;
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
                      >
                        <circle cx="4" cy="12" r="3" fill="currentColor">
                          <animate
                            id="svgSpinners3DotsScale0"
                            attributeName="r"
                            begin="0;svgSpinners3DotsScale1.end-0.2s"
                            dur="0.6s"
                            values="3;.2;3"
                          />
                        </circle>
                        <circle cx="12" cy="12" r="3" fill="currentColor">
                          <animate
                            attributeName="r"
                            begin="svgSpinners3DotsScale0.end-0.48s"
                            dur="0.6s"
                            values="3;.2;3"
                          />
                        </circle>
                        <circle cx="20" cy="12" r="3" fill="currentColor">
                          <animate
                            id="svgSpinners3DotsScale1"
                            attributeName="r"
                            begin="svgSpinners3DotsScale0.end-0.36s"
                            dur="0.6s"
                            values="3;.2;3"
                          />
                        </circle>
                      </svg>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      className="hover:shadow-signUp flex w-full items-center justify-center rounded-xl bg-primary py-2 px-6 font-bold text-white transition duration-300 ease-in-out hover:bg-opacity-80 sm:py-3"
                    >
                      Login
                    </button>
                  )}
                  {message && (
                    <div
                      className={`${
                        responseStatus === "success"
                          ? "border-green-400 bg-green-100 text-green-700"
                          : "border-red-400 bg-red-100 text-red-700"
                      } relative mt-4 flex items-center justify-between rounded-xl px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base`}
                      role="alert"
                    >
                      <div>
                        <strong className="font-bold">
                          {responseStatus === "success" ? "Success" : "Error"} -{" "}
                        </strong>
                        <span className="">{message}</span>
                      </div>
                      <button
                        onClick={handleCloseMessage}
                        className="ml-4 bg-transparent text-lg font-bold text-red-700 hover:text-red-900 focus:outline-none"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                  {googleMessage && (
                    <div
                      className={`${
                        googleStatus === "success"
                          ? "border-green-400 bg-green-100 text-green-700"
                          : "border-red-400 bg-red-100 text-red-700"
                      } relative mt-4 flex items-center justify-between rounded-xl px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base`}
                      role="alert"
                    >
                      <div>
                        <strong className="font-bold">
                          {googleStatus === "success" ? "Success" : "Error"} -{" "}
                        </strong>
                        <span>{googleMessage}</span>
                      </div>
                      <button
                        onClick={handleCloseGoogleMessage}
                        className="ml-4 bg-transparent text-lg font-bold text-red-700 hover:text-red-900 focus:outline-none"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </form>
                <p className="md:text-md mt-4 text-center text-xs font-semibold text-black dark:text-white sm:text-sm">
                  Don’t have an account?{" "}
                  <Link
                    href="/signup"
                    className="md:text-md text-xs font-extrabold text-primary hover:underline sm:text-sm"
                  >
                    Register
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 z-[-1]">
          <svg
            width="1440"
            height="969"
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
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
              <linearGradient
                id="paint1_linear_95:1005"
                x1="160.5"
                y1="220"
                x2="1099.45"
                y2="1192.04"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#4A6CF7" />
                <stop offset="1" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </section>
    </Suspense>
  );
};
export default SigninPage;
