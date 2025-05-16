// // "use client";
// // import Handlebars from "handlebars";
// // import Layout from "@/components/Common/Layout";
// // import Modal from "@/components/Common/Modal";
// // import React, { useCallback, useEffect, useMemo, useState } from "react";
// // import ResumePreview from "./ResumeView";
// // import debounce from "lodash/debounce";
// // import moment from "moment";
// // import { countries } from "country-data";
// // import { useRouter } from "next/navigation";
// // import { isAuthenticated } from "@/utils/auth";

// // // Cache for partials
// // const partialCache = {};

// // // Optimized fetchPartials function
// // const fetchPartials = async (partialsNeeded) => {
// //   const partials = [
// //     "about",
// //     "basics",
// //     "education",
// //     "info-tag",
// //     "languages",
// //     "resume-header",
// //     "skills",
// //     "summary",
// //     "social",
// //     "title",
// //     "work",
// //     "section-header",
// //   ];

// //   const partialPromises = partialsNeeded.map(async (partial) => {
// //     // Use the cache if the partial has been fetched already
// //     if (!partialCache[partial]) {
// //       try {
// //         const response = await fetch(`/templates/partials/${partial}.hbs`);
// //         if (!response.ok) {
// //           throw new Error(`Failed to fetch ${partial}.hbs`);
// //         }
// //         const partialString = await response.text();
// //         Handlebars.registerPartial(partial, partialString);
// //         partialCache[partial] = partialString; // Cache the result
// //       } catch (error) {
// //         console.error(`Error fetching partial: ${partial}`, error);
// //       }
// //     }
// //   });

// //   await Promise.all(partialPromises);
// // };

// // const registerHelpers = () => {
// //   Handlebars.registerHelper({
// //     removeProtocol: (url) => url.replace(/.*?:\/\//g, ""),
// //     concat: (...args) => args.filter((arg) => typeof arg !== "object").join(""),
// //     formatAddress: (...args) =>
// //       args.filter((arg) => typeof arg !== "object").join(" "),
// //     formatDate: (date) => moment(date).format("MM/YYYY"),
// //     lowercase: (s) => s.toLowerCase(),
// //     eq: (a, b) => a === b,
// //   });
// // };

// // const skillLevels = ["Beginner", "Intermediate", "Advanced", "Master"];
// // const fluencyLevels = ["Beginner", "Intermediate", "Advanced", "Fluent"];

// // export default function Assignment() {
// //   const [activeSection, setActiveSection] = useState("basics");
// //   const [skills, setSkills] = useState([{ name: "", level: "" }]);
// //   const [renderedHtml, setRenderedHtml] = useState<string>("");
// //   const [currentFormIndex, setCurrentFormIndex] = useState<number>(0);
// //   const [languages, setLanguages] = useState([{ language: "", fluency: "" }]);
// //   const router = useRouter();
// //   const [loading, setLoading] = useState(true);
// //   const [phoneNumber, setPhoneNumber] = useState("");
// //   const [countryCode, setCountryCode] = useState("+1");
// //   const [fullPhoneNumber, setFullPhoneNumber] = useState(
// //     `${countryCode}${phoneNumber}`
// //   );
// //   const [errorMessage, setErrorMessage] = useState("");
// //   const [showModal, setShowModal] = useState(false);
// //   const [basics, setBasics] = useState({
// //     name: "",
// //     label: "",
// //     email: "",
// //     phone: "",
// //     url: "",
// //     summary: "",
// //     location: {
// //       address: "",
// //       postalCode: "",
// //       city: "",
// //       countryCode: "",
// //     },
// //     profiles: [{ network: "", username: "", url: "" }],
// //   });
// //   const [workEntries, setWorkEntries] = useState([
// //     {
// //       company: "",
// //       position: "",
// //       startDate: "",
// //       endDate: "",
// //       summary: "",
// //       highlights: [""],
// //     },
// //   ]);
// //   const [educationEntries, setEducationEntries] = useState([
// //     {
// //       institution: "",
// //       degree: "",
// //       startDate: "",
// //       endDate: "",
// //       summary: "",
// //     },
// //   ]);
// //   const validateDate = (index) => {
// //     const entry = educationEntries[index];
// //     if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) {
// //       alert("End date cannot be earlier than the start date.");
// //     }
// //   };

// //   //for adding previous and next buttons in the work section

// //   const handlePrevious = () => {
// //     setCurrentFormIndex((prevIndex) => Math.max(prevIndex - 1, 0));
// //   };

// //   const handleNext = () => {
// //     setCurrentFormIndex((prevIndex) =>
// //       Math.min(prevIndex + 1, workEntries.length - 1)
// //     );
// //   };

// //   // Handle country code change
// //   const handleCountryChange = (e) => {
// //     const selectedValue = e.target.value; // e.g., +1-US
// //     const newCountryCode = selectedValue.split("-")[0]; // Extract only the country code part

// //     // Remove the old country code from the full phone number and add the new country code
// //     const newFullPhoneNumber = `${newCountryCode}${phoneNumber}`;

// //     // Update the state with the new country code and full phone number
// //     setCountryCode(newCountryCode);
// //     setFullPhoneNumber(newFullPhoneNumber);

// //     // Optionally update the basics state for storing full phone details
// //     setBasics((prevBasics) => ({
// //       ...prevBasics,
// //       phone: newFullPhoneNumber, // Store full phone number with new country code
// //     }));
// //   };

// //   // Handle phone number change (this part updates the phone number input)
// //   const handlePhoneChange = (e) => {
// //     // Get the entered phone number part
// //     let enteredPhone = e.target.value.trim();

// //     // Update the phone number (without country code) in state
// //     setPhoneNumber(enteredPhone);

// //     // Combine with country code to form the full phone number
// //     const updatedFullPhoneNumber = `${countryCode}${enteredPhone}`;

// //     // Update the full phone number in state
// //     setFullPhoneNumber(updatedFullPhoneNumber);

// //     // Optionally update the basics state
// //     setBasics((prevBasics) => ({
// //       ...prevBasics,
// //       phone: updatedFullPhoneNumber, // Store the full number with country code
// //     }));
// //   };

// //   const handleInputChange = (index, field, value) => {
// //     setEducationEntries((prevEntries) =>
// //       prevEntries.map((entry, i) =>
// //         i === index ? { ...entry, [field]: value } : entry
// //       )
// //     );
// //   };

// //   const handleRemoveEntry = (index) => {
// //     setEducationEntries((prevEntries) =>
// //       prevEntries.filter((_, i) => i !== index)
// //     );
// //   };

// //   const handleAddEntry = () => {
// //     setEducationEntries((prevEntries) => [
// //       ...prevEntries,
// //       {
// //         institution: "",
// //         degree: "",
// //         startDate: "",
// //         endDate: "",
// //         summary: "",
// //       },
// //     ]);
// //   };

// //   const debouncedSetBasics = useMemo(() => debounce(setBasics, 100), []);

// //   const debouncedSetSkills = useMemo(() => debounce(setSkills, 100), []);

// //   const debouncedSetLanguages = useMemo(() => debounce(setLanguages, 100), []);

// //   // Debounced function using useMemo
// //   const debouncedSetWorkEntries = useMemo(
// //     () => debounce((newEntries) => setWorkEntries(newEntries), 100),
// //     []
// //   );

// //   const handleChange = (index, field, value) => {
// //     const updatedEntries = workEntries.map((entry, i) =>
// //       i === index ? { ...entry, [field]: value } : entry
// //     );
// //     debouncedSetWorkEntries(updatedEntries);
// //   };

// //   const handleHighlightChange = (index, highlightIndex, value) => {
// //     const updatedEntries = workEntries.map((entry, i) =>
// //       i === index
// //         ? {
// //             ...entry,
// //             highlights: entry.highlights.map((h, hi) =>
// //               hi === highlightIndex ? value : h
// //             ),
// //           }
// //         : entry
// //     );
// //     setWorkEntries(updatedEntries);
// //   };

// //   const handleAddWork = () => {
// //     const newEntry = {
// //       company: "",
// //       position: "",
// //       startDate: "",
// //       endDate: "",
// //       summary: "",
// //       highlights: [""],
// //     };
// //     setWorkEntries([...workEntries, newEntry]);
// //     setCurrentFormIndex(workEntries.length); // Show the new form
// //   };

// //   const handleRemoveWork = (index) => {
// //     if (workEntries.length > 1) {
// //       const updatedEntries = workEntries.filter((_, i) => i !== index);
// //       setWorkEntries(updatedEntries);
// //       if (currentFormIndex >= updatedEntries.length) {
// //         setCurrentFormIndex(updatedEntries.length - 1); // Ensure the form index is valid
// //       }
// //     }
// //   };

// //   const toggleSection = (section) => {
// //     setActiveSection(activeSection === section ? "" : section);
// //   };

// //   const resumeJson = {
// //     basics,
// //     work: workEntries,
// //     education: educationEntries,
// //     skills,
// //     languages,
// //   };

// //   const getJson = () => {
// //     const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
// //       JSON.stringify(resumeJson, null, 2)
// //     )}`;
// //     const link = document.createElement("a");
// //     link.href = jsonString;
// //     link.download = "resume_data.json";
// //     link.click();
// //   };

// //   // Lazy Loading and memoizing rendering for optimization
// //   const renderTemplate = useCallback(async () => {
// //     try {
// //       const partialsNeeded: string[] = [];
// //       if (basics)
// //         partialsNeeded.push(
// //           "about",
// //           "resume-header",
// //           "summary",
// //           "title",
// //           "info-tag",
// //           "social",
// //           "section-header"
// //         );
// //       if (workEntries.length > 0) partialsNeeded.push("work");
// //       if (educationEntries.length > 0) partialsNeeded.push("education");
// //       if (skills.length > 0) partialsNeeded.push("skills");
// //       if (languages.length > 0) partialsNeeded.push("languages");

// //       await fetchPartials(partialsNeeded); // Load only needed partials

// //       const response = await fetch("/templates/resume.hbs");
// //       if (!response.ok) {
// //         throw new Error("Failed to fetch resume.hbs");
// //       }
// //       const templateString = await response.text();
// //       const template = Handlebars.compile(templateString);

// //       const resume = {
// //         basics,
// //         work: workEntries,
// //         education: educationEntries,
// //         skills,
// //         languages,
// //       };

// //       const html = template(resume);
// //       setRenderedHtml(html);
// //     } catch (error) {
// //       console.error("Error rendering template", error);
// //     }
// //   }, [basics, workEntries, educationEntries, skills, languages]);

// //   useEffect(() => {
// //     registerHelpers();
// //     renderTemplate();
// //   }, [renderTemplate]);

// //   useEffect(() => {
// //     const checkAuthentication = async () => {
// //       try {
// //         const { valid } = await isAuthenticated();
// //         if (!valid) {
// //           router.push("/login");
// //         } else {
// //           setLoading(false);
// //         }
// //       } catch (error) {
// //         console.error("Error while checking authentication:", error);
// //         router.push("/login");
// //       }
// //     };

// //     checkAuthentication();
// //   }, [router]);

// //   const handleClose = () => {
// //     localStorage.removeItem("access_token");
// //     sessionStorage.clear();
// //     router.push("/login");
// //     return setShowModal(false);
// //   };
// //   return (
// //     <div>
// //       {/* ------------------------------------------button toogles------------------------------------------------ */}

// //       {/* --------------------------------------------------------------------------------------------------------- */}

// //       <main className="container mx-auto px-4 pb-6 dark:bg-gray-800 dark:text-white sm:px-6">
// //         <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
// //           <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
// //             Create Resume
// //           </h1>
// //           <div className="hidden sm:block">
// //             <Layout currentPage="Resume" />
// //           </div>
// //         </nav>
// //         <div className="grid grid-cols-1 gap-10 lg:grid-cols-8">
// //           <div className="col-span-1 lg:col-span-1">
// //             <ul className="space-y-2">
// //               {["Basics", "Work", "Education", "Skills", "Languages"].map(
// //                 (section) => (
// //                   <li key={section}>
// //                     <button
// //                       onClick={() => toggleSection(section.toLowerCase())}
// //                       className={`w-full border-l-4 px-4 py-2 text-left font-semibold transition-all ${
// //                         activeSection === section.toLowerCase()
// //                           ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
// //                           : "border-transparent text-gray-800 dark:text-gray-300"
// //                       }`}
// //                     >
// //                       {section}
// //                     </button>
// //                   </li>
// //                 )
// //               )}
// //             </ul>
// //           </div>
// //           {/* ------------------------------------------------------------------------------------------- */}

// //           <div className="space-y-6 lg:col-span-3">
// //             {/* ------------------------------------------------------------------------------------- */}
// //             {/* ------------------------------------------------------------------------------------- */}
// //             {activeSection === "basics" && (
// //               <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-md dark:border-gray-600 dark:bg-gray-700">
// //                 <h2 className="mb-4 text-xl font-bold">Basics</h2>
// //                 <div className="grid grid-cols-2 gap-4">
// //                   {["name", "label", "email"].map((field, index) => (
// //                     <div key={index}>
// //                       <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                         <strong>
// //                           {field.charAt(0).toUpperCase() + field.slice(1)}:
// //                         </strong>
// //                         <span className="text-red-500">*</span>
// //                       </label>
// //                       <input
// //                         type={field === "email" ? "email" : "text"}
// //                         placeholder={`Enter your ${field}`}
// //                         className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                         value={basics[field]}
// //                         onChange={(e) =>
// //                           debouncedSetBasics({
// //                             ...basics,
// //                             [field]: e.target.value,
// //                           })
// //                         }
// //                         required
// //                         pattern={
// //                           field === "email"
// //                             ? "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
// //                             : ".*"
// //                         }
// //                         title={
// //                           field === "email"
// //                             ? "Please enter a valid email address (example@domain.com)"
// //                             : ""
// //                         }
// //                       />
// //                     </div>
// //                   ))}

// //                   {/* Country Code and Phone Number */}
// //                   <div className="col-span-2 flex space-x-4">
// //                     <div className="w-1/4">
// //                       <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                         <strong>Phone:</strong>
// //                         <span className="text-red-500">*</span>
// //                       </label>
// //                       <div className="flex">
// //                         {/* Country Code Dropdown */}
// //                         <select
// //                           id="country-code"
// //                           name="country-code"
// //                           className="rounded-l-md border py-2 px-3 text-sm text-gray-700 shadow-one focus:outline-none dark:bg-black dark:text-gray-300"
// //                           value={countryCode}
// //                           onChange={handleCountryChange}
// //                           required
// //                         >
// //                           {countries.all.map((country) => (
// //                             <option
// //                               key={`${country.alpha2}-${country.name}`}
// //                               value={country.countryCallingCodes[0]}
// //                             >
// //                               {country.alpha2} {country.countryCallingCodes[0]}
// //                             </option>
// //                           ))}
// //                         </select>

// //                         {/* Phone Number Input */}
// //                         <input
// //                           type="tel"
// //                           placeholder="Enter your phone number"
// //                           className="rounded-r-md border border-gray-300 p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                           value={phoneNumber}
// //                           onChange={handlePhoneChange}
// //                           required
// //                           pattern="[0-9]{3,15}"
// //                           minLength={9}
// //                           maxLength={15}
// //                           title="Phone number must be between 9 and 15 digits"
// //                         />
// //                       </div>
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="mt-4">
// //                   <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                     <strong>Summary:</strong>
// //                     <span className="text-red-500">*</span>
// //                   </label>
// //                   <textarea
// //                     rows={4}
// //                     placeholder="Enter a summary"
// //                     className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                     value={basics.summary}
// //                     onChange={(e) =>
// //                       debouncedSetBasics({ ...basics, summary: e.target.value })
// //                     }
// //                     required
// //                   />
// //                 </div>

