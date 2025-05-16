// "use client";
// import ContactDetails from "./ContactDetails";
// import React, { useState } from "react";

// const   ContactForm = () => {
//   const initialFormData = {
//     name: "",
//     email: "",
//     phone: "",
//     message: "",
//   };

//   const [formData, setFormData] = useState(initialFormData);
//   const [submitting, setSubmitting] = useState(false);
//   const [messageFromServer, setMessageFromServer] = useState("");
//   const [messageType, setMessageType] = useState(null);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Validate form fields
//     if (
//       formData.name.trim() === "" ||
//       formData.email.trim() === "" ||
//       formData.phone.trim() === "" ||
//       formData.message.trim() === ""
//     ) {
//       alert("Please fill out all fields.");
//       return;
//     }

//     try {
//       setSubmitting(true);

//       const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/contact`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(formData),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         // Clear form and show success message
//         setFormData(initialFormData);
//         setMessageFromServer(data.detail);
//         setMessageType("success");
//       } else {
//         // Handle server error
//         setMessageFromServer(data.detail);
//         setMessageType("error");
//       }
//     } catch (error) {
//       console.error("Error sending message:", error);
//       setMessageFromServer("Please try again later.");
//       setMessageType("error");
//     } finally {
//       setSubmitting(false);
//       // Reset form fields in both success and error cases
//       setFormData(initialFormData);
//     }
//   };

//   const handleChange = (e) => {
//     setFormData({
//       ...formData,
//       [e.target.name]: e.target.value,
//     });
//   };
//   const handleCloseMessage = () => {
//     setMessageFromServer("");
//   };

//   const handleInputFocus = () => {
//     setMessageFromServer("");
//   };

