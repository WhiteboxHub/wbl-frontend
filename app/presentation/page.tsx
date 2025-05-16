"use client";
import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { isAuthenticated } from "@/utils/auth";
// import Modal from "@/components/Common/Modal";
import Layout from "@/components/Common/Layout";
import ResourcesTable from "@/components/Common/resourcesTable";
import CourseNavigation from "@/components/Common/CourseNavigation";

type ComponentType =
  | "Presentations"
  | "Cheatsheets"
  | "Diagrams"
  | "Installations"
  | "Newsletters"
  | "Books"
  | "Softwares";

const buttons = [
  { type: "Presentations", label: "Presentations" },
  { type: "Cheatsheets", label: "Cheatsheets" },
  { type: "Diagrams", label: "Diagrams" },
  { type: "Softwares", label: "Softwares" },
  { type: "Installations", label: "Installations" },
  { type: "Books", label: "Books" },
  { type: "Newsletters", label: "Newsletters" },
];

export default function Presentation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const course = searchParams.get("course") || "ML";

  const [activeComponent, setActiveComponent] =
    useState<ComponentType>("Presentations");
  const [loading, setLoading] = useState<boolean>(false);
  // const [errorMessage, setErrorMessage] = useState("");
  // const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const { valid, message } = await isAuthenticated();
        if (!valid) {
          // setErrorMessage(message);
          // setShowModal(true);
          router.push("/login");
        } else {
          setLoading(false);
        }
      } catch (error) {
        // console.error("Error while checking authentication:", error);
        // setErrorMessage("An error occurred while checking authentication");
        // setShowModal(true);
        router.push("/login");
      }
    };

    checkAuthentication();
  }, [router]);

  const handleButtonClick = (component: ComponentType) => {
    setActiveComponent(component);
  };

  if (loading) {
    return (
      <div className="mt-32 flex h-screen items-center justify-center pb-24 text-xl text-dark dark:text-white sm:text-4xl md:text-5xl lg:text-6xl">
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

  // const handleClose = () => {
  //   localStorage.removeItem("access_token");
  //   sessionStorage.clear();
  //   router.push("/login");
  //   return setShowModal(false);
  // };

  return (
    <div>
      <main className="container">
        {/* <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6"> */}
        <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
          <h1 className=" text-center  text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl ">
            Course Material
            <span className="text-lg font-light sm:text-2xl"> (PDF)</span>
          </h1>
          <div className="hidden  sm:block">
            <Layout currentPage="Schedule" />
          </div>
        </nav>
        <CourseNavigation />
        <section className="mb-8 flex flex-col justify-start sm:flex-row">
          <div className="mt-10 flex justify-center sm:w-1/4">
            <div className="flex flex-col">
              {buttons.map((button) => (
                <button
                  key={button.type}
                  // className={`mb-1 w-full rounded-md bg-gradient-to-br from-primary to-blue-300 px-4 py-2 font-bold text-black hover:bg-gradient-to-tl hover:from-primary hover:to-blue-300 sm:w-36 ${
                  //   activeComponent === button.type ? "bg-blue-500" : ""
                  // }`}
                  className={`mb-1 w-full rounded-md px-4 py-2 font-bold text-black hover:bg-gradient-to-tl hover:from-primary hover:to-blue-300 sm:w-36 ${
                    activeComponent === button.type
                      ? "bg-gradient-to-br from-primary to-blue-400 text-white border-2  border-blue-600 shadow-lg" // Styling for the active button
                      : "bg-gradient-to-br from-primary to-blue-300"
                  }`}
                  onClick={() =>
                    handleButtonClick(button.type as ComponentType)
                  }
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-10 flex justify-center sm:-mt-10 sm:w-4/5">
            <ResourcesTable course={course} type={activeComponent} />
          </div>
        </section>
      </main>
      {/* {showModal && (
        <Modal
          title="Authentication Error"
          message={errorMessage}
          onClose={handleClose}
        />
      )} */}
    </div>
  );
}