// //                 <div className="mt-4 grid grid-cols-2 gap-4">
// //                   {["address", "postalCode", "city", "countryCode"].map(
// //                     (field, index) => (
// //                       <div key={index}>
// //                         <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                           <strong>
// //                             {field.charAt(0).toUpperCase() + field.slice(1)}:
// //                           </strong>
// //                           <span className="text-red-500">*</span>
// //                         </label>
// //                         <input
// //                           type="text"
// //                           placeholder={`Enter your ${field}`}
// //                           className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                           value={basics.location[field]}
// //                           onChange={(e) =>
// //                             debouncedSetBasics({
// //                               ...basics,
// //                               location: {
// //                                 ...basics.location,
// //                                 [field]: e.target.value,
// //                               },
// //                             })
// //                           }
// //                           required
// //                           pattern={
// //                             field === "postalCode" ? "[0-9]{5,10}" : ".*"
// //                           }
// //                           title={
// //                             field === "postalCode"
// //                               ? "Postal code must be between 5 and 10 digits"
// //                               : ""
// //                           }
// //                         />
// //                       </div>
// //                     )
// //                   )}
// //                 </div>

// //                 {/* Profiles */}
// //                 <div className="mt-4">
// //                   <h3 className="mb-4 text-lg font-semibold">Profiles</h3>
// //                   {basics.profiles.map((profile, index) => (
// //                     <div key={index} className="mb-4">
// //                       <div className="flex items-end">
// //                         <button
// //                           className={`mr-2 rounded-full p-1 ${
// //                             index === 0
// //                               ? "cursor-not-allowed bg-gray-300"
// //                               : "bg-red-600 hover:bg-red-700"
// //                           }`}
// //                           onClick={() =>
// //                             debouncedSetBasics({
// //                               ...basics,
// //                               profiles: basics.profiles.filter(
// //                                 (_, i) => i !== index
// //                               ),
// //                             })
// //                           }
// //                           disabled={index === 0}
// //                         >
// //                           <svg
// //                             xmlns="http://www.w3.org/2000/svg"
// //                             className="h-4 w-4 text-white"
// //                             viewBox="0 0 20 20"
// //                             fill="currentColor"
// //                           >
// //                             <path
// //                               fillRule="evenodd"
// //                               d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
// //                               clipRule="evenodd"
// //                             />
// //                           </svg>
// //                         </button>
// //                         <div className="grid flex-grow grid-cols-3 items-end gap-4">
// //                           {/* Network Field as Select */}
// //                           <div>
// //                             <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                               <strong>Network:</strong>
// //                               <span className="text-red-500">*</span>
// //                             </label>
// //                             <select
// //                               className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                               value={profile.network}
// //                               onChange={(e) =>
// //                                 debouncedSetBasics({
// //                                   ...basics,
// //                                   profiles: basics.profiles.map((p, pIndex) =>
// //                                     pIndex === index
// //                                       ? { ...p, network: e.target.value }
// //                                       : p
// //                                   ),
// //                                 })
// //                               }
// //                               required
// //                             >
// //                               <option value="" disabled>
// //                                 Select network
// //                               </option>
// //                               <option value="GitHub">GitHub</option>
// //                               <option value="Instagram">Instagram</option>
// //                               <option value="Twitter">Twitter</option>
// //                               <option value="LinkedIn">LinkedIn</option>
// //                               {/* <option value="Naukri">Naukri</option> */}
// //                               <option value="Other">Other</option>
// //                             </select>
// //                           </div>
// //                           {/* Username Field */}
// //                           <div>
// //                             <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                               <strong>Username:</strong>
// //                               <span className="text-red-500">*</span>
// //                             </label>
// //                             <input
// //                               type="text"
// //                               placeholder="Enter your username"
// //                               className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                               value={profile.username}
// //                               onChange={(e) =>
// //                                 debouncedSetBasics({
// //                                   ...basics,
// //                                   profiles: basics.profiles.map((p, pIndex) =>
// //                                     pIndex === index
// //                                       ? { ...p, username: e.target.value }
// //                                       : p
// //                                   ),
// //                                 })
// //                               }
// //                               required
// //                             />
// //                           </div>
// //                           {/* URL Field */}
// //                           <div>
// //                             <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                               <strong>URL:</strong>
// //                               <span className="text-red-500">*</span>
// //                             </label>
// //                             <input
// //                               type="url"
// //                               placeholder="Enter your URL"
// //                               className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                               value={profile.url}
// //                               onChange={(e) =>
// //                                 debouncedSetBasics({
// //                                   ...basics,
// //                                   profiles: basics.profiles.map((p, pIndex) =>
// //                                     pIndex === index
// //                                       ? { ...p, url: e.target.value }
// //                                       : p
// //                                   ),
// //                                 })
// //                               }
// //                               required
// //                               pattern="https?://.+|ftp://.+"
// //                               title="Please enter a valid URL starting with http or https"
// //                             />
// //                           </div>
// //                         </div>
// //                         {index === basics.profiles.length - 1 && (
// //                           <button
// //                             className="ml-2 rounded-full bg-blue-600 p-1 hover:bg-blue-700"
// //                             onClick={() =>
// //                               debouncedSetBasics({
// //                                 ...basics,
// //                                 profiles: [
// //                                   ...basics.profiles,
// //                                   { network: "", username: "", url: "" },
// //                                 ],
// //                               })
// //                             }
// //                           >
// //                             <svg
// //                               xmlns="http://www.w3.org/2000/svg"
// //                               className="h-4 w-4 text-white"
// //                               viewBox="0 0 20 20"
// //                               fill="currentColor"
// //                             >
// //                               <path
// //                                 fillRule="evenodd"
// //                                 d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
// //                                 clipRule="evenodd"
// //                               />
// //                             </svg>
// //                           </button>
// //                         )}
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             )}

// //             {/* Work Section */}
// //             {activeSection === "work" && (
// //               <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-md dark:border-gray-600 dark:bg-gray-700">
// //                 <h2 className="mb-4 text-xl font-bold">Work Experience</h2>
// //                 {workEntries.length > 0 ? (
// //                   <div>
// //                     {workEntries.map((entry, index) =>
// //                       index === currentFormIndex ? (
// //                         <div key={index} className="mb-6">
// //                           {/* Entry Indicator */}
// //                           <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
// //                             Entry {currentFormIndex + 1} of {workEntries.length}
// //                           </div>

// //                           {/* Form Fields */}
// //                           <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
// //                             {/* Company Field */}
// //                             <div>
// //                               <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                                 <strong>Company:</strong>
// //                                 <span className="text-red-500">*</span>
// //                               </label>
// //                               <input
// //                                 type="text"
// //                                 placeholder="Enter company"
// //                                 className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                                 value={entry.company}
// //                                 onChange={(e) =>
// //                                   handleChange(index, "company", e.target.value)
// //                                 }
// //                                 required
// //                               />
// //                             </div>

// //                             {/* Position Field */}
// //                             <div>
// //                               <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                                 <strong>Position:</strong>
// //                                 <span className="text-red-500">*</span>
// //                               </label>
// //                               <input
// //                                 type="text"
// //                                 placeholder="Enter position"
// //                                 className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                                 value={entry.position}
// //                                 onChange={(e) =>
// //                                   handleChange(
// //                                     index,
// //                                     "position",
// //                                     e.target.value
// //                                   )
// //                                 }
// //                                 required
// //                               />
// //                             </div>
// //                           </div>

// //                           {/* Date Fields */}
// //                           <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
// //                             {/* Start Date */}
// //                             <div>
// //                               <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                                 <strong>Start Date:</strong>
// //                                 <span className="text-red-500">*</span>
// //                               </label>
// //                               <input
// //                                 type="date"
// //                                 className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                                 value={entry.startDate}
// //                                 onChange={(e) =>
// //                                   handleChange(
// //                                     index,
// //                                     "startDate",
// //                                     e.target.value
// //                                   )
// //                                 }
// //                                 required
// //                               />
// //                             </div>

// //                             {/* End Date */}
// //                             <div>
// //                               <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                                 <strong>End Date:</strong>
// //                                 <span className="text-red-500">*</span>
// //                               </label>
// //                               <input
// //                                 type="date"
// //                                 className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                                 value={entry.endDate}
// //                                 onChange={(e) =>
// //                                   handleChange(index, "endDate", e.target.value)
// //                                 }
// //                                 required
// //                               />
// //                             </div>
// //                           </div>

// //                           {/* Summary */}
// //                           <div className="mt-4">
// //                             <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                               <strong>Summary:</strong>
// //                               <span className="text-red-500">*</span>
// //                             </label>
// //                             <textarea
// //                               rows={4}
// //                               placeholder="Enter summary"
// //                               className="w-full border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                               value={entry.summary}
// //                               onChange={(e) =>
// //                                 handleChange(index, "summary", e.target.value)
// //                               }
// //                               required
// //                             />
// //                           </div>

// //                           {/* Highlights */}
// //                           <div className="mt-4">
// //                             <label className="mb-2 block text-sm text-gray-700 dark:text-gray-300">
// //                               <strong>Highlights:</strong>
// //                               <span className="text-red-500">*</span>
// //                             </label>
// //                             {entry.highlights.map((highlight, hIndex) => (
// //                               <div
// //                                 key={hIndex}
// //                                 className="mb-2 flex items-center"
// //                               >
// //                                 <input
// //                                   type="text"
// //                                   placeholder="Highlight"
// //                                   className="flex-1 border border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                                   value={highlight}
// //                                   onChange={(e) =>
// //                                     handleHighlightChange(
// //                                       index,
// //                                       hIndex,
// //                                       e.target.value
// //                                     )
// //                                   }
// //                                   required
// //                                 />
// //                                 <div className="ml-2 flex space-x-2">
// //                                   {/* Remove Highlight Button */}
// //                                   <button
// //                                     type="button"
// //                                     onClick={() =>
// //                                       handleChange(
// //                                         index,
// //                                         "highlights",
// //                                         entry.highlights.filter(
// //                                           (_, hi) => hi !== hIndex
// //                                         )
// //                                       )
// //                                     }
// //                                     className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 focus:outline-none"
// //                                     aria-label="Remove Highlight"
// //                                   >
// //                                     <svg
// //                                       xmlns="http://www.w3.org/2000/svg"
// //                                       className="h-4 w-4"
// //                                       fill="none"
// //                                       viewBox="0 0 24 24"
// //                                       stroke="currentColor"
// //                                     >
// //                                       <path
// //                                         strokeLinecap="round"
// //                                         strokeLinejoin="round"
// //                                         strokeWidth={2}
// //                                         d="M20 12H4"
// //                                       />
// //                                     </svg>
// //                                   </button>

// //                                   {/* Add Highlight Button */}
// //                                   <button
// //                                     type="button"
// //                                     onClick={() =>
// //                                       handleChange(index, "highlights", [
// //                                         ...entry.highlights,
// //                                         "",
// //                                       ])
// //                                     }
// //                                     className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
// //                                     aria-label="Add Highlight"
// //                                   >
// //                                     <svg
// //                                       xmlns="http://www.w3.org/2000/svg"
// //                                       className="h-4 w-4"
// //                                       fill="none"
// //                                       viewBox="0 0 24 24"
// //                                       stroke="currentColor"
// //                                     >
// //                                       <path
// //                                         strokeLinecap="round"
// //                                         strokeLinejoin="round"
// //                                         strokeWidth={2}
// //                                         d="M12 4v16m8-8H4"
// //                                       />
// //                                     </svg>
// //                                   </button>
// //                                 </div>
// //                               </div>
// //                             ))}
// //                           </div>

// //                           {/* Navigation and Action Buttons */}
// //                           <div className="mt-6 flex items-center justify-between">
// //                             {/* Navigation Buttons */}
// //                             <div className="flex space-x-2">
// //                               <button
// //                                 type="button"
// //                                 onClick={handlePrevious}
// //                                 disabled={currentFormIndex === 0}
// //                                 className={`rounded-md px-3 py-1 text-xs shadow ${
// //                                   currentFormIndex === 0
// //                                     ? "cursor-not-allowed bg-gray-300 text-gray-700"
// //                                     : "bg-indigo-600 text-white hover:bg-indigo-700"
// //                                 }`}
// //                               >
// //                                 Previous
// //                               </button>
// //                               <button
// //                                 type="button"
// //                                 onClick={handleNext}
// //                                 disabled={
// //                                   currentFormIndex === workEntries.length - 1
// //                                 }
// //                                 className={`rounded-md px-3 py-1 text-xs shadow ${
// //                                   currentFormIndex === workEntries.length - 1
// //                                     ? "cursor-not-allowed bg-gray-300 text-gray-700"
// //                                     : "bg-indigo-600 text-white hover:bg-indigo-700"
// //                                 }`}
// //                               >
// //                                 Next
// //                               </button>
// //                             </div>

// //                             {/* Add/Remove Work Buttons */}
// //                             <div className="flex space-x-2">
// //                               <button
// //                                 type="button"
// //                                 className={`rounded-md px-3 py-1 text-xs shadow ${
// //                                   workEntries.length === 1
// //                                     ? "cursor-not-allowed bg-red-300 text-gray-400"
// //                                     : "bg-red-600 text-white hover:bg-red-700"
// //                                 }`}
// //                                 onClick={() => handleRemoveWork(index)}
// //                                 disabled={workEntries.length === 1}
// //                               >
// //                                 Remove Work
// //                               </button>
// //                               <button
// //                                 type="button"
// //                                 className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white shadow hover:bg-blue-700"
// //                                 onClick={handleAddWork}
// //                               >
// //                                 Add Work
// //                               </button>
// //                             </div>
// //                           </div>
// //                         </div>
// //                       ) : null
// //                     )}
// //                   </div>
// //                 ) : (
// //                   <div className="text-sm text-gray-500 dark:text-gray-400">
// //                     No Work Entries Available
// //                   </div>
// //                 )}
// //               </div>
// //             )}

// //             {/*----------------------------------------------------------------------------------------------------------------  */}
// //             {activeSection === "education" && (
// //               <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-md dark:border-gray-600 dark:bg-gray-700">
// //                 <h2 className="mb-4 text-xl font-bold">Education</h2>
// //                 <div className="space-y-4">
// //                   <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
// //                     {/* Institution Field */}
// //                     <div>
// //                       <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                         <strong>Institution:</strong>
// //                         <span className="text-red-500">*</span>
// //                       </label>
// //                       <input
// //                         type="text"
// //                         placeholder="Enter institution"
// //                         className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                         value={educationEntries[0]?.institution || ""}
// //                         onChange={(e) =>
// //                           handleInputChange(0, "institution", e.target.value)
// //                         }
// //                         required
// //                       />
// //                     </div>

// //                     {/* Degree Field */}
// //                     <div>
// //                       <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                         <strong>Degree:</strong>
// //                         <span className="text-red-500">*</span>
// //                       </label>
// //                       <input
// //                         type="text"
// //                         placeholder="Enter degree"
// //                         className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                         value={educationEntries[0]?.degree || ""}
// //                         onChange={(e) =>
// //                           handleInputChange(0, "degree", e.target.value)
// //                         }
// //                         required
// //                       />
// //                     </div>
// //                   </div>

// //                   <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
// //                     {/* Start Date Field */}
// //                     <div>
// //                       <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                         <strong>Start Date:</strong>
// //                         <span className="text-red-500">*</span>
// //                       </label>
// //                       <input
// //                         type="date"
// //                         className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                         value={educationEntries[0]?.startDate || ""}
// //                         onChange={(e) =>
// //                           handleInputChange(0, "startDate", e.target.value)
// //                         }
// //                         required
// //                         onBlur={() => validateDate(0)}
// //                       />
// //                     </div>

