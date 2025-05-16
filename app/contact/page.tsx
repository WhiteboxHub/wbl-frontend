import ContactForm from "@/components/Contact";
import Layout from "@/components/Common/Layout";

const ContactPage = () => {
  return (
    <>
      {/* <div className=" mx-auto   w-full max-w-6xl px-4 pt-4 text-white sm:px-6 "> */}
      <div className="container px-4 pb-6 sm:px-6">
        <nav className="mt-20 flex h-28 flex-col items-start justify-center sm:mt-28 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <h1 className=" text-center  text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl ">
            Contact Us
          </h1>
          <div className="hidden sm:block">
            <Layout currentPage="Contact" />
          </div>
        </nav>
        <div className="flex flex-wrap md:flex-nowrap">
          <div className="w-full  ">
            <ContactForm />
          </div>
        </div>
        <div>
          <div className="mb-4   text-center  text-2xl font-bold  text-black dark:text-white sm:text-left  sm:text-3xl lg:text-4xl">
            How to find us
          </div>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3156.692512341928!2d-121.91246142459563!3d37.703419816267946!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808fec05cb8a6a33%3A0x50cb7964adacbf25!2sWhitebox%20Learning%20Inc!5e0!3m2!1sen!2sin!4v1714515428412!5m2!1sen!2sin"
            className="mb-8 h-96 w-full rounded-lg shadow-2xl  brightness-90"
            frameBorder="0"
            aria-hidden="false"
          ></iframe>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