//   return (
//     <section id="contact" className="w-full overflow-hidden pb-16">
//       <div className="container">
//         <div className="-mx-4 flex flex-wrap">
//           <div className="w-full lg:w-7/12  xl:w-8/12">
//             <div className="wow fadeInUp rounded-2xl " data-wow-delay=".15s">
//               <div className="flex min-h-screen  flex-col justify-start py-6 sm:justify-center sm:py-4">
//                 <div className="relative py-3 sm:mx-auto sm:max-w-md xl:w-1/2">
//                   <div className="absolute inset-0  hidden -skew-y-6 transform bg-gradient-to-r from-indigo-300 to-purple-400 shadow-lg dark:bg-gradient-to-r dark:from-indigo-700 dark:to-purple-500 sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl md:block"></div>
//                   <div className="relative rounded-3xl bg-gradient-to-br from-pink-400 to-sky-200 px-10 py-10 text-white shadow-lg dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500 sm:p-16">
//                     <div className="pb-10 text-center">
//                       <div className=" text-lg font-bold text-black dark:text-white sm:text-2xl md:text-3xl">
//                         Get in touch!
//                       </div>
//                       <p className="md:text-md text-xs font-semibold text-gray-700 dark:text-gray-300 sm:text-sm ">
//                         We&apos;d love to hear from you.
//                       </p>
//                       <p className="md:text-md text-xs font-semibold text-gray-700 dark:text-gray-300 sm:text-sm">
//                         Fill up the form below to send us a message.
//                       </p>
//                     </div>
//                     <form
//                       onSubmit={handleSubmit}
//                       className="md:text-md text-xs text-black dark:text-white sm:text-sm"
//                       method="post"
//                     >
//                       <label htmlFor="name" className="mb-2 block font-bold">
//                         Name:
//                       </label>{" "}
//                       <input
//                         className=" mb-4 w-full  rounded-3xl bg-white py-3 px-5 leading-tight text-gray-700 shadow "
//                         type="text"
//                         placeholder="Enter Your Name"
//                         name="name"
//                         value={formData.name}
//                         onChange={handleChange}
//                         onFocus={handleInputFocus}
//                       />
//                       <label htmlFor="email" className="mb-2 block font-bold">
//                         Email:
//                       </label>
//                       <input
//                         className="  mb-4 w-full appearance-none rounded-3xl bg-white py-3 px-5 leading-tight text-gray-700"
//                         type="email"
//                         placeholder="Enter Your Email"
//                         name="email"
//                         value={formData.email}
//                         onChange={handleChange}
//                         onFocus={handleInputFocus}
//                       />
//                       <label htmlFor="phone" className="mb-2 block font-bold">
//                         Phone:
//                       </label>
//                       <input
//                         className="mb-4 w-full appearance-none rounded-3xl bg-white py-3 px-5 leading-tight text-gray-700 shadow"
//                         type="tel"
//                         placeholder="Enter Your Phone"
//                         name="phone"
//                         value={formData.phone}
//                         onChange={handleChange}
//                         onFocus={handleInputFocus}
//                       />
//                       <label htmlFor="message" className="mb-2 block font-bold">
//                         Message:
//                       </label>
//                       <textarea
//                         className="mb-4 h-64 min-h-0 w-full appearance-none rounded-3xl bg-white py-2 px-3 leading-tight text-gray-700 shadow"
//                         placeholder="Type your message here..."
//                         name="message"
//                         style={{ height: "121px" }}
//                         value={formData.message}
//                         onChange={handleChange}
//                         onFocus={handleInputFocus}
//                       ></textarea>
//                       <div className="mt-5 flex justify-between  gap-3 md:gap-5">
//                         <input
//                           className="md:text-md w-36 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-200 p-1 py-2  px-1 text-[11px] font-bold text-black hover:bg-indigo-700 hover:from-indigo-500 hover:to-indigo-200 dark:text-white sm:py-2 sm:px-4 sm:text-sm"
//                           type="submit"
//                           value={submitting ? "Sending..." : "Send ➤"}
//                           disabled={submitting}
//                         />
//                         <input
//                           className="md:text-md w-36 rounded-lg bg-gradient-to-br from-red-500 to-red-200 p-1 px-1 text-[11px] font-bold text-black shadow-xl hover:bg-red-700 hover:bg-gradient-to-tl hover:from-red-500 hover:to-red-200 dark:text-white sm:py-2 sm:px-4 sm:text-sm"
//                           type="reset"
//                           value="Reset"
//                           onClick={() => {
//                             setFormData(initialFormData);
//                             setMessageFromServer("");
//                             setMessageType(null);
//                           }}
//                         />
//                       </div>
//                       {messageFromServer && (
//                         <div
//                           className={`${
//                             messageType === "success"
//                               ? "border-green-400 bg-green-100 text-green-700"
//                               : "border-red-400 bg-red-100 text-red-700"
//                           } relative mt-4 flex items-center justify-between rounded-xl px-2 py-1 text-sm sm:px-3 sm:py-1 sm:text-base`}
//                           role="alert"
//                         >
//                           <div>
//                             <strong className="font-bold">
//                               {messageType === "success" ? "Success" : "Error"}{" "}
//                               -{" "}
//                             </strong>
//                             <span className="">{messageFromServer}</span>
//                           </div>
//                           <button
//                             onClick={handleCloseMessage}
//                             className="ml-4 bg-transparent text-lg font-bold text-red-700 hover:text-red-900"
//                           >
//                             &times;
//                           </button>
//                         </div>
//                       )}
//                     </form>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//           {/* ContactDetails component */}
//           <div className="mx-auto  flex items-center justify-center py-3 sm:mx-auto sm:max-w-2xl lg:w-5/12 xl:w-4/12">
//             {/* Assuming ContactDetails component shows contact information */}
//             <ContactDetails />
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default ContactForm;

"use client";
import ContactDetails from "./ContactDetails";
import React, { useState } from "react";