// //                     {/* End Date Field */}
// //                     <div>
// //                       <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                         <strong>End Date:</strong>
// //                         <span className="text-red-500">*</span>
// //                       </label>
// //                       <input
// //                         type="date"
// //                         className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                         value={educationEntries[0]?.endDate || ""}
// //                         onChange={(e) =>
// //                           handleInputChange(0, "endDate", e.target.value)
// //                         }
// //                         required
// //                         onBlur={() => validateDate(0)}
// //                       />
// //                     </div>
// //                   </div>

// //                   {educationEntries[0]?.startDate &&
// //                     educationEntries[0]?.endDate &&
// //                     educationEntries[0].startDate >
// //                       educationEntries[0].endDate && (
// //                       <p className="mt-1 text-xs text-red-500">
// //                         End date cannot be earlier than start date
// //                       </p>
// //                     )}
// //                 </div>
// //               </div>
// //             )}

// //             {activeSection === "skills" && (
// //               <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-md dark:border-gray-600 dark:bg-gray-700">
// //                 <h2 className="mb-4 text-xl font-bold">Skills</h2>
// //                 <div className="space-y-4">
// //                   {skills.map((skill, index) => (
// //                     <div
// //                       key={index}
// //                       className="flex flex-wrap items-end space-x-2 space-y-2"
// //                     >
// //                       <div className="min-w-[150px] max-w-[300px] flex-grow">
// //                         <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                           <strong>Skill:</strong>
// //                           <span className="text-red-500">*</span>
// //                         </label>
// //                         <input
// //                           type="text"
// //                           placeholder="Enter skill"
// //                           className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                           value={skill.name}
// //                           onChange={(e) =>
// //                             debouncedSetSkills(
// //                               skills.map((s, i) =>
// //                                 i === index ? { ...s, name: e.target.value } : s
// //                               )
// //                             )
// //                           }
// //                           required
// //                         />
// //                       </div>
// //                       <div className="w-40">
// //                         <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                           <strong>Level:</strong>
// //                           <span className="text-red-500">*</span>
// //                         </label>
// //                         <select
// //                           className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                           value={skill.level}
// //                           onChange={(e) =>
// //                             debouncedSetSkills(
// //                               skills.map((s, i) =>
// //                                 i === index
// //                                   ? { ...s, level: e.target.value }
// //                                   : s
// //                               )
// //                             )
// //                           }
// //                           required
// //                         >
// //                           {skillLevels.map((level) => (
// //                             <option key={level} value={level}>
// //                               {level}
// //                             </option>
// //                           ))}
// //                         </select>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <div className="mt-4 flex justify-between">
// //                   <button
// //                     className={`rounded-full p-2 ${
// //                       skills.length <= 1
// //                         ? "cursor-not-allowed bg-gray-300"
// //                         : "bg-red-600 hover:bg-red-700"
// //                     }`}
// //                     onClick={() => debouncedSetSkills(skills.slice(0, -1))}
// //                     disabled={skills.length <= 1}
// //                   >
// //                     <svg
// //                       xmlns="http://www.w3.org/2000/svg"
// //                       className="h-4 w-4 text-white"
// //                       viewBox="0 0 20 20"
// //                       fill="currentColor"
// //                     >
// //                       <path
// //                         fillRule="evenodd"
// //                         d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
// //                         clipRule="evenodd"
// //                       />
// //                     </svg>
// //                   </button>
// //                   <button
// //                     className="rounded-full bg-blue-600 p-2 hover:bg-blue-700"
// //                     onClick={() =>
// //                       debouncedSetSkills([
// //                         ...skills,
// //                         { name: "", level: "Beginner" },
// //                       ])
// //                     }
// //                   >
// //                     <svg
// //                       xmlns="http://www.w3.org/2000/svg"
// //                       className="h-4 w-4 text-white"
// //                       viewBox="0 0 20 20"
// //                       fill="currentColor"
// //                     >
// //                       <path
// //                         fillRule="evenodd"
// //                         d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
// //                         clipRule="evenodd"
// //                       />
// //                     </svg>
// //                   </button>
// //                 </div>
// //               </div>
// //             )}
// //             {/* Languages Section */}
// //             {activeSection === "languages" && (
// //               <div className="rounded-lg border border-gray-300 bg-white p-4 shadow-md dark:border-gray-600 dark:bg-gray-700">
// //                 <h2 className="mb-4 text-xl font-bold">Languages</h2>
// //                 <div className="space-y-4">
// //                   {languages.map((lang, index) => (
// //                     <div
// //                       key={index}
// //                       className="flex flex-wrap items-end space-x-2 space-y-2"
// //                     >
// //                       <div className="min-w-[150px] max-w-[300px] flex-grow">
// //                         <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                           <strong>Language:</strong>
// //                           <span className="text-red-500">*</span>
// //                         </label>
// //                         <input
// //                           type="text"
// //                           placeholder="Enter language"
// //                           className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                           value={lang.language}
// //                           onChange={(e) =>
// //                             debouncedSetLanguages(
// //                               languages.map((l, i) =>
// //                                 i === index
// //                                   ? { ...l, language: e.target.value }
// //                                   : l
// //                               )
// //                             )
// //                           }
// //                           required
// //                         />
// //                       </div>
// //                       <div className="w-40">
// //                         <label className="mb-1 block text-sm text-gray-700 dark:text-gray-300">
// //                           <strong>Fluency:</strong>
// //                           <span className="text-red-500">*</span>
// //                         </label>
// //                         <select
// //                           className="w-full border-b border-gray-300 bg-white p-2 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
// //                           value={lang.fluency}
// //                           onChange={(e) =>
// //                             debouncedSetLanguages(
// //                               languages.map((l, i) =>
// //                                 i === index
// //                                   ? { ...l, fluency: e.target.value }
// //                                   : l
// //                               )
// //                             )
// //                           }
// //                           required
// //                         >
// //                           {fluencyLevels.map((level) => (
// //                             <option key={level} value={level}>
// //                               {level}
// //                             </option>
// //                           ))}
// //                         </select>
// //                       </div>
// //                     </div>
// //                   ))}
// //                 </div>
// //                 <div className="mt-4 flex justify-between">
// //                   <button
// //                     className={`rounded-full p-2 ${
// //                       languages.length <= 1
// //                         ? "cursor-not-allowed bg-gray-300"
// //                         : "bg-red-600 hover:bg-red-700"
// //                     }`}
// //                     onClick={() =>
// //                       debouncedSetLanguages(languages.slice(0, -1))
// //                     }
// //                     disabled={languages.length <= 1}
// //                   >
// //                     <svg
// //                       xmlns="http://www.w3.org/2000/svg"
// //                       className="h-4 w-4 text-white"
// //                       viewBox="0 0 20 20"
// //                       fill="currentColor"
// //                     >
// //                       <path
// //                         fillRule="evenodd"
// //                         d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
// //                         clipRule="evenodd"
// //                       />
// //                     </svg>
// //                   </button>
// //                   <button
// //                     className="rounded-full bg-blue-600 p-2 hover:bg-blue-700"
// //                     onClick={() =>
// //                       debouncedSetLanguages([
// //                         ...languages,
// //                         { language: "", fluency: "Beginner" },
// //                       ])
// //                     }
// //                   >
// //                     <svg
// //                       xmlns="http://www.w3.org/2000/svg"
// //                       className="h-4 w-4 text-white"
// //                       viewBox="0 0 20 20"
// //                       fill="currentColor"
// //                     >
// //                       <path
// //                         fillRule="evenodd"
// //                         d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
// //                         clipRule="evenodd"
// //                       />
// //                     </svg>
// //                   </button>
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //           <div className="col-span-1 lg:col-span-4 lg:pl-8">
// //             <ResumePreview
// //               renderedHtml={renderedHtml}
// //               getJson={getJson}
// //               resumeJson={resumeJson}
// //             />
// //           </div>
// //         </div>
// //       </main>
// //       {showModal && (
// //         <Modal
// //           title="Authentication Error"
// //           message={errorMessage}
// //           onClose={handleClose}
// //         />
// //       )}
// //     </div>
// //   );
// // }
// "use client";
// import Handlebars from "handlebars";
// import Layout from "@/components/Common/Layout";
// import Modal from "@/components/Common/Modal";
// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import ResumePreview from "./ResumeView";
// import debounce from "lodash/debounce";
// import moment from "moment";
// import { countries } from "country-data";
// import { useRouter } from "next/navigation";
// import { isAuthenticated } from "@/utils/auth";
// import {
//   FaChevronLeft,
//   FaChevronRight,
//   FaTrash,
//   FaPlus,
//   FaPlusCircle,
//   FaMinusCircle,
//   FaBuilding,
//   FaBriefcase,
//   FaCalendarAlt,
//   FaFileAlt,
//   FaUser,
//   FaTag,
//   FaEnvelope,
//   FaPhone,
//   FaMapMarker,
//   FaGlobe,
//   FaChartLine,
//   FaCity,
//   FaHashtag,
//   FaLink,
//   FaArrowAltCircleLeft,
//   FaArrowAltCircleRight,
//   FaGraduationCap,
//   FaUniversity,
//   FaScroll,
// } from "react-icons/fa";
// // import { FaArrowAltCircleLeft, FaArrowAltCircleRight } from 'react-icons/fa';

// // Cache for partials
// const partialCache: Record<string, string> = {};
// const DEBOUNCE_TIME = 500;

// // Optimized fetchPartials function
// const fetchPartials = async (partialsNeeded: string[]) => {
//   const partials = [
//     "about",
//     "basics",
//     "education",
//     "info-tag",
//     "languages",
//     "resume-header",
//     "skills",
//     "summary",
//     "social",
//     "title",
//     "work",
//     "section-header",
//   ];

//   const partialPromises = partialsNeeded.map(async (partial) => {
//     if (!partialCache[partial]) {
//       try {
//         const response = await fetch(`/templates/partials/${partial}.hbs`);
//         if (!response.ok) throw new Error(`Failed to fetch ${partial}.hbs`);
//         const partialString = await response.text();
//         Handlebars.registerPartial(partial, partialString);
//         partialCache[partial] = partialString;
//       } catch (error) {
//         console.error(`Error fetching partial: ${partial}`, error);
//       }
//     }
//   });

//   await Promise.all(partialPromises);
// };

// const registerHelpers = () => {
//   Handlebars.registerHelper({
//     removeProtocol: (url: string) => url.replace(/.*?:\/\//g, ""),
//     concat: (...args: any[]) =>
//       args.filter((arg) => typeof arg !== "object").join(""),
//     formatAddress: (...args: any[]) =>
//       args.filter((arg) => typeof arg !== "object").join(" "),
//     formatDate: (date: string) => moment(date).format("MM/YYYY"),
//     lowercase: (s: string) => s.toLowerCase(),
//     eq: (a: any, b: any) => a === b,
//   });
// };

// const skillLevels = ["Beginner", "Intermediate", "Advanced", "Master"];
// const fluencyLevels = ["Beginner", "Intermediate", "Advanced", "Fluent"];

// export default function Assignment() {
//   // State Management
//   const [activeSection, setActiveSection] = useState<string>("basics");
//   const [localInputs, setLocalInputs] = useState<Record<string, any>>({});
//   const [skills, setSkills] = useState<{ name: string; level: string }[]>([
//     { name: "", level: "" },
//   ]);

//   const [renderedHtml, setRenderedHtml] = useState<string>("");
//   const [currentFormIndex, setCurrentFormIndex] = useState<number>(0);
//   const [languages, setLanguages] = useState<
//     { language: string; fluency: string }[]
//   >([{ language: "", fluency: "" }]);
//   const router = useRouter();
//   const [loading, setLoading] = useState<boolean>(true);
//   const [phoneNumber, setPhoneNumber] = useState<string>("");
//   const [countryCode, setCountryCode] = useState<string>("+1");
//   const [fullPhoneNumber, setFullPhoneNumber] = useState<string>(
//     `${countryCode}${phoneNumber}`
//   );
//   const [errorMessage, setErrorMessage] = useState<string>("");
//   const [showModal, setShowModal] = useState<boolean>(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [saveMessage, setSaveMessage] = useState<{ type: string, text: string } | null>(null);

//   // Initial States
//   const [basics, setBasics] = useState<{
//     name: string;
//     label: string;
//     email: string;
//     phone: string;
//     url: string;
//     summary: string;
//     location: {
//       address: string;
//       postalCode: string;
//       city: string;
//       countryCode: string;
//     };
//     profiles: { network: string; username: string; url: string }[];
//   }>({
//     name: "",
//     label: "",
//     email: "",
//     phone: "",
//     url: "",
//     summary: "",
//     location: {
//       address: "",
//       postalCode: "",
//       city: "",
//       countryCode: "",
//     },
//     profiles: [{ network: "", username: "", url: "" }],
//   });

//   const [workEntries, setWorkEntries] = useState<
//     {
//       company: string;
//       position: string;
//       startDate: string;
//       endDate: string;
//       summary: string;
//       highlights: string[];
//     }[]
//   >([
//     {
//       company: "",
//       position: "",
//       startDate: "",
//       endDate: "",
//       summary: "",
//       highlights: [""],
//     },
//   ]);

//   const [educationEntries, setEducationEntries] = useState<
//     {
//       institution: string;
//       degree: string;
//       startDate: string;
//       endDate: string;
//       summary: string;
//     }[]
//   >([
//     {
//       institution: "",
//       degree: "",
//       startDate: "",
//       endDate: "",
//       summary: "",
//     },
//   ]);

//   // Debounced setters
//   const debouncedSetBasics = useMemo(
//     () => debounce((value) => setBasics(value), DEBOUNCE_TIME),
//     []
//   );

//   const debouncedSetSkills = useMemo(
//     () => debounce((value) => setSkills(value), DEBOUNCE_TIME),
//     []
//   );

//   const debouncedSetLanguages = useMemo(
//     () => debounce((value) => setLanguages(value), DEBOUNCE_TIME),
//     []
//   );

//   const debouncedSetWorkEntries = useMemo(
//     () => debounce((value) => setWorkEntries(value), DEBOUNCE_TIME),
//     []
//   );

//   // Helper Functions
//   const getInputValue = (key: string, defaultValue: any) => {
//     return localInputs[key] !== undefined ? localInputs[key] : defaultValue;
//   };

//   const handleBasicsChange = (field: string, value: any) => {
//     const key = `basics-${field}`;
//     setLocalInputs((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     // Use the debounced setter for updating the actual state
//     debouncedSetBasics((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   // Modify the handleLocationChange function
//   const handleLocationChange = (field: string, value: any) => {
//     const key = `location-${field}`;
//     setLocalInputs((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     // Use the debounced setter for updating the actual state
//     debouncedSetBasics((prev) => ({
//       ...prev,
//       location: {
//         ...prev.location,
//         [field]: value,
//       },
//     }));
//   };

//   // Modify the handleProfileChange function
//   const handleProfileChange = (index: number, field: string, value: any) => {
//     const key = `profile-${index}-${field}`;
//     setLocalInputs((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     // Use the debounced setter for updating the actual state
//     debouncedSetBasics((prev) => ({
//       ...prev,
//       profiles: prev.profiles.map((profile, i) =>
//         i === index ? { ...profile, [field]: value } : profile
//       ),
//     }));
//   };

//   // Work Entry Handlers
//   const handleWorkChange = (index: number, field: string, value: any) => {
//     const key = `work-${index}-${field}`;
//     setLocalInputs((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     const updatedEntries = workEntries.map((entry, i) =>
//       i === index ? { ...entry, [field]: value } : entry
//     );
//     debouncedSetWorkEntries(updatedEntries);
//   };

