"use client";
import React, { useState } from "react";
import { useAuth } from "@/utils/AuthContext";

interface ReferralFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReferralForm: React.FC<ReferralFormProps> = ({ isOpen, onClose }) => {
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
  const [responseStatus, setResponseStatus] = useState("");

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
        // Close form after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 pt-24 pb-24">
      <div className="relative max-h-[calc(100vh-200px)] w-full max-w-xs overflow-y-auto rounded-2xl bg-gradient-to-br from-pink-400 to-sky-200 p-4 dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500/30 sm:max-w-sm sm:p-5 my-2">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl font-bold text-black hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
        >
          ×
        </button>

        <h3 className="mb-2 text-center text-base font-bold text-black dark:text-white sm:text-lg">
          🎯 Refer a Candidate
          <br />
          <span className="text-sm sm:text-base">
            Help someone start their AIML journey
          </span>
        </h3>

        <p className="mb-4 text-center text-xs font-semibold text-gray-700 dark:text-white sm:mb-5 sm:text-sm">
          Fill in the candidate's details below
        </p>

        <form onSubmit={handleSubmit} className="text-xs text-black dark:text-white sm:text-sm">
          {/* Full Name */}
          <div className="mb-3 sm:mb-4">
            <label htmlFor="full_name" className="mb-3 block font-bold text-dark dark:text-white">
              Full Name <span className="text-[red]">*</span>
            </label>
            <input
              type="text"
              name="full_name"
              placeholder="Enter candidate's full name"
              className="w-full rounded-3xl border py-2 px-5 text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:border-transparent sm:py-3"
              value={formData.full_name}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              required
            />
          </div>

          {/* Email */}
          <div className="mb-3 sm:mb-4">
            <label htmlFor="email" className="mb-3 block font-bold text-dark dark:text-white">
              Email Address <span className="text-[red]">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter candidate's email"
              className="w-full rounded-3xl border border-transparent py-2 px-5 text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
              value={formData.email}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              required
            />
          </div>

          {/* Phone */}
          <div className="mb-3 sm:mb-4">
            <label htmlFor="phone" className="mb-3 block font-bold text-dark dark:text-white">
              Phone Number <span className="text-[red]">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter candidate's phone number"
              className="w-full rounded-3xl border py-2 px-5 text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
              value={formData.phone}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              required
            />
          </div>

          {/* Work Status */}
          <div className="mb-3 sm:mb-4">
            <label htmlFor="workstatus" className="mb-3 block font-bold text-dark dark:text-white">
              Work Status
            </label>
            <select
              name="workstatus"
              className="w-full rounded-3xl border py-2 px-5 text-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
              value={formData.workstatus}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
            >
              <option value="">Select work status</option>
              <option value="employed">Currently Employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="student">Student</option>
              <option value="freelancer">Freelancer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Address */}
          <div className="mb-3 sm:mb-4">
            <label htmlFor="address" className="mb-3 block font-bold text-dark dark:text-white">
              Address
            </label>
            <input
              type="text"
              name="address"
              placeholder="Enter candidate's address"
              className="w-full rounded-3xl border border-transparent py-2 px-5 text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
              value={formData.address}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
            />
          </div>

          {/* Additional Notes */}
          <div className="mb-3 sm:mb-4">
            <label htmlFor="notes" className="mb-3 block font-bold text-dark dark:text-white">
              Additional Notes
            </label>
            <textarea
              name="notes"
              placeholder="Any additional information about the candidate"
              rows={3}
              className="w-full rounded-3xl border border-transparent py-2 px-5 text-body-color placeholder-body-color shadow-one outline-none focus:border-primary focus-visible:shadow-none dark:bg-white sm:py-3"
              value={formData.notes}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
            />
          </div>

          {/* Submit Button */}
          {loading ? (
            <div className="mb-4 text-center text-sm font-medium text-black dark:text-white sm:text-xl">
              Submitting&nbsp;
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="inline h-[30px] w-[30px] text-black dark:text-white sm:h-[40px] sm:w-[40px]"
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
              className="flex w-full items-center justify-center rounded-3xl bg-primary py-2 px-6 text-sm font-medium text-white transition duration-300 ease-in-out hover:bg-opacity-80 hover:shadow-signUp sm:py-3 sm:text-base"
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
                className="ml-4 bg-transparent text-lg font-bold hover:opacity-75 focus:outline-none"
              >
                &times;
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ReferralForm;
