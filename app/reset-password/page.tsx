
// "use client";
// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// const ResetPasswordPage = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const token = searchParams.get("token");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [responseStatus, setResponseStatus] = useState("");

//   useEffect(() => {
//     if (!token) {
//       setMessage("Invalid or missing token.");
//       setResponseStatus("error");
//     }
//   }, [token]);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (loading) return;

//     if (newPassword !== confirmPassword) {
//       setMessage("Passwords do not match.");
//       setResponseStatus("error");
//       return;
//     }

//     setLoading(true);

//     try {
//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/reset-password`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ token, new_password: newPassword }),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         setMessage("Password successfully reset.");
//         setResponseStatus("success");
//         setTimeout(() => router.push("/login"), 2000);
//       } else {
//         setResponseStatus("error");
//         setMessage(data.detail || "Failed to reset password");
//       }
//     } catch (error: any) {
//       setResponseStatus("error");
//       setMessage(
//         error.message || "An error occurred while resetting the password"
//         // (error as Error).message || "An error occurred while resetting the password"
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputFocus = () => {
//     setMessage("");
//   };

//   const handleCloseMessage = () => {
//     setMessage("");
//   };

//   return (
//     <section className="relative z-10 mt-10 overflow-hidden pt-20 pb-16 md:pb-20 lg:pt-[100px] lg:pb-28">
//       <div className="container">
//         <div className="-mx-3 flex flex-wrap">
//           <div className="w-full">
//             <div className="mx-auto max-w-[500px] rounded-3xl bg-gradient-to-br from-pink-400 to-sky-200 p-6 px-10 dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500/30 sm:p-[60px]">
//               <h3 className="mb-12 text-center text-xl font-bold text-black dark:text-white sm:text-3xl">
//                 Reset Password
//               </h3>
//               <form onSubmit={handleSubmit}>
//                 <div className="mb-8">
//                   <label
//                     htmlFor="new-password"
//                     className="mb-5 block text-sm font-medium text-dark dark:text-white sm:text-base"
//                   >
//                     New Password <span className="text-[red]">*</span>
//                   </label>
//                   <input
//                     type="password"
//                     name="new-password"
//                     placeholder="Enter your new password"
//                     className="dark:shadow-signUp w-full rounded-3xl border border-transparent py-2 px-4 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3 sm:px-6"
//                     value={newPassword}
//                     pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
//                     title="Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
//                     onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                       setNewPassword(e.target.value)
//                     }
//                     onFocus={handleInputFocus}
//                     required
//                   />
//                 </div>
//                 <div className="mb-8">
//                   <label
//                     htmlFor="confirm-password"
//                     className="mb-5 block text-sm font-medium text-dark dark:text-white sm:text-base"
//                   >
//                     Confirm Password <span className="text-[red]">*</span>
//                   </label>
//                   <input
//                     type="password"
//                     name="confirm-password"
//                     placeholder="Confirm your new password"
//                     className="dark:shadow-signUp w-full rounded-3xl border border-transparent py-2 px-4 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3 sm:px-6"
//                     value={confirmPassword}
//                     pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
//                     title="Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
//                     onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                       setConfirmPassword(e.target.value)
//                     }
//                     onFocus={handleInputFocus}
//                     required
//                   />
//                 </div>
//                 {loading ? (
//                   <div className="text-md mb-4 text-center font-medium text-black dark:text-white sm:text-2xl">
//                     Loading&nbsp;
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       viewBox="0 0 24 24"
//                       className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[50px] sm:w-[50px]"
//                     >
//                       <circle cx="4" cy="12" r="3" fill="currentColor">
//                         <animate
//                           id="svgSpinners3DotsScale0"
//                           attributeName="r"
//                           begin="0;svgSpinners3DotsScale1.end-0.2s"
//                           dur="0.6s"
//                           values="3;.2;3"
//                         />
//                       </circle>
//                       <circle cx="12" cy="12" r="3" fill="currentColor">
//                         <animate
//                           attributeName="r"
//                           begin="svgSpinners3DotsScale0.end-0.48s"
//                           dur="0.6s"
//                           values="3;.2;3"
//                         />
//                       </circle>
//                       <circle cx="20" cy="12" r="3" fill="currentColor">
//                         <animate
//                           id="svgSpinners3DotsScale1"
//                           attributeName="r"
//                           begin="svgSpinners3DotsScale0.end-0.36s"
//                           dur="0.6s"
//                           values="3;.2;3"
//                         />
//                       </circle>
//                     </svg>
//                   </div>
//                 ) : (
//                   <button
//                     type="submit"
//                     className="hover:shadow-signUp flex w-full items-center justify-center rounded-3xl bg-primary py-3 px-6 text-sm font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 sm:py-4 sm:px-9 sm:text-base"
//                   >
//                     Reset Password
//                   </button>
//                 )}
//                 {message && (
//                   <div
//                     className={`${
//                       responseStatus === "success"
//                         ? "border-green-400 bg-green-100 text-green-700"
//                         : "border-red-400 bg-red-100 text-red-700"
//                     } relative mt-4 flex items-center justify-between rounded-xl px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base`}
//                     role="alert"
//                   >
//                     <div>
//                       <strong className="font-bold">
//                         {responseStatus === "success" ? "Success" : "Error"} -{" "}
//                       </strong>
//                       <span>{message}</span>
//                     </div>
//                     <button
//                       onClick={handleCloseMessage}
//                       className="ml-4 bg-transparent text-lg font-bold text-red-700 hover:text-red-900 focus:outline-none"
//                       aria-label="Close message"
//                     >
//                       &times;
//                     </button>
//                   </div>
//                 )}
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ResetPasswordPage;


"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react"; // 👈 install with: npm i lucide-react

const ResetPasswordPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false); // 👈 toggle state
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 👈 toggle state

  useEffect(() => {
    if (!token) {
      setMessage("Invalid or missing token.");
      setResponseStatus("error");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setResponseStatus("error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, new_password: newPassword }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        setMessage("Password successfully reset.");
        setResponseStatus("success");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setResponseStatus("error");
        setMessage(data.detail || "Failed to reset password");
      }
    } catch (error: any) {
      setResponseStatus("error");
      setMessage(error.message || "An error occurred while resetting password");
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => setMessage("");
  const handleCloseMessage = () => setMessage("");

  return (
    <section className="relative z-10 mt-10 overflow-hidden pt-20 pb-16 md:pb-20 lg:pt-[100px] lg:pb-28">
      <div className="container">
        <div className="-mx-3 flex flex-wrap">
          <div className="w-full">
            <div className="mx-auto max-w-[500px] rounded-3xl bg-gradient-to-br from-pink-400 to-sky-200 p-6 px-10 dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500/30 sm:p-[60px]">
              <h3 className="mb-12 text-center text-xl font-bold text-black dark:text-white sm:text-3xl">
                Reset Password
              </h3>
              <form onSubmit={handleSubmit}>
                {/* New Password */}
                <div className="mb-8 relative">
                  <label
                    htmlFor="new-password"
                    className="mb-5 block text-sm font-medium text-dark dark:text-white sm:text-base"
                  >
                    New Password <span className="text-[red]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      name="new-password"
                      placeholder="Enter your new password"
                      className="dark:shadow-signUp w-full rounded-3xl border border-transparent py-2 px-4 pr-10 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3 sm:px-6"
                      value={newPassword}
                      pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
                      title="Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
                      onChange={(e) => setNewPassword(e.target.value)}
                      onFocus={handleInputFocus}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-8 relative">
                  <label
                    htmlFor="confirm-password"
                    className="mb-5 block text-sm font-medium text-dark dark:text-white sm:text-base"
                  >
                    Confirm Password <span className="text-[red]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm-password"
                      placeholder="Confirm your new password"
                      className="dark:shadow-signUp w-full rounded-3xl border border-transparent py-2 px-4 pr-10 text-base text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3 sm:px-6"
                      value={confirmPassword}
                      pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}"
                      title="Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={handleInputFocus}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                {loading ? (
                  <div className="text-md mb-4 text-center font-medium text-black dark:text-white sm:text-2xl">
                    Loading...
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="hover:shadow-signUp flex w-full items-center justify-center rounded-3xl bg-primary py-3 px-6 text-sm font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 sm:py-4 sm:px-9 sm:text-base"
                  >
                    Reset Password
                  </button>
                )}

                {/* Message */}
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
                      <span>{message}</span>
                    </div>
                    <button
                      onClick={handleCloseMessage}
                      className="ml-4 bg-transparent text-lg font-bold text-red-700 hover:text-red-900 focus:outline-none"
                      aria-label="Close message"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