//   const handleHighlightChange = (
//     workIndex: number,
//     highlightIndex: number,
//     value: string
//   ) => {
//     const key = `work-${workIndex}-highlight-${highlightIndex}`;
//     setLocalInputs((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     const updatedEntries = workEntries.map((entry, i) =>
//       i === workIndex
//         ? {
//             ...entry,
//             highlights: entry.highlights.map((h, hi) =>
//               hi === highlightIndex ? value : h
//             ),
//           }
//         : entry
//     );
//     debouncedSetWorkEntries(updatedEntries);
//   };

//   // Education Handlers
//   const handleEducationChange = (index: number, field: string, value: any) => {
//     const key = `education-${index}-${field}`;
//     setLocalInputs((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     setEducationEntries((prev) =>
//       prev.map((entry, i) =>
//         i === index ? { ...entry, [field]: value } : entry
//       )
//     );
//   };

//   // Skills and Languages Handlers
//   const handleSkillChange = (index: number, field: string, value: any) => {
//     const key = `skill-${index}-${field}`;
//     setLocalInputs((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     debouncedSetSkills(
//       skills.map((s, i) => (i === index ? { ...s, [field]: value } : s))
//     );
//   };

//   const handleLanguageChange = (index: number, field: string, value: any) => {
//     const key = `language-${index}-${field}`;
//     setLocalInputs((prev) => ({
//       ...prev,
//       [key]: value,
//     }));

//     debouncedSetLanguages(
//       languages.map((l, i) => (i === index ? { ...l, [field]: value } : l))
//     );
//   };

//   // Navigation Handlers
//   const handlePrevious = () => {
//     setCurrentFormIndex((prevIndex) => Math.max(prevIndex - 1, 0));
//   };

//   const handleNext = () => {
//     setCurrentFormIndex((prevIndex) =>
//       Math.min(prevIndex + 1, workEntries.length - 1)
//     );
//   };

//   // Phone Number Handlers
//   const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const selectedValue = e.target.value;
//     const newCountryCode = selectedValue.split("-")[0];
//     const newFullPhoneNumber = `${newCountryCode}${phoneNumber}`;

//     setCountryCode(newCountryCode);
//     setFullPhoneNumber(newFullPhoneNumber);
//     handleBasicsChange("phone", newFullPhoneNumber);
//   };

//   const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const enteredPhone = e.target.value.trim();
//     setPhoneNumber(enteredPhone);

//     const updatedFullPhoneNumber = `${countryCode}${enteredPhone}`;
//     setFullPhoneNumber(updatedFullPhoneNumber);
//     handleBasicsChange("phone", updatedFullPhoneNumber);
//   };

//   // Add/Remove Entry Handlers
//   const handleAddWork = () => {
//     const newEntry = {
//       company: "",
//       position: "",
//       startDate: "",
//       endDate: "",
//       summary: "",
//       highlights: [""],
//     };
//     setWorkEntries((prev) => [...prev, newEntry]);
//     setCurrentFormIndex(workEntries.length);
//   };

//   const handleRemoveWork = (index: number) => {
//     if (workEntries.length > 1) {
//       setWorkEntries((prev) => prev.filter((_, i) => i !== index));
//       if (currentFormIndex >= workEntries.length - 1) {
//         setCurrentFormIndex(workEntries.length - 2);
//       }
//     }
//   };

//   const handleAddProfile = () => {
//     debouncedSetBasics((prev) => ({
//       ...prev,
//       profiles: [...prev.profiles, { network: "", username: "", url: "" }],
//     }));
//   };

//   const handleRemoveProfile = (index: number) => {
//     if (basics.profiles.length > 1) {
//       debouncedSetBasics((prev) => ({
//         ...prev,
//         profiles: prev.profiles.filter((_, i) => i !== index),
//       }));
//     }
//   };

//   // Date Validation
//   const validateDate = (index: number) => {
//     const entry = educationEntries[index];
//     if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) {
//       alert("End date cannot be earlier than the start date.");
//     }
//   };

//   // Template Rendering
//   const renderTemplate = useCallback(async () => {
//     try {
//       const partialsNeeded: string[] = [];
//       if (basics) {
//         partialsNeeded.push(
//           "about",
//           "resume-header",
//           "summary",
//           "title",
//           "info-tag",
//           "social",
//           "section-header"
//         );
//       }
//       if (workEntries.length > 0) partialsNeeded.push("work");
//       if (educationEntries.length > 0) partialsNeeded.push("education");
//       if (skills.length > 0) partialsNeeded.push("skills");
//       if (languages.length > 0) partialsNeeded.push("languages");

//       await fetchPartials(partialsNeeded);

//       const response = await fetch("/templates/resume.hbs");
//       if (!response.ok) {
//         throw new Error("Failed to fetch resume.hbs");
//       }
//       const templateString = await response.text();
//       const template = Handlebars.compile(templateString);

//       const resumeJson = {
//         basics,
//         work: workEntries,
//         education: educationEntries,
//         skills,
//         languages,
//       };

//       const html = template(resumeJson);
//       setRenderedHtml(html);
//     } catch (error) {
//       console.error("Error rendering template", error);
//     }
//   }, [basics, workEntries, educationEntries, skills, languages]);

//   const handleSave = async () => {
//     setIsSaving(true);
//     setSaveMessage(null);
//     try {
//       // Simulate save operation
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//       setSaveMessage({ type: 'success', text: 'Resume saved successfully!' });
//     } catch (error) {
//       setSaveMessage({ type: 'error', text: 'Failed to save resume. Please try again.' });
//     } finally {
//       setIsSaving(false);
//     }
//   };
//   const sections = ["basics", "work", "education", "skills", "languages"];
//   const [activeSectionIndex, setActiveSectionIndex] = useState(sections.indexOf(activeSection));

// // Update active section based on index
// useEffect(() => {
//   setActiveSection(sections[activeSectionIndex]);
// }, [activeSectionIndex]);

// // Handler to go to the next section
// const handleNextSection = () => {
//   setActiveSectionIndex((prevIndex) => Math.min(prevIndex + 1, sections.length - 1));
// };

// // Handler to go to the previous section
// const handlePreviousSection = () => {
//   setActiveSectionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
// };

//   // Effects
//   useEffect(() => {
//     registerHelpers();
//     const debouncedRender = debounce(renderTemplate, DEBOUNCE_TIME);
//     debouncedRender();

//     return () => {
//       debouncedRender.cancel();
//     };
//   }, [renderTemplate]);

//   useEffect(() => {
//     const checkAuthentication = async () => {
//       try {
//         const { valid } = await isAuthenticated();
//         if (!valid) {
//           router.push("/login");
//         } else {
//           setLoading(false);
//         }
//       } catch (error) {
//         console.error("Error checking authentication:", error);
//         router.push("/login");
//       }
//     };

//     checkAuthentication();
//   }, [router]);

//   // Cleanup
//   useEffect(() => {
//     return () => {
//       debouncedSetBasics.cancel();
//       debouncedSetSkills.cancel();
//       debouncedSetLanguages.cancel();
//       debouncedSetWorkEntries.cancel();
//     };
//   }, [
//     debouncedSetBasics,
//     debouncedSetSkills,
//     debouncedSetLanguages,
//     debouncedSetWorkEntries,
//   ]);

//   const handleClose = () => {
//     localStorage.removeItem("access_token");
//     sessionStorage.clear();
//     router.push("/login");
//     setShowModal(false);
//   };

//   // if (loading) {
//   //   return <div>Loading...</div>;
//   // }

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//       <main className="container mx-auto px-4 pb-6 dark:bg-gray-800 dark:text-white sm:px-6">
//         <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
//           <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
//             Create Resume
//           </h1>
//           <div className="hidden sm:block">
//             <Layout currentPage="Resume" />
//           </div>
//         </nav>

//         {/* Navigation Buttons */}
//         <div className="mb-6 flex justify-between">
//           <button
//             onClick={handlePreviousSection}
//             disabled={activeSectionIndex === 0}
//             className={`flex items-center gap-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 transition-all duration-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 ${
//               activeSectionIndex === 0
//                 ? "cursor-not-allowed opacity-50"
//                 : "hover:bg-gradient-to-br hover:from-indigo-900 hover:to-purple-400 hover:text-white"
//             }`}
//           >
//             <FaArrowAltCircleLeft className="h-5 w-5" />
//             Previous
//           </button>

//           <button
//             onClick={handleNextSection}
//             disabled={activeSectionIndex === sections.length - 1}
//             className={`flex items-center gap-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 transition-all duration-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 ${
//               activeSectionIndex === sections.length - 1
//                 ? "cursor-not-allowed opacity-50"
//                 : "hover:bg-gradient-to-br hover:from-indigo-900 hover:to-purple-400 hover:text-white"
//             }`}
//           >
//             Next
//             <FaArrowAltCircleRight className="h-5 w-5" />
//           </button>
//         </div>

//         <div className="grid grid-cols-1 gap-10 lg:grid-cols-8">

//           {/* Section Navigation */}
//           <div className="col-span-1 lg:col-span-1">
//           <ul className="space-y-2">
//             {sections.map((section, index) => (
//               <li key={section}>
//                 <button
//                   onClick={() => {
//                     setActiveSection(section);
//                     setActiveSectionIndex(index);
//                   }}
//                   className={`w-full border-l-4 px-4 py-2 text-left font-semibold transition-all ${
//                     activeSection === section
//                       ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
//                       : "border-transparent text-gray-800 dark:text-gray-300"
//                   }`}
//                 >
//                   {section.charAt(0).toUpperCase() + section.slice(1)}
//                 </button>
//               </li>
//             ))}
//           </ul>
//           <div className="mt-4">
//             <button
//               onClick={handleSave}
//               className={`w-3/4 rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 py-1 px-4 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 lg:text-base ${
//                 isSaving ? "cursor-not-allowed opacity-50" : ""
//               }`}
//               disabled={isSaving}
//             >

//               {isSaving ? (
//                 <span className="flex items-center justify-center">
//                   <svg
//                     className="animate-spin h-5 w-5 mr-3 text-white"
//                     xmlns="http://www.w3.org/2000/svg"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle
//                       className="opacity-25"
//                       cx="12"
//                       cy="12"
//                       r="10"
//                       stroke="currentColor"
//                       strokeWidth="4"
//                     ></circle>
//                     <path
//                       className="opacity-75"
//                       fill="currentColor"
//                       d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                     ></path>
//                   </svg>
//                   Saving...
//                 </span>
//               ) : (
//                 "Save"
//               )}
//             </button>
//             {saveMessage && (
//               <p className={`mt-2 text-sm ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
//                 {saveMessage.text}
//               </p>
//             )}
//           </div>
//           </div>
//            {/* Navigation Buttons */}
//            {/* <div className="flex justify-center gap-32 mt-16 mb-8">
//             <button
//               onClick={handlePreviousSection}
//               disabled={activeSectionIndex === 0}
//               className={`flex items-center gap-2 transition-all duration-300 ${
//                 activeSectionIndex === 0
//                   ? "cursor-not-allowed text-gray-400"
//                   : "text-gray-700 hover:text-indigo-600"
//               }`}
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 strokeWidth={2}
//                 stroke="currentColor"
//                 className="h-5 w-8"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15m0 0l6.75 6.75M4.5 12l6.75-6.75" />
//               </svg>
//             </button>

//             <button
//               onClick={handleNextSection}
//               disabled={activeSectionIndex === sections.length - 1}
//               className={`flex items-center gap-2 transition-all duration-300 ${
//                 activeSectionIndex === sections.length - 1
//                   ? "cursor-not-allowed text-gray-400"
//                   : "text-gray-700 hover:text-indigo-600"
//               }`}
//             >
//               <svg
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 strokeWidth={2}
//                 stroke="currentColor"
//                 className="h-5 w-8"
//               >
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
//               </svg>
//             </button>
//           </div>
//         </div> */}

// {/* ---------------------------------------------------- */}

//           <div className="col-span-1 lg:col-span-3">
//             {/* Basics Section */}
//             {activeSection === "basics" && (
//               <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
//                 {/* Header */}
//                 <div className="mb-6 flex items-center border-b border-gray-200 pb-4">
//                   <FaUser className="mr-3 h-6 w-6 text-indigo-600" />
//                   <h2 className="text-xl font-bold">Basic Information</h2>
//                 </div>

//                 {/* Main Form Content */}
//                 <div className="space-y-6">
//                   {/* Personal Information Grid */}
//                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                     {/* Name Field */}
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaUser className="mr-2 h-4 w-4 text-gray-500" />
//                           <span>Name</span>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Enter your name"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(`basics-name`, basics.name)}
//                         onChange={(e) =>
//                           handleBasicsChange("name", e.target.value)
//                         }
//                         required
//                         onKeyDown={(e) => e.stopPropagation()}
//                         autoComplete="text"
//                       />
//                     </div>

//                     {/* Label/Title Field */}
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaTag className="mr-2 h-4 w-4 text-gray-500" />
//                           <span>Professional Title</span>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Enter your professional title"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(`basics-label`, basics.label)}
//                         onChange={(e) =>
//                           handleBasicsChange("label", e.target.value)
//                         }
//                         required
//                         onKeyDown={(e) => e.stopPropagation()}
//                         autoComplete="text"
//                       />
//                     </div>

//                     {/* Email Field */}
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaEnvelope className="mr-2 h-4 w-4 text-gray-500" />
//                           <span>Email Address</span>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="email"
//                         placeholder="Enter your email"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(`basics-email`, basics.email)}
//                         onChange={(e) =>
//                           handleBasicsChange("email", e.target.value)
//                         }
//                         required
//                         pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
//                         title="Please enter a valid email address (example@domain.com)"
//                         onKeyDown={(e) => e.stopPropagation()}
//                         autoComplete="email"
//                       />
//                     </div>

//                     {/* Phone Field */}
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaPhone className="mr-2 h-4 w-4 text-gray-500" />
//                           <span>Phone Number</span>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <div className="flex">
//                         <select
//                           id="country-code"
//                           name="country-code"
//                           className="w-24 rounded-l-md border border-r-0 border-gray-300 bg-white py-3 px-1 text-xs text-gray-700 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
//                           value={countryCode}
//                           onChange={handleCountryChange}
//                           required
//                         >
//                           {countries.all.map((country) => (
//                             <option
//                               key={`${country.alpha2}-${country.name}`}
//                               value={country.countryCallingCodes[0]}
//                             >
//                               {country.alpha2} {country.countryCallingCodes[0]}
//                             </option>
//                           ))}
//                         </select>
//                         <input
//                           type="tel"
//                           placeholder="phone number"
//                           className="w-[8rem] min-w-[8rem] max-w-[8rem] flex-1 rounded-r-md border border-gray-300 p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                           value={phoneNumber}
//                           onChange={handlePhoneChange}
//                           required
//                           pattern="[0-9]{3,15}"
//                           minLength={9}
//                           maxLength={15}
//                           title="Phone number must be between 9 and 15 digits"
//                           autoComplete="tel"
//                         />
//                       </div>
//                     </div>
//                   </div>

//                   {/* Summary Section */}
//                   <div>
//                     <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                       <div className="flex items-center">
//                         <span>Professional Summary</span>
//                         <span className="ml-1 text-red-500">*</span>
//                       </div>
//                     </label>
//                     <textarea
//                       rows={4}
//                       placeholder="Write a brief professional summary"
//                       className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                       value={getInputValue("basics-summary", basics.summary)}
//                       onChange={(e) =>
//                         handleBasicsChange("summary", e.target.value)
//                       }
//                       required
//                       onKeyDown={(e) => e.stopPropagation()}
//                       autoComplete="text"
//                     />
//                   </div>

