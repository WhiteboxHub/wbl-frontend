"use client";

import React, { useState } from "react";
import { useAuth } from "@/utils/AuthContext";
import { useRouter } from "next/navigation";
import Layout from "@/components/Common/Breadcrumb";

// Inline Referral Form Component
const ReferralFormInline = () => {
  const { authToken } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    workstatus: "",
    address: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [responseStatus, setResponseStatus] = useState<"success" | "error" | "">("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/referrals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setResponseStatus("success");
        setMessage("Referral submitted successfully! We'll contact the candidate soon.");
        // Reset form
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          workstatus: "",
          address: "",
          notes: ""
        });
      } else {
        setResponseStatus("error");
        setMessage(data.detail || "Failed to submit referral");
      }
    } catch (error) {
      setResponseStatus("error");
      setMessage("An error occurred while submitting the referral");
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = () => {
    setMessage("");
  };

  const handleCloseMessage = () => {
    setMessage("");
  };

  return (
    <div className="rounded-3xl bg-gradient-to-br from-pink-400 to-sky-200 p-6 dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500/30">
      <h3 className="mb-4 text-center text-xl font-bold text-black dark:text-white">
        Refer a Candidate
        <br />
        <span className="text-lg">
          Help someone start their AIML journey
        </span>
      </h3>

      <p className="mb-6 text-center text-sm font-semibold text-gray-700 dark:text-white">
        Fill in the candidate's details below
      </p>

      <form onSubmit={handleSubmit} className="text-sm text-black dark:text-white">
        {/* Full Name */}
        <div className="mb-4">
          <label htmlFor="full_name" className="mb-2 block font-bold text-dark dark:text-white">
            Full Name
          </label>
          <input
            type="text"
            name="full_name"
            placeholder="Enter candidate's full name"
            className="w-full rounded-3xl border py-2 px-4 text-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white"
            value={formData.full_name}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block font-bold text-dark dark:text-white">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Enter candidate's email"
            className="w-full rounded-3xl border py-2 px-4 text-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white"
            value={formData.email}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            required
          />
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label htmlFor="phone" className="mb-2 block font-bold text-dark dark:text-white">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="Enter candidate's phone number"
            className="w-full rounded-3xl border py-2 px-4 text-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white"
            value={formData.phone}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            required
          />
        </div>

        {/* Work Status */}
        <div className="mb-4">
          <label htmlFor="workstatus" className="mb-2 block font-bold text-dark dark:text-white">
            Visa/Citizenship Status
          </label>
          <select
            name="workstatus"
            className="w-full rounded-3xl border py-2 px-4 text-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white"
            value={formData.workstatus}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          >
            <option value="">Select status</option>
            <option value="citizen">Citizen</option>
            <option value="permanent_resident">Permanent Resident</option>
            <option value="h4">H4</option>
            <option value="l2">L2</option>
            <option value="f1_visa">F1 Visa</option>
            <option value="asylum">Asylum</option>
          </select>
        </div>

        {/* Address */}
        <div className="mb-4">
          <label htmlFor="address" className="mb-2 block font-bold text-dark dark:text-white">
            Address
          </label>
          <input
            type="text"
            name="address"
            placeholder="Enter candidate's address"
            className="w-full rounded-3xl border py-2 px-4 text-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white"
            value={formData.address}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
        </div>

        {/* Additional Notes */}
        <div className="mb-4">
          <label htmlFor="notes" className="mb-2 block font-bold text-dark dark:text-white">
            Additional Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Any additional information about the candidate"
            className="w-full rounded-3xl border py-2 px-4 text-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white"
            value={formData.notes}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
          />
        </div>

        {/* Submit Button */}
        {loading ? (
          <div className="mb-4 text-center text-sm font-medium text-black dark:text-white">
            Submitting&nbsp;
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="inline h-[20px] w-[20px] text-black dark:text-white"
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
            className="flex w-full items-center justify-center rounded-3xl bg-primary py-2 px-6 text-sm font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp"
          >
            Submit Referral
          </button>
        )}

        {/* Message Display */}
        {message && (
          <div
            className={`${
              responseStatus === "success"
                ? "border-green-400 bg-green-100 text-green-700"
                : "border-red-400 bg-red-100 text-red-700"
            } relative mt-4 flex items-center justify-between rounded-xl px-3 py-2 text-sm`}
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
              className="ml-4 bg-transparent text-lg font-bold hover:opacity-75 focus:outline-none"
            >
              &times;
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

const ReferAndEarnPage = () => {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/refer-and-earn");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="mt-32 flex h-screen items-center justify-center pb-24 text-xl text-dark dark:text-white">
        <div className="text-md mb-4 text-center font-medium text-black dark:text-white sm:text-2xl">
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
      </div>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-6 sm:px-6">
        <nav className="mt-20 flex h-16 flex-col items-start justify-center sm:mt-28 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <Layout currentPage="Refer & Earn" />
          </div>
        </nav>
        
        <section className="relative min-h-fit py-6 mb-16">
          <div className="absolute left-0 top-0 z-[-1] h-full w-full bg-gradient-to-r from-pink-300 to-sky-200 opacity-30 dark:from-pink-700 dark:to-sky-500/30 rounded-3xl"></div>
          <div className="container mx-auto">
            <div className="w-full px-4">
              <h1 className="text-center text-2xl font-bold mb-8 text-gray-800 dark:text-gray-200 sm:text-3xl lg:text-4xl">
                Invite & Earn: AIML Training Referral Program
              </h1>
              
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Content */}
                <div className="flex-1">
                  <div className="max-w-[700px]">
                    <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200 md:text-lg mb-6 opacity-90">
                      We're excited to launch our Referral Program exclusively for our current and previously enrolled candidates of the AIML Training Program at Whitebox Learning.
                    </p>
                    <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200 md:text-lg mb-6 opacity-90">
                      Do you know someone — a friend, associate, or family member — who's passionate about Artificial Intelligence and Machine Learning?
                    </p>
                    <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200 md:text-lg mb-6 opacity-90">
                      Refer them to our AIML training program and help them kickstart a transformative career in tech. As a token of appreciation, you will receive a referral bonus for every successful enrollment made through your reference.
                    </p>
                  </div>
                  
                  <div className="space-y-6 mb-8">
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-lg dark:bg-gray-800/80">
                      <div className="flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-primary mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9,5A4,4 0 0,1 13,9A4,4 0 0,1 9,13A4,4 0 0,1 5,9A4,4 0 0,1 9,5M9,15C11.67,15 17,16.34 17,19V21H1V19C1,16.34 6.33,15 9,15M16.76,5.36C18.78,7.56 18.78,10.61 16.76,12.63L15.08,10.94C15.92,9.76 15.92,8.23 15.08,7.05L16.76,5.36M20.07,2C24,6.05 23.97,12.11 20.07,16L18.44,14.37C21.21,11.19 21.21,6.65 18.44,3.63L20.07,2Z"/>
                        </svg>
                        <h3 className="text-xl font-bold text-primary">How It Works:</h3>
                      </div>
                      <div className="text-left text-gray-800 dark:text-gray-200 space-y-3 opacity-90">
                        <p>• Share your referral's name and contact details with us.</p>
                        <p>• Upon their successful enrollment, you receive your referral bonus.</p>
                        <p>• No limits — refer as many as you'd like!</p>
                      </div>
                    </div>
                    
                    <div className="rounded-xl bg-white/80 backdrop-blur-sm p-6 shadow-lg dark:bg-gray-800/80">
                      <div className="flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-primary mr-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z"/>
                        </svg>
                        <h3 className="text-xl font-bold text-primary">Eligibility:</h3>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200 opacity-90">
                        Referral bonus is applicable only for existing or past enrolled candidates of the AIML program.
                      </p>
                    </div>
                  </div>

                  <div className="text-center space-y-6 pb-8">
                    <div className="flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-primary mr-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
                      </svg>
                      <p className="text-xl font-bold text-gray-800 dark:text-gray-200 opacity-90">Let's grow the community together!</p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/20">
                      <div className="flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-primary mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4M20,8L12,13L4,8V6L12,11L20,6V8Z"/>
                        </svg>
                        <svg className="w-6 h-6 text-primary ml-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6.62,10.79C8.06,13.62 10.38,15.94 13.21,17.38L15.41,15.18C15.69,14.9 16.08,14.82 16.43,14.93C17.55,15.3 18.75,15.5 20,15.5A1,1 0 0,1 21,16.5V20A1,1 0 0,1 20,21A17,17 0 0,1 3,4A1,1 0 0,1 4,3H7.5A1,1 0 0,1 8.5,4C8.5,5.25 8.7,6.45 9.07,7.57C9.18,7.92 9.1,8.31 8.82,8.59L6.62,10.79Z"/>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-800 dark:text-gray-200 opacity-90">
                        For referrals, please contact us at:{" "}
                        <a href="mailto:recruiting@whitebox-learning.com" className="underline hover:no-underline text-primary">
                          recruiting@whitebox-learning.com
                        </a>{" "}
                        |{" "}
                        <a href="tel:925-557-1053" className="underline hover:no-underline text-primary">
                          925-557-1053
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Form */}
                <div className="flex-1 lg:max-w-md">
                  <ReferralFormInline />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default ReferAndEarnPage;