const ContactForm = () => {
  const initialFormData = {
    name: "",
    email: "",
    phone: "",
    message: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [messageFromServer, setMessageFromServer] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form fields
    if (
      formData.name.trim() === "" ||
      formData.email.trim() === "" ||
      formData.phone.trim() === "" ||
      formData.message.trim() === ""
    ) {
      setMessageFromServer("Please fill out all fields.");
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
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Clear form and show success message
        setFormData(initialFormData);
        setMessageFromServer(data.detail);
        setMessageType("success");
      } else {
        // Handle server error
        setMessageFromServer(data.detail);
        setMessageType("error");
      }
    } catch (error) {
      // console.error("Error sending message:", error);
      setMessageFromServer("Please try again later.");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
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
    <section id="contact" className="w-full overflow-hidden pb-16">
      <div className="container">
        <div className="-mx-4 flex flex-wrap">
          <div className="w-full lg:w-7/12  xl:w-8/12">
            <div className="wow fadeInUp rounded-2xl " data-wow-delay=".15s">
              <div className="flex min-h-screen  flex-col justify-start py-6 sm:justify-center sm:py-4">
                <div className="relative py-3 sm:mx-auto sm:max-w-md xl:w-1/2">
                  <div className="absolute inset-0  hidden -skew-y-6 transform bg-gradient-to-r from-indigo-300 to-purple-400 shadow-lg dark:bg-gradient-to-r dark:from-indigo-700 dark:to-purple-500 sm:-rotate-6 sm:skew-y-0 sm:rounded-3xl md:block"></div>
                  <div className="relative rounded-3xl bg-gradient-to-br from-pink-400 to-sky-200 px-10 py-10 text-white shadow-lg dark:bg-gradient-to-br dark:from-pink-700 dark:to-sky-500 sm:p-16">
                    <div className="pb-10 text-center">
                      <div className=" text-lg font-bold text-black dark:text-white sm:text-2xl md:text-3xl">
                        Get in touch!
                      </div>
                      <p className="md:text-md text-xs font-semibold text-gray-700 dark:text-gray-300 sm:text-sm ">
                        We&apos;d love to hear from you.
                      </p>
                      <p className="md:text-md text-xs font-semibold text-gray-700 dark:text-gray-300 sm:text-sm">
                        Fill up the form below to send us a message.
                      </p>
                    </div>
                    <form
                      onSubmit={handleSubmit}
                      className="md:text-md text-xs text-black dark:text-white sm:text-sm"
                      method="post"
                    >
                      <label htmlFor="name" className="mb-2 block font-bold">
                        Name:
                      </label>{" "}
                      <input
                        className=" mb-4 w-full  rounded-xl bg-white py-3 px-5 leading-tight text-gray-700 shadow "
                        type="text"
                        placeholder="Enter Your Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={handleInputFocus}
                      />
                      <label htmlFor="email" className="mb-2 block font-bold">
                        Email:
                      </label>
                      <input
                        className="  mb-4 w-full appearance-none rounded-xl bg-white py-3 px-5 leading-tight text-gray-700"
                        type="email"
                        placeholder="Enter Your Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={handleInputFocus}
                      />
                      <label htmlFor="phone" className="mb-2 block font-bold">
                        Phone:
                      </label>
                      <input
                        className="mb-4 w-full appearance-none rounded-xl bg-white py-3 px-5 leading-tight text-gray-700 shadow"
                        type="tel"
                        placeholder="Enter Your Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        onFocus={handleInputFocus}
                      />
                      <label htmlFor="message" className="mb-2 block font-bold">
                        Message:
                      </label>
                      <textarea
                        className="mb-4 h-64 min-h-0 w-full appearance-none rounded-xl bg-white py-2 px-3 leading-tight text-gray-700 shadow"
                        placeholder="Type your message here..."
                        name="message"
                        style={{ height: "121px" }}
                        value={formData.message}
                        onChange={handleChange}
                        onFocus={handleInputFocus}
                      ></textarea>
                      <div className="mt-5 flex justify-between  gap-3 md:gap-5">
                        <input
                          className="md:text-md w-36 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-200 p-1 py-2  px-1 text-[11px] font-bold text-black hover:bg-indigo-700 hover:from-indigo-500 hover:to-indigo-200 dark:text-white sm:py-2 sm:px-4 sm:text-sm"
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
                              {messageType === "success" ? "Success" : "Error"}{" "}
                              -{" "}
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
          {/* ContactDetails component */}
          <div className="mx-auto  flex items-center justify-center py-3 sm:mx-auto sm:max-w-2xl lg:w-5/12 xl:w-4/12">
            {/* Assuming ContactDetails component shows contact information */}
            <ContactDetails />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