//                   {/* Location Information */}
//                   <div>
//                     <h3 className="mb-4 flex items-center text-lg font-semibold">
//                       <FaMapMarker className="mr-2 h-5 w-5 text-indigo-600" />
//                       Location Details
//                     </h3>
//                     <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                       {[
//                         {
//                           field: "address",
//                           icon: FaMapMarker,
//                           placeholder: "Street address",
//                         },
//                         {
//                           field: "postalCode",
//                           icon: FaHashtag,
//                           placeholder: "Postal code",
//                         },
//                         { field: "city", icon: FaCity, placeholder: "City" },
//                         {
//                           field: "countryCode",
//                           icon: FaGlobe,
//                           placeholder: "Country code",
//                         },
//                       ].map(({ field, icon: Icon, placeholder }, index) => (
//                         <div key={index}>
//                           <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                             <div className="flex items-center">
//                               <Icon className="mr-2 h-4 w-4 text-gray-500" />
//                               <span>
//                                 {field.charAt(0).toUpperCase() + field.slice(1)}
//                               </span>
//                               <span className="ml-1 text-red-500">*</span>
//                             </div>
//                           </label>
//                           <input
//                             type="text"
//                             placeholder={placeholder}
//                             className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                             value={getInputValue(
//                               `location-${field}`,
//                               basics.location[field]
//                             )}
//                             onChange={(e) =>
//                               handleLocationChange(field, e.target.value)
//                             }
//                             required
//                             pattern={
//                               field === "postalCode" ? "[0-9]{5,10}" : ".*"
//                             }
//                             title={
//                               field === "postalCode"
//                                 ? "Postal code must be between 5 and 10 digits"
//                                 : ""
//                             }
//                             onKeyDown={(e) => e.stopPropagation()}
//                             autoComplete="text"
//                           />
//                         </div>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Social Profiles Section */}
//                   <div>
//                     <h3 className="mb-4 flex items-center text-lg font-semibold">
//                       <FaLink className="mr-2 h-5 w-5 text-indigo-600" />
//                       Social Profiles
//                     </h3>
//                     {basics.profiles.map((profile, index) => (
//                       <div key={index} className="mb-6 last:mb-0">
//                         <div className="flex items-center gap-4">
//                           {/* Remove Profile Button */}
//                           {index !== 0 && (
//                             <button
//                               className="flex h-10 w-10 items-center justify-center rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
//                               onClick={() => handleRemoveProfile(index)}
//                             >
//                               <FaMinusCircle className="h-5 w-5" />
//                             </button>
//                           )}

//                           {/* Profile Fields */}
//                           <div className="grid flex-grow grid-cols-1 gap-6 md:grid-cols-3">
//                             {/* Network Selection */}
//                             <div>
//                               <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                                 <div className="flex items-center">
//                                   <FaGlobe className="mr-2 h-4 w-4 text-gray-500" />
//                                   <span>Network</span>
//                                   <span className="ml-1 text-red-500">*</span>
//                                 </div>
//                               </label>
//                               <select
//                                 className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                                 value={getInputValue(
//                                   `profile-${index}-network`,
//                                   profile.network
//                                 )}
//                                 onChange={(e) =>
//                                   handleProfileChange(
//                                     index,
//                                     "network",
//                                     e.target.value
//                                   )
//                                 }
//                                 required
//                               >
//                                 <option value="" disabled>
//                                   Select network
//                                 </option>
//                                 <option value="GitHub">GitHub</option>
//                                 <option value="Instagram">Instagram</option>
//                                 <option value="Twitter">Twitter</option>
//                                 <option value="LinkedIn">LinkedIn</option>
//                               </select>
//                             </div>

//                             {/* Username Field */}
//                             <div>
//                               <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                                 <div className="flex items-center">
//                                   <FaUser className="mr-2 h-4 w-4 text-gray-500" />
//                                   <span>Username</span>
//                                   <span className="ml-1 text-red-500">*</span>
//                                 </div>
//                               </label>
//                               <input
//                                 type="text"
//                                 placeholder="Enter username"
//                                 className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                                 value={getInputValue(
//                                   `profile-${index}-username`,
//                                   profile.username
//                                 )}
//                                 onChange={(e) =>
//                                   handleProfileChange(
//                                     index,
//                                     "username",
//                                     e.target.value
//                                   )
//                                 }
//                                 required
//                                 autoComplete="text"
//                               />
//                             </div>

//                             {/* URL Field */}
//                             <div>
//                               <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                                 <div className="flex items-center">
//                                   <FaLink className="mr-2 h-4 w-4 text-gray-500" />
//                                   <span>Profile URL</span>
//                                   <span className="ml-1 text-red-500">*</span>
//                                 </div>
//                               </label>
//                               <input
//                                 type="url"
//                                 placeholder="https://..."
//                                 className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                                 value={getInputValue(
//                                   `profile-${index}-url`,
//                                   profile.url
//                                 )}
//                                 onChange={(e) =>
//                                   handleProfileChange(
//                                     index,
//                                     "url",
//                                     e.target.value
//                                   )
//                                 }
//                                 required
//                                 autoComplete="url"
//                                 pattern="https?://.+|ftp://.+"
//                                 title="Please enter a valid URL starting with http or https"
//                               />
//                             </div>
//                           </div>

//                           {/* Add Profile Button */}
//                           {index === basics.profiles.length - 1 && (
//                             <button
//                               className="flex h-10 w-10 items-center justify-center rounded-full text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
//                               onClick={handleAddProfile}
//                             >
//                               <FaPlusCircle className="h-5 w-5" />
//                             </button>
//                           )}
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </div>
//             )}
//             {/* Work Section */}
//             {activeSection === "work" && (
//               <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
//                 {/* Header with Navigation */}
//                 <div className="mb-6 flex flex-col border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
//                   <h2 className="mb-4 flex items-center text-xl font-bold sm:mb-0">
//                     <FaBriefcase className="mr-2 h-5 w-5 text-indigo-600" />
//                     Work Experience
//                   </h2>
//                   <div className="flex items-center space-x-6">
//                     <button
//                       onClick={handlePrevious}
//                       disabled={currentFormIndex === 0}
//                       className={`flex items-center transition-colors duration-200 ${
//                         currentFormIndex === 0
//                           ? "cursor-not-allowed text-gray-300"
//                           : "text-gray-600 hover:text-indigo-600"
//                       }`}
//                     >
//                       <FaChevronLeft className="h-4 w-4" />
//                       {/* <span className="ml-1 text-sm">Previou</span> */}
//                     </button>

//                     <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
//                       {currentFormIndex + 1} of {workEntries.length}
//                     </span>

//                     <button
//                       onClick={handleNext}
//                       disabled={currentFormIndex === workEntries.length - 1}
//                       className={`flex items-center transition-colors duration-200 ${
//                         currentFormIndex === workEntries.length - 1
//                           ? "cursor-not-allowed text-gray-300"
//                           : "text-gray-600 hover:text-indigo-600"
//                       }`}
//                     >
//                       {/* <span className="mr-1 text-sm">Next</span> */}
//                       <FaChevronRight className="h-4 w-4" />
//                     </button>
//                   </div>
//                 </div>

//                 <div className="space-y-6">
//                   {/* Company and Position Fields */}
//                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaBuilding className="mr-2 h-4 w-4 text-gray-500" />
//                           <strong>Company</strong>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Enter company name"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(
//                           `work-${currentFormIndex}-company`,
//                           workEntries[currentFormIndex]?.company
//                         )}
//                         onChange={(e) =>
//                           handleWorkChange(
//                             currentFormIndex,
//                             "company",
//                             e.target.value
//                           )
//                         }
//                         required
//                         autoComplete="text"
//                       />
//                     </div>

//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaBriefcase className="mr-2 h-4 w-4 text-gray-500" />
//                           <strong>Position</strong>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Enter position"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(
//                           `work-${currentFormIndex}-position`,
//                           workEntries[currentFormIndex]?.position
//                         )}
//                         onChange={(e) =>
//                           handleWorkChange(
//                             currentFormIndex,
//                             "position",
//                             e.target.value
//                           )
//                         }
//                         required
//                         autoComplete="text"
//                       />
//                     </div>
//                   </div>

//                   {/* Date Fields */}
//                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-500" />
//                           <strong>Start Date</strong>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="date"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(
//                           `work-${currentFormIndex}-startDate`,
//                           workEntries[currentFormIndex]?.startDate
//                         )}
//                         onChange={(e) =>
//                           handleWorkChange(
//                             currentFormIndex,
//                             "startDate",
//                             e.target.value
//                           )
//                         }
//                         required
//                         autoComplete="text"
//                       />
//                     </div>

//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-500" />
//                           <strong>End Date</strong>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="date"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(
//                           `work-${currentFormIndex}-endDate`,
//                           workEntries[currentFormIndex]?.endDate
//                         )}
//                         onChange={(e) =>
//                           handleWorkChange(
//                             currentFormIndex,
//                             "endDate",
//                             e.target.value
//                           )
//                         }
//                         required
//                         autoComplete="text"
//                       />
//                     </div>
//                   </div>

//                   {/* Summary Field */}
//                   <div>
//                     <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                       <div className="flex items-center">
//                         <FaFileAlt className="mr-2 h-4 w-4 text-gray-500" />
//                         <strong>Summary</strong>
//                         <span className="ml-1 text-red-500">*</span>
//                       </div>
//                     </label>
//                     <textarea
//                       placeholder="Enter work summary"
//                       className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                       value={getInputValue(
//                         `work-${currentFormIndex}-summary`,
//                         workEntries[currentFormIndex]?.summary
//                       )}
//                       onChange={(e) =>
//                         handleWorkChange(
//                           currentFormIndex,
//                           "summary",
//                           e.target.value
//                         )
//                       }
//                       rows={4}
//                       required
//                       autoComplete="text"
//                     />
//                   </div>

//                   {/* Highlights Section */}
//                   <div className="space-y-3">
//                     <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                       <div className="flex items-center">
//                         <FaFileAlt className="mr-2 h-4 w-4 text-gray-500" />
//                         <strong>Highlights</strong>
//                       </div>
//                     </label>
//                     <div className="space-y-3">
//                       {workEntries[currentFormIndex]?.highlights.map(
//                         (highlight, hIndex) => (
//                           <div
//                             key={hIndex}
//                             className="group flex items-center space-x-3"
//                           >
//                             <input
//                               type="text"
//                               placeholder="Enter highlight"
//                               className="flex-1 rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                               value={getInputValue(
//                                 `work-${currentFormIndex}-highlight-${hIndex}`,
//                                 highlight
//                               )}
//                               onChange={(e) =>
//                                 handleHighlightChange(
//                                   currentFormIndex,
//                                   hIndex,
//                                   e.target.value
//                                 )
//                               }
//                             />
//                             {hIndex > 0 && (
//                               <button
//                                 onClick={() => {
//                                   const newHighlights = [
//                                     ...workEntries[currentFormIndex].highlights,
//                                   ];
//                                   newHighlights.splice(hIndex, 1);
//                                   handleWorkChange(
//                                     currentFormIndex,
//                                     "highlights",
//                                     newHighlights
//                                   );
//                                 }}
//                                 className="text-gray-400 transition-colors duration-200 hover:text-red-500"
//                                 title="Remove highlight"
//                               >
//                                 <FaMinusCircle className="h-5 w-5" />
//                               </button>
//                             )}
//                           </div>
//                         )
//                       )}
//                     </div>

//                     {/* Add Highlight Button */}
//                     <button
//                       onClick={() => {
//                         const newHighlights = [
//                           ...workEntries[currentFormIndex].highlights,
//                           "",
//                         ];
//                         handleWorkChange(
//                           currentFormIndex,
//                           "highlights",
//                           newHighlights
//                         );
//                       }}
//                       className="mt-4 flex items-center rounded-md bg-indigo-50 px-4 py-2 text-sm text-indigo-600 transition-colors duration-200 hover:text-indigo-700"
//                     >
//                       <FaPlusCircle className="mr-2 h-4 w-4" />
//                       Add Highlight
//                     </button>
//                   </div>

//                   {/* Action Buttons */}
//                   <div className="mt-8 flex flex-col items-center justify-between space-y-3 border-t border-gray-200 pt-6 sm:flex-row sm:space-y-0">
//                     <button
//                       onClick={() => handleRemoveWork(currentFormIndex)}
//                       disabled={workEntries.length <= 1}
//                       className={`flex items-center rounded-md px-3 py-2 transition-colors duration-200 ${
//                         workEntries.length <= 1
//                           ? "cursor-not-allowed bg-gray-100 text-gray-400"
//                           : "bg-red-50 text-red-600 hover:bg-red-100"
//                       }`}
//                     >
//                       <FaTrash className="h-3.5 w-3.5" />
//                     </button>

//                     <button
//                       onClick={handleAddWork}
//                       className="flex items-center rounded-md bg-indigo-50 px-3 py-2 text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
//                     >
//                       <FaPlus className="h-3.5 w-3.5" />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             )}

//             {/* Education Section */}
//             {activeSection === "education" && (
//               <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
//                 {/* Header */}
//                 <div className="mb-6 flex items-center border-b border-gray-200 pb-4">
//                   <FaGraduationCap className="mr-3 h-6 w-6 text-indigo-600" />
//                   <h2 className="text-xl font-bold">Education</h2>
//                 </div>

//                 <div className="space-y-6">
//                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                     {/* Institution Field */}
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaUniversity className="mr-2 h-4 w-4 text-gray-500" />
//                           <strong>Institution</strong>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Enter institution"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(
//                           "education-0-institution",
//                           educationEntries[0]?.institution
//                         )}
//                         onChange={(e) =>
//                           handleEducationChange(
//                             0,
//                             "institution",
//                             e.target.value
//                           )
//                         }
//                         required
//                         autoComplete="text"
//                       />
//                     </div>

//                     {/* Degree Field */}
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaScroll className="mr-2 h-4 w-4 text-gray-500" />
//                           <strong>Degree</strong>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="text"
//                         placeholder="Enter degree"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(
//                           "education-0-degree",
//                           educationEntries[0]?.degree
//                         )}
//                         onChange={(e) =>
//                           handleEducationChange(0, "degree", e.target.value)
//                         }
//                         required
//                         autoComplete="text"
//                       />
//                     </div>
//                   </div>

//                   <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
//                     {/* Start Date Field */}
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-500" />
//                           <strong>Start Date</strong>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="date"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(
//                           "education-0-startDate",
//                           educationEntries[0]?.startDate
//                         )}
//                         onChange={(e) =>
//                           handleEducationChange(0, "startDate", e.target.value)
//                         }
//                         required
//                             onBlur={() => validateDate(0)}
//                         autoComplete="text"
//                       />
//                     </div>

//                     {/* End Date Field */}
//                     <div>
//                       <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                         <div className="flex items-center">
//                           <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-500" />
//                           <strong>End Date</strong>
//                           <span className="ml-1 text-red-500">*</span>
//                         </div>
//                       </label>
//                       <input
//                         type="date"
//                         className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                         value={getInputValue(
//                           "education-0-endDate",
//                           educationEntries[0]?.endDate
//                         )}
//                         onChange={(e) =>
//                           handleEducationChange(0, "endDate", e.target.value)
//                         }
//                         required
//                         onBlur={() => validateDate(0)}
//                         autoComplete="text"
//                       />
//                     </div>
//                   </div>

//                   {/* Date validation error message */}
//                   {educationEntries[0]?.startDate &&
//                    educationEntries[0]?.endDate &&
//                    educationEntries[0].startDate > educationEntries[0].endDate && (
//                     <p className="mt-2 text-sm text-red-500">
//                       End date cannot be earlier than start date
//                     </p>
//                   )}
//                 </div>
//               </div>
//             )}

