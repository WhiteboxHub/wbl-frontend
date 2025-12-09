
"use client";
import ContactDetails from "./ContactDetails";
import React, { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

const ContactForm = () => {
  const initialFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [messageFromServer, setMessageFromServer] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isCaptchaLoaded, setIsCaptchaLoaded] = useState(false);
  const captchaRef = useRef<HTMLDivElement>(null);

  // Load reCAPTCHA v2 script
  useEffect(() => {
    const loadRecaptcha = () => {
      if (typeof window !== 'undefined' && !window.grecaptcha) {
        window.onRecaptchaLoad = () => {
          setIsCaptchaLoaded(true);
          console.log('reCAPTCHA v2 loaded successfully');
        };

        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit`;
        script.async = true;
        script.defer = true;
        script.onerror = () => {
          console.error('Failed to load reCAPTCHA');
        };
        document.head.appendChild(script);
      } else {
        setIsCaptchaLoaded(true);
      }
    };

    loadRecaptcha();
  }, []);

  // Render reCAPTCHA v2 widget
  useEffect(() => {
    if (isCaptchaLoaded && window.grecaptcha && captchaRef.current) {
      window.grecaptcha.render(captchaRef.current, {
        sitekey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
        callback: (token: string) => {
          setCaptchaToken(token);
        },
        'expired-callback': () => {
          setCaptchaToken(null);
        },
        'error-callback': () => {
          setCaptchaToken(null);
        },
      });
    }
  }, [isCaptchaLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      formData.firstName.trim() === "" ||
      formData.lastName.trim() === "" ||
      formData.email.trim() === "" ||
      formData.phone.trim() === "" ||
      formData.message.trim() === ""
    ) {
      setMessageFromServer("Please fill out all fields.");
      setMessageType("error");
      return;
    }

    if (!captchaToken) {
      setMessageFromServer("Please complete the CAPTCHA.");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...formData, captcha_token: captchaToken }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setFormData(initialFormData);
        setMessageFromServer(data.detail);
        setMessageType("success");
        // Reset CAPTCHA
        if (window.grecaptcha) {
          window.grecaptcha.reset();
        }
        setCaptchaToken(null);
      } else {
        setMessageFromServer(data.detail);
        setMessageType("error");
        // Reset CAPTCHA on error
        if (window.grecaptcha) {
          window.grecaptcha.reset();
        }
        setCaptchaToken(null);
      }
    } catch (error) {
      setMessageFromServer("Please try again later.");
      setMessageType("error");
      // Reset CAPTCHA on error
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
      setCaptchaToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCloseMessage = () => {
    setMessageFromServer("");
    setMessageType(null);
  };

  const handleInputFocus = () => {
    setMessageFromServer("");
    setMessageType(null);
  };

  return (
    <section id="contact" className="w-full overflow-hidden pb-10 xl:w-2xl -mt-14">
      <div className="container">
        <div className="-mx-2 flex flex-wrap">
          <div className="w-full lg:w-7/12 xl:w-8/12">
            <div className="wow fadeInUp rounded-2xl" data-wow-delay=".15s">
              <div className="flex flex-col justify-start py-8">
                <div className="relative py-0 sm:mx-auto sm:max-w-2xl xl:w-full">
                  <div className="absolute inset-0 hidden -skew-y-6 transform bg-gradient-to-r from-indigo-300 to-purple-400 shadow-lg dark:bg-gradient-to-r dark:from-indigo-700 dark:to-purple-500 sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl md:block"></div>
                  <div className="relative rounded-3xl bg-gradient-to-br from-pink-400 to-sky-200 px-8 py-5 text-white shadow-lg dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500 sm:p-16 xl:px-14 xl:py-8 lg:px-16 lg:py-10">
                    <div className="pb- text-center">
                      <div className="text-lg font-bold text-black dark:text-white sm:text-2xl md:text-3xl">
                        Get in touch!
                      </div>
                      <p className="md:text-md text-xs font-semibold text-gray-700 dark:text-gray-300 sm:text-sm">
                        We'd love to hear from you.
                      </p>
                      <p className="md:text-md text-xs font-semibold text-gray-700 dark:text-gray-300 sm:text-sm pb-6">
                        Fill up the form below to send us a message.
                      </p>
                    </div>

                    <form
                      onSubmit={handleSubmit}
                      className="md:text-md text-xs text-black dark:text-white sm:text-sm"
                      method="post"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="firstName" className="mb-2 block font-bold">
                            First Name:
                          </label>
                          <input
                            className="mb-4 w-full rounded-xl bg-white py-3 px-5 leading-tight text-gray-700 shadow"
                            type="text"
                            placeholder="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            onFocus={handleInputFocus}
                          />
                        </div>

                        <div>
                          <label htmlFor="lastName" className="mb-2 block font-bold">
                            Last Name:
                          </label>
                          <input
                            className="mb-4 w-full rounded-xl bg-white py-3 px-5 leading-tight text-gray-700 shadow"
                            type="text"
                            placeholder="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            onFocus={handleInputFocus}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label htmlFor="email" className="mb-2 block font-bold">
                            Email:
                          </label>
                          <input
                            className="mb-4 w-full rounded-xl bg-white py-3 px-5 leading-tight text-gray-700 shadow"
                            type="email"
                            placeholder="Your Email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={handleInputFocus}
                          />
                        </div>

                        <div>
                          <label htmlFor="phone" className="mb-2 block font-bold">
                            Phone:
                          </label>
                          <input
                            className="mb-4 w-full rounded-xl bg-white py-3 px-5 leading-tight text-gray-700 shadow"
                            type="tel"
                            placeholder="Your Phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onFocus={handleInputFocus}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="mb-2 block font-bold">
                          Message:
                        </label>
                        <textarea
                          className="mb-4 h-20 w-full rounded-xl bg-white py-3 px-5 leading-tight text-gray-700 shadow"
                          placeholder="Tell about yourself..."
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          onFocus={handleInputFocus}
                        ></textarea>
                      </div>

                      {/* CAPTCHA Section - V2 (Checkbox) */}
                      <div className="mb-4">
                        <label className="mb-2 block font-bold">
                          Security Verification <span className="text-[red]">*</span>
                        </label>
                        <div className="flex items-center justify-center">
                          <div 
                            ref={captchaRef}
                            id="g-recaptcha"
                            className="g-recaptcha"
                          ></div>
                        </div>
                        {!captchaToken && (
                          <p className="mt-2 text-sm text-red-600">

                          </p>
                        )}
                        <div className="mt-2 text-center text-xs text-gray-600 dark:text-gray-300">
                          <p>This site is protected by reCAPTCHA and the Google</p>
                          <p>
                            <a href="https://policies.google.com/privacy" className="text-primary hover:underline">Privacy Policy</a> and
                            <a href="https://policies.google.com/terms" className="text-primary hover:underline"> Terms of Service</a> apply.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex justify-between gap-3 md:gap-5">
                        <input
                          className="md:text-md w-36 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-200 p-1 py-2 px-1 text-[11px] font-bold text-black hover:bg-indigo-700 hover:from-indigo-500 hover:to-indigo-200 dark:text-white sm:py-2 sm:px-4 sm:text-sm"
                          type="submit"
                          value={submitting ? "Sending..." : "Send ➤"}
                          disabled={submitting}
                        />
                        <input
                          className="md:text-md w-36 rounded-lg bg-gradient-to-br from-red-500 to-red-200 p-1 px-1 text-[11px] font-bold text-black shadow-xl hover:bg-red-700 hover:bg-gradient-to-tl hover:from-red-500 hover:to-red-200 dark:text-white sm:py-2 sm:px-4 sm:text-sm"
                          type="reset"
                          value="Reset"
                          onClick={() => {
                            setFormData(initialFormData);
                            setMessageFromServer("");
                            setMessageType(null);
                            if (window.grecaptcha) {
                              window.grecaptcha.reset();
                            }
                            setCaptchaToken(null);
                          }}
                        />
                      </div>

                      {messageFromServer && (
                        <div
                          className={`${
                            messageType === "success"
                              ? "border-green-400 bg-green-100 text-green-700"
                              : "border-red-400 bg-red-100 text-red-700"
                          } relative mt-4 flex items-center justify-between rounded-xl px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base`}
                          role="alert"
                        >
                          <div>
                            <strong className="font-bold">
                              {messageType === "success" ? "Success" : "Error"} -{" "}
                            </strong>
                            <span className="">{messageFromServer}</span>
                          </div>
                          <button
                            onClick={handleCloseMessage}
                            className="ml-4 bg-transparent text-lg font-bold text-red-700 hover:text-red-900"
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
          </div>

          <div className="mx-auto flex items-center justify-center py-3 sm:mx-auto sm:max-w-2xl lg:w-5/12 xl:w-4/12">
            <ContactDetails />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;