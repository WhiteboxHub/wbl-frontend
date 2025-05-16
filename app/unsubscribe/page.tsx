"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Common/Layout";

export default function Unsubscribe() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract email from the query parameter
    const queryEmail = new URLSearchParams(window.location.search).get("email");
    if (queryEmail) {
      setEmail(decodeURIComponent(queryEmail));

      // Trigger the unsubscribe action immediately
      const unsubscribe = async () => {
        setLoading(true);
        setMessage("");
        try {
          const response = await axios.put(
            `${process.env.NEXT_PUBLIC_API_URL}/unsubscribe`,
            { email: decodeURIComponent(queryEmail) }
          );
          setMessage(response.data.message);
        } catch (error) {
          setMessage(error.response?.data?.detail || "An error occurred");
        } finally {
          setLoading(false);
        }
      };

      unsubscribe();
    }
  }, []);

  return (
    <div>
      <main className="container px-4 pb-6 sm:px-6">
        {/* Navbar */}
        <nav className="mt-16 flex h-24 flex-col justify-center text-center sm:mt-28 sm:mb-3 sm:h-28 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
            Unsubscribe
          </h1>
          <div className="hidden sm:block">
            <Layout currentPage="Unsubscribe" />
          </div>
        </nav>

        {/* Main content */}
        <div className="flex h-96 flex-col items-center justify-center">
          <div className="w-full max-w-md rounded-3xl bg-gray-400 p-8 shadow-md dark:bg-gray-800">
            <div className="mb-6 text-center text-sm sm:text-lg">
              <div className="my-5 pb-4 text-lg font-extrabold sm:text-xl lg:text-2xl">
                We&apos;re sorry to see you go 😞
              </div>{" "}
              Please wait while we process your request to unsubscribe from our
              mailing list.
            </div>
            <div className="mb-4 text-center text-xs font-bold sm:text-sm lg:text-base">
              Email:{" "}
              <span className="text-blue-700 dark:text-blue-400">{email}</span>
            </div>
            {loading ? (
              <p className="mt-4 text-center text-white">
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
              </p>
            ) : (
              message && (
                <p className="mt-4 text-center text-white">{message}</p>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