// {activeSection === "skills" && (
//   <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
//     {/* Header */}
//     <div className="mb-6 flex items-center border-b border-gray-200 pb-4">
//       <FaTag className="mr-3 h-6 w-6 text-indigo-600" />
//       <h2 className="text-xl font-bold">Skills</h2>
//     </div>

//     <div className="space-y-6">
//       {/* Skills Form */}
//       <div className="space-y-6">
//         {skills.map((skill, index) => (
//           <div
//             key={index}
//             className="grid grid-cols-1 gap-4 md:grid-cols-12"
//           >
//             {/* Skill Input */}
//             <div className="md:col-span-8">
//               <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 <div className="flex items-center">
//                   <FaTag className="mr-2 h-4 w-4 text-gray-500" />
//                   <strong>Skill</strong>
//                   <span className="ml-1 text-red-500">*</span>
//                 </div>
//               </label>
//               <input
//                 type="text"
//                 placeholder="Enter skill (e.g., JavaScript, Project Management)"
//                 className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                 value={getInputValue(`skill-${index}-name`, skill.name)}
//                 onChange={(e) => handleSkillChange(index, "name", e.target.value)}
//                 required
//                 autoComplete="text"
//               />
//             </div>

//             {/* Level Select */}
//             <div className="md:col-span-4">
//               <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 <div className="flex items-center">
//                   <FaChartLine className="mr-2 h-4 w-4 text-gray-500" />
//                   <strong>Level</strong>
//                   <span className="ml-1 text-red-500">*</span>
//                 </div>
//               </label>
//               <select
//                 className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                 value={getInputValue(`skill-${index}-level`, skill.level)}
//                 onChange={(e) => handleSkillChange(index, "level", e.target.value)}
//                 required
//                 autoComplete="text"
//                 >
//                 <option value="" disabled>Select level</option>
//                 {skillLevels.map((level) => (
//                   <option key={level} value={level}>
//                     {level}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Action Buttons */}
//       <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
//         <button
//           onClick={() => {
//             if (skills.length > 1) {
//               const newSkills = skills.slice(0, -1);
//               debouncedSetSkills(newSkills);
//             }
//           }}
//           disabled={skills.length <= 1}
//           className={`flex items-center rounded-md px-3 py-2 transition-colors duration-200 ${
//             skills.length <= 1
//               ? "cursor-not-allowed bg-gray-100 text-gray-400"
//               : "bg-red-50 text-red-600 hover:bg-red-100"
//           }`}
//         >
//           <FaTrash className="h-3.5 w-3.5" />
//         </button>

//         <button
//           onClick={() => debouncedSetSkills([...skills, { name: "", level: "Beginner" }])}
//           className="flex items-center rounded-md bg-indigo-50 px-3 py-2 text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
//         >
//           <FaPlus className="h-3.5 w-3.5" />
//         </button>
//       </div>
//     </div>
//   </div>
// )}

// {activeSection === "languages" && (
//   <div className="rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
//     {/* Header */}
//     <div className="mb-6 flex items-center border-b border-gray-200 pb-4">
//       <FaGlobe className="mr-3 h-6 w-6 text-indigo-600" />
//       <h2 className="text-xl font-bold">Languages</h2>
//     </div>

//     <div className="space-y-6">
//       {/* Languages Form */}
//       <div className="space-y-6">
//         {languages.map((lang, index) => (
//           <div
//             key={index}
//             className="grid grid-cols-1 gap-4 md:grid-cols-12"
//           >
//             {/* Language Input */}
//             <div className="md:col-span-8">
//               <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 <div className="flex items-center">
//                   <FaGlobe className="mr-2 h-4 w-4 text-gray-500" />
//                   <strong>Language</strong>
//                   <span className="ml-1 text-red-500">*</span>
//                 </div>
//               </label>
//               <input
//                 type="text"
//                 placeholder="Enter language (e.g., English, Spanish)"
//                 className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                 value={getInputValue(`language-${index}-language`, lang.language)}
//                 onChange={(e) => handleLanguageChange(index, "language", e.target.value)}
//                 required
//                 autoComplete="text"
//               />
//             </div>

//             {/* Fluency Select */}
//             <div className="md:col-span-4">
//               <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 <div className="flex items-center">
//                   <FaChartLine className="mr-2 h-4 w-4 text-gray-500" />
//                   <strong>Fluency</strong>
//                   <span className="ml-1 text-red-500">*</span>
//                 </div>
//               </label>
//               <select
//                 className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
//                 value={getInputValue(`language-${index}-fluency`, lang.fluency)}
//                 onChange={(e) => handleLanguageChange(index, "fluency", e.target.value)}
//                 required
//                 autoComplete="text"
//               >
//                 <option value="" disabled>Select fluency</option>
//                 {fluencyLevels.map((level) => (
//                   <option key={level} value={level}>
//                     {level}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Action Buttons */}
//       <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
//         <button
//           onClick={() => {
//             if (languages.length > 1) {
//               debouncedSetLanguages(languages.slice(0, -1));
//             }
//           }}
//           disabled={languages.length <= 1}
//           className={`flex items-center rounded-md px-3 py-2 transition-colors duration-200 ${
//             languages.length <= 1
//               ? "cursor-not-allowed bg-gray-100 text-gray-400"
//               : "bg-red-50 text-red-600 hover:bg-red-100"
//           }`}
//         >
//           <FaTrash className="h-3.5 w-3.5" />
//         </button>

//         <button
//           onClick={() => debouncedSetLanguages([...languages, { language: "", fluency: "Beginner" }])}
//           className="flex items-center rounded-md bg-indigo-50 px-3 py-2 text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
//         >
//           <FaPlus className="h-3.5 w-3.5" />
//         </button>
//       </div>
//     </div>
//   </div>
// )}
//           </div>
//           {/* Preview Section */}
//           {/* <div className="col-span-1 lg:col-span-4 lg:pl-8">
//             <ResumePreview
//               renderedHtml={renderedHtml}
//               getJson={() => {
//                 const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
//                   JSON.stringify(
//                     {
//                       basics,
//                       work: workEntries,
//                       education: educationEntries,
//                       skills,
//                       languages,
//                     },
//                     null,
//                     2
//                   )
//                 )}`;
//                 const link = document.createElement("a");
//                 link.href = jsonString;
//                 link.download = "resume_data.json";
//                 link.click();
//               }}
//               resumeJson={{
//                 basics,
//                 work: workEntries,
//                 education: educationEntries,
//                 skills,
//                 languages,
//               }}
//             />
//           </div> */}
// <div className="sticky top-24 col-span-1 lg:col-span-4 lg:pl-8">
//     {/* Makes preview stick while scrolling */}
//     <ResumePreview
//       renderedHtml={renderedHtml}
//       getJson={() => {
//         const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
//           JSON.stringify(
//             {
//               basics,
//               work: workEntries,
//               education: educationEntries,
//               skills,
//               languages,
//             },
//             null,
//             2
//           )
//         )}`;
//         const link = document.createElement("a");
//         link.href = jsonString;
//         link.download = "resume_data.json";
//         link.click();
//       }}
//       resumeJson={{
//         basics,
//         work: workEntries,
//         education: educationEntries,
//         skills,
//         languages,
//       }}
//     />
//   </div>

//         </div>
//       </main>

//       {showModal && (
//         <Modal
//           title="Authentication Error"
//           message={errorMessage}
//           onClose={handleClose}
//         />
//       )}
//     </div>

//   );
// }

// -------------------working fine code--------------------------------
"use client";
import Handlebars from "handlebars";
import Layout from "@/components/Common/Layout";
import Modal from "@/components/Common/Modal";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import ResumePreview from "./ResumeView";
import debounce from "lodash/debounce";
import moment from "moment";
import { countries } from "country-data";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";

import {
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaPlus,
  FaPlusCircle,
  FaMinusCircle,
  FaBuilding,
  FaBriefcase,
  FaCalendarAlt,
  FaFileAlt,
  FaUser,
  FaTag,
  FaEnvelope,
  FaPhone,
  FaMapMarker,
  FaGlobe,
  FaChartLine,
  FaCity,
  FaHashtag,
  FaLink,
  FaArrowAltCircleLeft,
  FaArrowAltCircleRight,
  FaGraduationCap,
  FaUniversity,
  FaScroll,
  FaHome,
  FaCode,
  FaLanguage,
} from "react-icons/fa";

// Cache for partials
const partialCache: Record<string, string> = {};
const DEBOUNCE_TIME = 500;

// Optimized fetchPartials function
const fetchPartials = async (partialsNeeded: string[]) => {
  const partials = [
    "about",
    "basics",
    "education",
    "info-tag",
    "languages",
    "resume-header",
    "skills",
    "summary",
    "social",
    "title",
    "work",
    "section-header",
  ];

  const partialPromises = partialsNeeded.map(async (partial) => {
    if (!partialCache[partial]) {
      try {
        const response = await fetch(`/templates/partials/${partial}.hbs`);
        if (!response.ok) throw new Error(`Failed to fetch ${partial}.hbs`);
        const partialString = await response.text();
        Handlebars.registerPartial(partial, partialString);
        partialCache[partial] = partialString;
      } catch (error) {
        // console.error(`Error fetching partial: ${partial}`, error);
      }
    }
  });

  await Promise.all(partialPromises);
};

const registerHelpers = () => {
  Handlebars.registerHelper({
    removeProtocol: (url: string) => url.replace(/.*?:\/\//g, ""),
    concat: (...args: any[]) =>
      args.filter((arg) => typeof arg !== "object").join(""),
    formatAddress: (...args: any[]) =>
      args.filter((arg) => typeof arg !== "object").join(" "),
    formatDate: (date: string) => moment(date).format("MM/YYYY"),
    lowercase: (s: string) => s.toLowerCase(),
    eq: (a: any, b: any) => a === b,
  });
};

const skillLevels = ["Beginner", "Intermediate", "Advanced", "Master"];
const fluencyLevels = ["Beginner", "Intermediate", "Advanced", "Fluent"];

export default function Assignment() {
  // State Management
  const [activeSection, setActiveSection] = useState<string>("basics");
  const [localInputs, setLocalInputs] = useState<Record<string, any>>({});
  const [skills, setSkills] = useState<{ name: string; level: string }[]>([
    { name: "", level: "" },
  ]);
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [currentFormIndex, setCurrentFormIndex] = useState<number>(0);
  // Add state for current education index
  const [currentEducationIndex, setCurrentEducationIndex] = useState<number>(0);
  // Add state for current language index
  const [currentLanguageIndex, setCurrentLanguageIndex] = useState<number>(0);
  const [currentSkillIndex, setCurrentSkillIndex] = useState<number>(0);
  const [languages, setLanguages] = useState<
    { language: string; fluency: string }[]
  >([{ language: "", fluency: "" }]);
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [countryCode, setCountryCode] = useState<string>("+1");
  const [fullPhoneNumber, setFullPhoneNumber] = useState<string>(
    `${countryCode}${phoneNumber}`
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: string;
    text: string;
  } | null>(null);

  // Initial States
  const [basics, setBasics] = useState<{
    name: string;
    label: string;
    email: string;
    phone: string;
    url: string;
    summary: string;
    location: {
      address: string;
      postalCode: string;
      city: string;
      countryCode: string;
    };
    profiles: { network: string; username: string; url: string }[];
  }>({
    name: "",
    label: "",
    email: "",
    phone: "",
    url: "",
    summary: "",
    location: {
      address: "",
      postalCode: "",
      city: "",
      countryCode: "",
    },
    profiles: [{ network: "", username: "", url: "" }],
  });

  const [workEntries, setWorkEntries] = useState<
    {
      company: string;
      position: string;
      startDate: string;
      endDate: string;
      summary: string;
      highlights: string[];
    }[]
  >([
    {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      summary: "",
      highlights: [""],
    },
  ]);

  const [educationEntries, setEducationEntries] = useState<
    {
      institution: string;
      degree: string;
      startDate: string;
      endDate: string;
      summary: string;
    }[]
  >([
    {
      institution: "",
      degree: "",
      startDate: "",
      endDate: "",
      summary: "",
    },
  ]);

  // Debounced setters
  const debouncedSetBasics = useMemo(
    () => debounce((value) => setBasics(value), DEBOUNCE_TIME),
    []
  );

  const debouncedSetSkills = useMemo(
    () => debounce((value) => setSkills(value), DEBOUNCE_TIME),
    []
  );

  const debouncedSetLanguages = useMemo(
    () => debounce((value) => setLanguages(value), DEBOUNCE_TIME),
    []
  );

  const debouncedSetWorkEntries = useMemo(
    () => debounce((value) => setWorkEntries(value), DEBOUNCE_TIME),
    []
  );

  // Helper Functions
  const getInputValue = (key: string, defaultValue: any) => {
    return localInputs[key] !== undefined ? localInputs[key] : defaultValue;
  };

  const handleBasicsChange = (field: string, value: any) => {
    const key = `basics-${field}`;
    setLocalInputs((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Use the debounced setter for updating the actual state
    debouncedSetBasics((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Modify the handleLocationChange function
  const handleLocationChange = (field: string, value: any) => {
    const key = `location-${field}`;
    setLocalInputs((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Use the debounced setter for updating the actual state
    debouncedSetBasics((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  // Handler to go to the previous language entry
  const handlePreviousLanguage = () => {
    setCurrentLanguageIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Handler to go to the next language entry
  const handleNextLanguage = () => {
    setCurrentLanguageIndex((prevIndex) =>
      Math.min(prevIndex + 1, languages.length - 1)
    );
  };

  // Handler to add a new language entry
  const handleAddLanguage = () => {
    setLanguages((prev) => [...prev, { language: "", fluency: "Beginner" }]);
    setCurrentLanguageIndex(languages.length);
  };

  // Handler to remove the current language entry
  const handleRemoveLanguage = (index: number) => {
    if (languages.length > 1) {
      setLanguages((prev) => prev.filter((_, i) => i !== index));
      if (currentLanguageIndex >= languages.length - 1) {
        setCurrentLanguageIndex(languages.length - 2);
      }
    }
  };
  // Handler to go to the previous education entry
  const handlePreviousEducation = () => {
    setCurrentEducationIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Handler to go to the next education entry
  const handleNextEducation = () => {
    setCurrentEducationIndex((prevIndex) =>
      Math.min(prevIndex + 1, educationEntries.length - 1)
    );
  };

  // Handler to add a new education entry
  const handleAddEducation = () => {
    setEducationEntries((prev) => [
      ...prev,
      { institution: "", degree: "", startDate: "", endDate: "", summary: "" },
    ]);
    setCurrentEducationIndex(educationEntries.length);
  };

  // Handler to remove the current education entry
  const handleRemoveEducation = (index: number) => {
    if (educationEntries.length > 1) {
      setEducationEntries((prev) => prev.filter((_, i) => i !== index));
      if (currentEducationIndex >= educationEntries.length - 1) {
        setCurrentEducationIndex(educationEntries.length - 2);
      }
    }
  };

  // Modify the handleProfileChange function
  const handleProfileChange = (index: number, field: string, value: any) => {
    const key = `profile-${index}-${field}`;
    setLocalInputs((prev) => ({
      ...prev,
      [key]: value,
    }));

    // Use the debounced setter for updating the actual state
    debouncedSetBasics((prev) => ({
      ...prev,
      profiles: prev.profiles.map((profile, i) =>
        i === index ? { ...profile, [field]: value } : profile
      ),
    }));
  };

  // Work Entry Handlers
  const handleWorkChange = (index: number, field: string, value: any) => {
    const key = `work-${index}-${field}`;
    setLocalInputs((prev) => ({
      ...prev,
      [key]: value,
    }));

    const updatedEntries = workEntries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    debouncedSetWorkEntries(updatedEntries);
  };

  const handleHighlightChange = (
    workIndex: number,
    highlightIndex: number,
    value: string
  ) => {
    const key = `work-${workIndex}-highlight-${highlightIndex}`;
    setLocalInputs((prev) => ({
      ...prev,
      [key]: value,
    }));

    const updatedEntries = workEntries.map((entry, i) =>
      i === workIndex
        ? {
            ...entry,
            highlights: entry.highlights.map((h, hi) =>
              hi === highlightIndex ? value : h
            ),
          }
        : entry
    );
    debouncedSetWorkEntries(updatedEntries);
  };

  // Education Handlers
  const handleEducationChange = (index: number, field: string, value: any) => {
    const key = `education-${index}-${field}`;
    setLocalInputs((prev) => ({
      ...prev,
      [key]: value,
    }));

    setEducationEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  // Skills and Languages Handlers
  const handleSkillChange = (index: number, field: string, value: any) => {
    const key = `skill-${index}-${field}`;
    setLocalInputs((prev) => ({
      ...prev,
      [key]: value,
    }));

    debouncedSetSkills(
      skills.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleLanguageChange = (index: number, field: string, value: any) => {
    const key = `language-${index}-${field}`;
    setLocalInputs((prev) => ({
      ...prev,
      [key]: value,
    }));

    debouncedSetLanguages(
      languages.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  // Navigation Handlers
  const handlePrevious = () => {
    setCurrentFormIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  const handleNext = () => {
    setCurrentFormIndex((prevIndex) =>
      Math.min(prevIndex + 1, workEntries.length - 1)
    );
  };
  // Handler to go to the previous skill entry
  const handlePreviousSkill = () => {
    setCurrentSkillIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Handler to go to the next skill entry
  const handleNextSkill = () => {
    setCurrentSkillIndex((prevIndex) =>
      Math.min(prevIndex + 1, skills.length - 1)
    );
  };

  // Handler to add a new skill entry
  const handleAddSkill = () => {
    setSkills((prev) => [...prev, { name: "", level: "Beginner" }]);
    setCurrentSkillIndex(skills.length);
  };

  // Handler to remove the current skill entry
  const handleRemoveSkill = (index: number) => {
    if (skills.length > 1) {
      setSkills((prev) => prev.filter((_, i) => i !== index));
      if (currentSkillIndex >= skills.length - 1) {
        setCurrentSkillIndex(skills.length - 2);
      }
    }
  };
  // Function to handle previous profile navigation
  const handlePreviousProfile = () => {
    setCurrentProfileIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Function to handle next profile navigation
  const handleNextProfile = () => {
    setCurrentProfileIndex((prevIndex) =>
      Math.min(prevIndex + 1, basics.profiles.length - 1)
    );
  };
  // Function to add a new profile
  // const handleAddProfile = () => {
  //   setBasics((prev) => ({
  //     ...prev,
  //     profiles: [...prev.profiles, { network: "", username: "", url: "" }],
  //   }));
  //   setCurrentProfileIndex(basics.profiles.length);
  // };

  // // Function to remove a profile
  // const handleRemoveProfile = (index: number) => {
  //   if (basics.profiles.length > 1) {
  //     setBasics((prev) => ({
  //       ...prev,
  //       profiles: prev.profiles.filter((_, i) => i !== index),
  //     }));
  //     if (currentProfileIndex >= basics.profiles.length - 1) {
  //       setCurrentProfileIndex(basics.profiles.length - 2);
  //     }
  //   }
  // };
  // Updated Skills Section

  // Phone Number Handlers
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const newCountryCode = selectedValue.split("-")[0];
    const newFullPhoneNumber = `${newCountryCode}${phoneNumber}`;

    setCountryCode(newCountryCode);
    setFullPhoneNumber(newFullPhoneNumber);
    handleBasicsChange("phone", newFullPhoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enteredPhone = e.target.value.trim();
    setPhoneNumber(enteredPhone);

    const updatedFullPhoneNumber = `${countryCode}${enteredPhone}`;
    setFullPhoneNumber(updatedFullPhoneNumber);
    handleBasicsChange("phone", updatedFullPhoneNumber);
  };

  // Add/Remove Entry Handlers
  const handleAddWork = () => {
    const newEntry = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      summary: "",
      highlights: [""],
    };
    setWorkEntries((prev) => [...prev, newEntry]);
    setCurrentFormIndex(workEntries.length);
  };

  const handleRemoveWork = (index: number) => {
    if (workEntries.length > 1) {
      setWorkEntries((prev) => prev.filter((_, i) => i !== index));
      if (currentFormIndex >= workEntries.length - 1) {
        setCurrentFormIndex(workEntries.length - 2);
      }
    }
  };

  // / Function to add a new profile
  const handleAddProfile = () => {
    setBasics((prev) => ({
      ...prev,
      profiles: [...prev.profiles, { network: "", username: "", url: "" }],
    }));
    setCurrentProfileIndex(basics.profiles.length);
  };

  // Function to remove a profile
  const handleRemoveProfile = (index: number) => {
    if (basics.profiles.length > 1) {
      setBasics((prev) => ({
        ...prev,
        profiles: prev.profiles.filter((_, i) => i !== index),
      }));
      if (currentProfileIndex >= basics.profiles.length - 1) {
        setCurrentProfileIndex(basics.profiles.length - 2);
      }
    }
  };
  // Date Validation
  const validateDate = (index: number) => {
    const entry = educationEntries[index];
    if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) {
      alert("End date cannot be earlier than the start date.");
    }
  };

  // Template Rendering
  const renderTemplate = useCallback(async () => {
    try {
      const partialsNeeded: string[] = [];
      if (basics) {
        partialsNeeded.push(
          "about",
          "resume-header",
          "summary",
          "title",
          "info-tag",
          "social",
          "section-header"
        );
      }
      if (workEntries.length > 0) partialsNeeded.push("work");
      if (educationEntries.length > 0) partialsNeeded.push("education");
      if (skills.length > 0) partialsNeeded.push("skills");
      if (languages.length > 0) partialsNeeded.push("languages");

      await fetchPartials(partialsNeeded);

      const response = await fetch("/templates/resume.hbs");
      if (!response.ok) {
        throw new Error("Failed to fetch resume.hbs");
      }
      const templateString = await response.text();
      const template = Handlebars.compile(templateString);

      const resumeJson = {
        basics,
        work: workEntries,
        education: educationEntries,
        skills,
        languages,
      };

      const html = template(resumeJson);
      setRenderedHtml(html);
    } catch (error) {
      // console.error("Error rendering template", error);
    }
  }, [basics, workEntries, educationEntries, skills, languages]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      // Simulate save operation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setSaveMessage({ type: "success", text: "Resume saved successfully!" });
    } catch (error) {
      setSaveMessage({
        type: "error",
        text: "Failed to save resume. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const sections = [
    "basics",
    "social",
    "work",
    "education",
    "skills",
    "languages",
  ];
  const [activeSectionIndex, setActiveSectionIndex] = useState(
    sections.indexOf(activeSection)
  );

  // Update active section based on index
  useEffect(() => {
    setActiveSection(sections[activeSectionIndex]);
  }, [activeSectionIndex]);

  // Handler to go to the next section
  const handleNextSection = () => {
    setActiveSectionIndex((prevIndex) =>
      Math.min(prevIndex + 1, sections.length - 1)
    );
  };

  // Handler to go to the previous section
  const handlePreviousSection = () => {
    setActiveSectionIndex((prevIndex) => Math.max(prevIndex - 1, 0));
  };

  // Effects
  useEffect(() => {
    registerHelpers();
    const debouncedRender = debounce(renderTemplate, DEBOUNCE_TIME);
    debouncedRender();

    return () => {
      debouncedRender.cancel();
    };
  }, [renderTemplate]);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { valid } = await isAuthenticated();
        if (!valid) {
          router.push("/login");
        } else {
          setLoading(false);
        }
      } catch (error) {
        // console.error("Error checking authentication:", error);
        router.push("/login");
      }
    };

    checkAuthentication();
  }, [router]);

  // Cleanup
  useEffect(() => {
    return () => {
      debouncedSetBasics.cancel();
      debouncedSetSkills.cancel();
      debouncedSetLanguages.cancel();
      debouncedSetWorkEntries.cancel();
    };
  }, [
    debouncedSetBasics,
    debouncedSetSkills,
    debouncedSetLanguages,
    debouncedSetWorkEntries,
  ]);

  const handleClose = () => {
    localStorage.removeItem("access_token");
    sessionStorage.clear();
    router.push("/login");
    setShowModal(false);
  };

  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 pb-6 dark:bg-gray-800 dark:text-white sm:px-6">
        <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
            Create Resume
          </h1>
          <div className="hidden sm:block">
            <Layout currentPage="Resume" />
          </div>
        </nav>

        {/* Navigation Buttons */}
        <div className="mb-6 flex justify-between">
          <button
            onClick={handlePreviousSection}
            disabled={activeSectionIndex === 0}
            className={`flex items-center gap-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 transition-all duration-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 ${
              activeSectionIndex === 0
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-gradient-to-br hover:from-indigo-900 hover:to-purple-400 hover:text-white"
            }`}
          >
            <FaArrowAltCircleLeft className="h-5 w-5" />
            Previous
          </button>

          <button
            onClick={handleNextSection}
            disabled={activeSectionIndex === sections.length - 1}
            className={`flex items-center gap-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 transition-all duration-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 ${
              activeSectionIndex === sections.length - 1
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-gradient-to-br hover:from-indigo-900 hover:to-purple-400 hover:text-white"
            }`}
          >
            Next
            <FaArrowAltCircleRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-8">
          {/* Section Navigation */}
          <div className="col-span-1 lg:col-span-1">
            <ul className="space-y-2">
              {sections.map((section, index) => (
                <li key={section}>
                  <button
                    onClick={() => {
                      setActiveSection(section);
                      setActiveSectionIndex(index);
                    }}
                    className={`w-full border-l-4 px-4 py-2 text-left font-semibold transition-all ${
                      activeSection === section
                        ? "border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300"
                        : "border-transparent text-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {section.charAt(0).toUpperCase() + section.slice(1)}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <button
                onClick={handleSave}
                className={`w-3/4 rounded-md bg-gradient-to-br from-indigo-900 to-purple-400 py-1 px-4 text-sm font-bold text-white transition duration-500 hover:bg-opacity-90 lg:text-base ${
                  isSaving ? "cursor-not-allowed opacity-50" : ""
                }`}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="mr-3 h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
              {saveMessage && (
                <p
                  className={`mt-2 text-sm ${
                    saveMessage.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {saveMessage.text}
                </p>
              )}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3">
            {/* Basics Section */}
            {activeSection === "basics" && (
              <div className="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
                {/* Header */}
                <div className="mb-6 flex items-center border-b border-gray-200 pb-4">
                  <FaUser className="mr-3 h-6 w-6 text-indigo-600" />
                  <h2 className="text-xl font-bold">Basic Information</h2>
                </div>

                {/* Main Form Content */}
                <div className="space-y-6">
                  {/* Personal Information Grid */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Name Field */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaUser className="mr-2 h-4 w-4 text-gray-500" />
                          <span>Name</span>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your name"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(`basics-name`, basics.name)}
                        onChange={(e) =>
                          handleBasicsChange("name", e.target.value)
                        }
                        required
                        onKeyDown={(e) => e.stopPropagation()}
                        autoComplete="text"
                      />
                    </div>

                    {/* Label/Title Field */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaTag className="mr-2 h-4 w-4 text-gray-500" />
                          <span>Professional Title</span>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter your professional title"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(`basics-label`, basics.label)}
                        onChange={(e) =>
                          handleBasicsChange("label", e.target.value)
                        }
                        required
                        onKeyDown={(e) => e.stopPropagation()}
                        autoComplete="text"
                      />
                    </div>

                    {/* Email Field */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaEnvelope className="mr-2 h-4 w-4 text-gray-500" />
                          <span>Email Address</span>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(`basics-email`, basics.email)}
                        onChange={(e) =>
                          handleBasicsChange("email", e.target.value)
                        }
                        required
                        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                        title="Please enter a valid email address (example@domain.com)"
                        onKeyDown={(e) => e.stopPropagation()}
                        autoComplete="email"
                      />
                    </div>

                    {/* Phone Field */}
                    {/* Phone Field */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaPhone className="mr-2 h-4 w-4 text-gray-500" />

                          <span>Phone Number</span>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>

                      <div className="flex space-x-2">
                        <select
                          id="country-code"
                          name="country-code"
                          className="w-1/3 rounded-md border border-gray-300 bg-white py-3 px-2 text-xs text-gray-700 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                          value={countryCode}
                          onChange={handleCountryChange}
                          required
                        >
                          {/* Ensure US is the first option */}

                          <option
                            value="+1"
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          >
                            US +1
                          </option>

                          {countries.all

                            .filter((country) => country.alpha2 !== "US")

                            .map((country) => (
                              <option
                                key={country.alpha2}
                                value={country.countryCallingCodes[0] || ""}
                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                              >
                                {country.alpha2}{" "}
                                {country.countryCallingCodes[0] || ""}
                              </option>
                            ))}
                        </select>

                        <input
                          type="tel"
                          placeholder="phone number"
                          className="w-3/4 rounded-md border border-gray-300 p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          value={phoneNumber}
                          onChange={handlePhoneChange}
                          required
                          pattern="[0-9]{3,15}"
                          minLength={9}
                          maxLength={15}
                          title="Phone number must be between 9 and 15 digits"
                          autoComplete="tel"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <span>Professional Summary</span>
                        <span className="ml-1 text-red-500">*</span>
                      </div>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Write a brief professional summary"
                      className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      value={getInputValue("basics-summary", basics.summary)}
                      onChange={(e) =>
                        handleBasicsChange("summary", e.target.value)
                      }
                      required
                      onKeyDown={(e) => e.stopPropagation()}
                      autoComplete="text"
                    />
                  </div>

                  {/* Location Information */}
                  <div>
                    <h3 className="mb-4 flex items-center text-lg font-semibold">
                      <FaMapMarker className="mr-2 h-5 w-5 text-indigo-600" />
                      Location Details
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {[
                        {
                          field: "address",
                          icon: FaHome,
                          placeholder: "Street address",
                        },
                        {
                          field: "postalCode",
                          icon: FaHashtag,
                          placeholder: "Postal code",
                        },
                        { field: "city", icon: FaCity, placeholder: "City" },
                        {
                          field: "countryCode",
                          icon: FaGlobe,
                          placeholder: "Country code",
                        },
                      ].map(({ field, icon: Icon, placeholder }, index) => (
                        <div key={index}>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            <div className="flex items-center">
                              <Icon className="mr-2 h-4 w-4 text-gray-500" />
                              <span>
                                {field.charAt(0).toUpperCase() + field.slice(1)}
                              </span>
                              <span className="ml-1 text-red-500">*</span>
                            </div>
                          </label>
                          <input
                            type="text"
                            placeholder={placeholder}
                            className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                            value={getInputValue(
                              `location-${field}`,
                              basics.location[field]
                            )}
                            onChange={(e) =>
                              handleLocationChange(field, e.target.value)
                            }
                            required
                            pattern={
                              field === "postalCode" ? "[0-9]{5,10}" : ".*"
                            }
                            title={
                              field === "postalCode"
                                ? "Postal code must be between 5 and 10 digits"
                                : ""
                            }
                            onKeyDown={(e) => e.stopPropagation()}
                            autoComplete="text"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Social Profiles Section */}
                </div>
              </div>
            )}
            {activeSection === "social" && (
              <div className="flex flex-col space-y-8 rounded-lg border border-gray-300 bg-white p-8 shadow-lg dark:border-gray-600 dark:bg-gray-700">
                {/* Header with Navigation */}
                <div className="flex flex-col border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="mb-4 flex items-center text-xl font-bold text-indigo-600 sm:mb-0">
                    <FaLink className="mr-2 h-5 w-5" />
                    Social Profiles
                  </h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handlePreviousProfile}
                      disabled={currentProfileIndex === 0}
                      className={`flex items-center transition-colors duration-200 ${
                        currentProfileIndex === 0
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                      {currentProfileIndex + 1} of {basics.profiles.length}
                    </span>

                    <button
                      onClick={handleNextProfile}
                      disabled={
                        currentProfileIndex === basics.profiles.length - 1
                      }
                      className={`flex items-center transition-colors duration-200 ${
                        currentProfileIndex === basics.profiles.length - 1
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Profile Fields */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Network Selection */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaGlobe className="mr-2 h-4 w-4 text-gray-500" />
                          <span>Network</span>
                          {/* <span className="ml-1 text-red-500">*</span> */}
                        </div>
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `profile-${currentProfileIndex}-network`,
                          basics.profiles[currentProfileIndex]?.network
                        )}
                        onChange={(e) =>
                          handleProfileChange(
                            currentProfileIndex,
                            "network",
                            e.target.value
                          )
                        }
                        required
                      >
                        <option value="" disabled>
                          Select network
                        </option>
                        <option value="GitHub">GitHub</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Twitter">Twitter</option>
                        <option value="LinkedIn">LinkedIn</option>
                      </select>
                    </div>

                    {/* Username Field */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaUser className="mr-2 h-4 w-4 text-gray-500" />
                          <span>Username</span>
                          {/* <span className="ml-1 text-red-500">*</span> */}
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter username"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `profile-${currentProfileIndex}-username`,
                          basics.profiles[currentProfileIndex]?.username
                        )}
                        onChange={(e) =>
                          handleProfileChange(
                            currentProfileIndex,
                            "username",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>

                    {/* URL Field */}
                    <div className="col-span-2">
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaLink className="mr-2 h-4 w-4 text-gray-500" />
                          <span>Profile URL</span>
                          {/* <span className="ml-1 text-red-500">*</span> */}
                        </div>
                      </label>
                      <input
                        type="url"
                        placeholder="https://..."
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 shadow-sm transition duration-150 ease-in-out focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `profile-${currentProfileIndex}-url`,
                          basics.profiles[currentProfileIndex]?.url
                        )}
                        onChange={(e) =>
                          handleProfileChange(
                            currentProfileIndex,
                            "url",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="url"
                        pattern="https?://.+|ftp://.+"
                        title="Please enter a valid URL starting with http or https"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                  <button
                    onClick={() => handleRemoveProfile(currentProfileIndex)}
                    disabled={basics.profiles.length <= 1}
                    className={`flex items-center rounded-md px-4 py-2 transition-colors duration-200 ${
                      basics.profiles.length <= 1
                        ? "cursor-not-allowed bg-gray-100 text-gray-400"
                        : "bg-gray-50 text-gray-600 hover:bg-red-100"
                    }`}
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>

                  <button
                    onClick={handleAddProfile}
                    className="flex items-center rounded-md bg-indigo-50 px-4 py-2 text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
                  >
                    <FaPlus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Work Section */}
            {activeSection === "work" && (
              <div className="flex h-full flex-col justify-between rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
                {/* Header with Navigation */}
                <div className="mb-6 flex flex-col border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="mb-4 flex items-center text-xl font-bold sm:mb-0">
                    <FaBriefcase className="mr-2 h-5 w-5 text-indigo-600" />
                    Work Experience
                  </h2>
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={handlePrevious}
                      disabled={currentFormIndex === 0}
                      className={`flex items-center transition-colors duration-200 ${
                        currentFormIndex === 0
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                      {currentFormIndex + 1} of {workEntries.length}
                    </span>

                    <button
                      onClick={handleNext}
                      disabled={currentFormIndex === workEntries.length - 1}
                      className={`flex items-center transition-colors duration-200 ${
                        currentFormIndex === workEntries.length - 1
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Company and Position Fields */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaBuilding className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Company</strong>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter company name"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `work-${currentFormIndex}-company`,
                          workEntries[currentFormIndex]?.company
                        )}
                        onChange={(e) =>
                          handleWorkChange(
                            currentFormIndex,
                            "company",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaBriefcase className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Position</strong>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter position"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `work-${currentFormIndex}-position`,
                          workEntries[currentFormIndex]?.position
                        )}
                        onChange={(e) =>
                          handleWorkChange(
                            currentFormIndex,
                            "position",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>
                  </div>

                  {/* Date Fields */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Start Date</strong>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `work-${currentFormIndex}-startDate`,
                          workEntries[currentFormIndex]?.startDate
                        )}
                        onChange={(e) =>
                          handleWorkChange(
                            currentFormIndex,
                            "startDate",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaCalendarAlt className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>End Date</strong>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `work-${currentFormIndex}-endDate`,
                          workEntries[currentFormIndex]?.endDate
                        )}
                        onChange={(e) =>
                          handleWorkChange(
                            currentFormIndex,
                            "endDate",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>
                  </div>

                  {/* Summary Field */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <FaFileAlt className="mr-2 h-4 w-4 text-gray-500" />
                        <strong>Summary</strong>
                        {/* <span className="ml-1 text-red-500">*</span> */}
                      </div>
                    </label>
                    <textarea
                      placeholder="Enter work summary"
                      className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      value={getInputValue(
                        `work-${currentFormIndex}-summary`,
                        workEntries[currentFormIndex]?.summary
                      )}
                      onChange={(e) =>
                        handleWorkChange(
                          currentFormIndex,
                          "summary",
                          e.target.value
                        )
                      }
                      rows={4}
                      required
                      autoComplete="text"
                    />
                  </div>

                  {/* Highlights Section */}
                  <div className="space-y-3">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <FaFileAlt className="mr-2 h-4 w-4 text-gray-500" />
                        <strong>Highlights</strong>
                      </div>
                    </label>
                    <div className="space-y-3">
                      {workEntries[currentFormIndex]?.highlights.map(
                        (highlight, hIndex) => (
                          <div
                            key={hIndex}
                            className="group flex items-center space-x-3"
                          >
                            <input
                              type="text"
                              placeholder="Enter highlight"
                              className="flex-1 rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              value={getInputValue(
                                `work-${currentFormIndex}-highlight-${hIndex}`,
                                highlight
                              )}
                              onChange={(e) =>
                                handleHighlightChange(
                                  currentFormIndex,
                                  hIndex,
                                  e.target.value
                                )
                              }
                            />
                            {hIndex > 0 && (
                              <button
                                onClick={() => {
                                  const newHighlights = [
                                    ...workEntries[currentFormIndex].highlights,
                                  ];
                                  newHighlights.splice(hIndex, 1);
                                  handleWorkChange(
                                    currentFormIndex,
                                    "highlights",

                                    newHighlights
                                  );
                                }}
                                className="text-gray-400 transition-colors duration-200 hover:text-gray-500"
                                title="Remove highlight"
                              >
                                <FaMinusCircle className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    {/* Add Highlight Button */}
                    <button
                      onClick={() => {
                        const newHighlights = [
                          ...workEntries[currentFormIndex].highlights,
                          "",
                        ];
                        handleWorkChange(
                          currentFormIndex,
                          "highlights",
                          newHighlights
                        );
                      }}
                      className="mt-4 flex items-center rounded-md bg-indigo-50 px-4 py-2 text-sm text-indigo-600 transition-colors duration-200 hover:text-indigo-700"
                    >
                      <FaPlusCircle className="mr-2 h-4 w-4" />
                      Add Highlight
                    </button>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-col items-center justify-between space-y-3 border-t border-gray-200 pt-6 sm:flex-row sm:space-y-0">
                    <button
                      onClick={() => handleRemoveWork(currentFormIndex)}
                      disabled={workEntries.length <= 1}
                      className={`flex items-center rounded-md px-3 py-2 transition-colors duration-200 ${
                        workEntries.length <= 1
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : "bg-red-50 text-gray-600 hover:bg-red-100"
                      }`}
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={handleAddWork}
                      className="flex items-center rounded-md bg-indigo-50 px-3 py-2 text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
                    >
                      <FaPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Education Section */}

            {/* -------------------------------------------------- */}

            {/* // Skills Section */}

            {/* ----------------------------------------------------- */}
            {/* // Languages Section */}

            {/* // Updated Languages Section */}

            {activeSection === "languages" && (
              <div className="flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
                {/* Header with Navigation */}
                <div className="mb-6 flex flex-col border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="mb-4 flex items-center text-xl font-bold sm:mb-0">
                    <FaGlobe className="mr-2 h-5 w-5 text-indigo-600" />
                    Languages
                  </h2>
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={handlePreviousLanguage}
                      disabled={currentLanguageIndex === 0}
                      className={`flex items-center transition-colors duration-200 ${
                        currentLanguageIndex === 0
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                      {currentLanguageIndex + 1} of {languages.length}
                    </span>

                    <button
                      onClick={handleNextLanguage}
                      disabled={currentLanguageIndex === languages.length - 1}
                      className={`flex items-center transition-colors duration-200 ${
                        currentLanguageIndex === languages.length - 1
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Language and Fluency Fields */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaLanguage className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Language</strong>
                          {/* <span className="ml-1 text-red-500">*</span> */}
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter language (e.g., English, Spanish)"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `language-${currentLanguageIndex}-language`,
                          languages[currentLanguageIndex]?.language
                        )}
                        onChange={(e) =>
                          handleLanguageChange(
                            currentLanguageIndex,
                            "language",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaChartLine className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Fluency</strong>
                          {/* <span className="ml-1 text-red-500">*</span> */}
                        </div>
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `language-${currentLanguageIndex}-fluency`,
                          languages[currentLanguageIndex]?.fluency
                        )}
                        onChange={(e) =>
                          handleLanguageChange(
                            currentLanguageIndex,
                            "fluency",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      >
                        <option value="" disabled>
                          Select fluency
                        </option>
                        {fluencyLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                    <button
                      onClick={() => handleRemoveLanguage(currentLanguageIndex)}
                      disabled={languages.length <= 1}
                      className={`flex items-center rounded-md px-3 py-2 transition-colors duration-200 ${
                        languages.length <= 1
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : "bg-red-50 text-gray-600 hover:bg-red-100"
                      }`}
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={handleAddLanguage}
                      className="flex items-center rounded-md bg-indigo-50 px-3 py-2 text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
                    >
                      <FaPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------------------------------------- */}
            {/* / Education Section */}
            {activeSection === "education" && (
              <div className="flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
                {/* Header with Navigation */}
                <div className="mb-6 flex flex-col border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="mb-4 flex items-center text-xl font-bold sm:mb-0">
                    <FaGraduationCap className="mr-2 h-5 w-5 text-indigo-600" />
                    Education
                  </h2>
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={handlePreviousEducation}
                      disabled={currentEducationIndex === 0}
                      className={`flex items-center transition-colors duration-200 ${
                        currentEducationIndex === 0
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                      {currentEducationIndex + 1} of {educationEntries.length}
                    </span>

                    <button
                      onClick={handleNextEducation}
                      disabled={
                        currentEducationIndex === educationEntries.length - 1
                      }
                      className={`flex items-center transition-colors duration-200 ${
                        currentEducationIndex === educationEntries.length - 1
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Institution and Degree Fields */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaUniversity className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Institution</strong>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter institution"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `education-${currentEducationIndex}-institution`,
                          educationEntries[currentEducationIndex]?.institution
                        )}
                        onChange={(e) =>
                          handleEducationChange(
                            currentEducationIndex,
                            "institution",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaScroll className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Degree</strong>
                          <span className="ml-1 text-red-500">*</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter degree"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `education-${currentEducationIndex}-degree`,
                          educationEntries[currentEducationIndex]?.degree
                        )}
                        onChange={(e) =>
                          handleEducationChange(
                            currentEducationIndex,
                            "degree",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                    <button
                      onClick={() =>
                        handleRemoveEducation(currentEducationIndex)
                      }
                      disabled={educationEntries.length <= 1}
                      className={`flex items-center rounded-md px-3 py-2 transition-colors duration-200 ${
                        educationEntries.length <= 1
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : "bg-red-50 text-gray-600 hover:bg-red-100"
                      }`}
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={handleAddEducation}
                      className="flex items-center rounded-md bg-indigo-50 px-3 py-2 text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
                    >
                      <FaPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "skills" && (
              <div className="flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-md dark:border-gray-600 dark:bg-gray-700">
                {/* Header with Navigation */}
                <div className="mb-6 flex flex-col border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="mb-4 flex items-center text-xl font-bold sm:mb-0">
                    <FaTag className="mr-2 h-5 w-5 text-indigo-600" />
                    Skills
                  </h2>
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={handlePreviousSkill}
                      disabled={currentSkillIndex === 0}
                      className={`flex items-center transition-colors duration-200 ${
                        currentSkillIndex === 0
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronLeft className="h-4 w-4" />
                    </button>

                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                      {currentSkillIndex + 1} of {skills.length}
                    </span>

                    <button
                      onClick={handleNextSkill}
                      disabled={currentSkillIndex === skills.length - 1}
                      className={`flex items-center transition-colors duration-200 ${
                        currentSkillIndex === skills.length - 1
                          ? "cursor-not-allowed text-gray-300"
                          : "text-gray-600 hover:text-indigo-600"
                      }`}
                    >
                      <FaChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Skill and Level Fields */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaCode className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Skill</strong>
                        </div>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter skill (e.g., JavaScript, Project Management)"
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `skill-${currentSkillIndex}-name`,
                          skills[currentSkillIndex]?.name
                        )}
                        onChange={(e) =>
                          handleSkillChange(
                            currentSkillIndex,
                            "name",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="flex items-center">
                          <FaChartLine className="mr-2 h-4 w-4 text-gray-500" />
                          <strong>Level</strong>
                        </div>
                      </label>
                      <select
                        className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        value={getInputValue(
                          `skill-${currentSkillIndex}-level`,
                          skills[currentSkillIndex]?.level
                        )}
                        onChange={(e) =>
                          handleSkillChange(
                            currentSkillIndex,
                            "level",
                            e.target.value
                          )
                        }
                        required
                        autoComplete="text"
                      >
                        <option value="" disabled>
                          Select level
                        </option>
                        {skillLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                    <button
                      onClick={() => handleRemoveSkill(currentSkillIndex)}
                      disabled={skills.length <= 1}
                      className={`flex items-center rounded-md px-3 py-2 transition-colors duration-200 ${
                        skills.length <= 1
                          ? "cursor-not-allowed bg-gray-100 text-gray-400"
                          : "bg-red-50 text-gray-600 hover:bg-red-100"
                      }`}
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={handleAddSkill}
                      className="flex items-center rounded-md bg-indigo-50 px-3 py-2 text-indigo-600 transition-colors duration-200 hover:bg-indigo-100"
                    >
                      <FaPlus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/*------------------------------------------------------  */}

          {/* Preview Section */}
          <div className="sticky top-24 col-span-1 lg:col-span-4 lg:pl-8">
            <ResumePreview
              renderedHtml={renderedHtml}
              getJson={() => {
                const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify(
                    {
                      basics,
                      work: workEntries,
                      education: educationEntries,
                      skills,
                      languages,
                    },
                    null,
                    2
                  )
                )}`;
                const link = document.createElement("a");
                link.href = jsonString;
                link.download = "resume_data.json";
                link.click();
              }}
              resumeJson={{
                basics,
                work: workEntries,
                education: educationEntries,
                skills,
                languages,
              }}
            />
          </div>
        </div>
      </main>

      {showModal && (
        <Modal
          title="Authentication Error"
          message={errorMessage}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

// -------------------working fine code--------------------------------

// -------------------new
