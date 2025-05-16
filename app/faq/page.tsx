import Accordion from "@/components/Faq";
import Layout from "@/components/Common/Layout";
import Link from "next/link";

export default function Faq() {
  return (
    <div>
      <main className="container px-4 pb-6 sm:px-6">
        {/* Navbar */}
        <nav className="mt-16 flex h-24  flex-col justify-center text-center sm:mt-28 sm:mb-3 sm:h-28  sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-center text-2xl font-bold sm:pt-0 sm:text-start sm:text-3xl lg:text-4xl">
            Frequently Asked Questions
          </h1>
          <div className="hidden sm:block">
            <Layout currentPage="FAQ" />
          </div>
        </nav>
        <div className="border dark:border-gray-800">
          <div className="rounded-lg bg-white dark:bg-transparent">
            <Accordion
              title="What are the courses Whitebox-Learning Offers?"
              content="AIML (Artificial Intelligence & Machine Learning) "
            />
            <Accordion
              title="Do you provide corporate training?"
              content="Yes, we do."
            />
            <Accordion
              title="Are all your classes online or in-person?"
              content="Most of our classes are online, but we also do in-person classes at our Dublin office."
            />
            <Accordion
              title="Are all classes mandatory for training?"
              content="Yes, you need to attend all our morning and evening classes for training. The topics covered in morning and evening sessions are different."
            />
            <Accordion
              title="Where are we located?"
              content="We are located at 6500 Dublin Blvd #214, Dublin, CA 94568."
            />
            <Accordion
              title="What if I miss any of your classes?"
              content="All our classes will be recorded and uploaded to our learning management portal. You can go through the recording of the class if you miss it and can access it at any given time. You may also go through previous batch recordings if you want to come prepared for a certain class."
            />
            <Accordion
              title="What's the duration of courses you offer?"
              content="Courses are 8 to 12 weeks in duration."
            />
            <Accordion
              title="Do I need to have any prior experience to join your courses?"
              content="No prior experience is required. Any bachelor's degree is sufficient to enroll in our courses and get placed in a project. We expect a minimum commitment of 20 hrs/week from candidates without a computer science background."
            />
            <Accordion
              title="Do you have lab facilities in your institute?"
              content="Yes, we have a training room with sufficient machines equipped with the necessary tools. You can also access these machines online via TeamViewer."
            />
            <Accordion
              title="Do you charge any fee for the training?"
              content="Enrollment fee: $725 (for training and placement services). Training fee: $6500 (corporate training). Please contact our Recruiting Team at +1 925-557-1053 for more information."
            />
            <Accordion
              title="What other formalities are required to enroll in your courses?"
              content="You need to sign our training agreement and submit a few documents. Please contact our Recruiting Team at +1 925-557-1053 for more information."
            />
            <Accordion
              title="Will you help with resume preparation?"
              content="Yes, we provide assistance with resume preparation."
            />
            <Accordion
              title="Will you help with interview preparation?"
              content="Yes, our training team will conduct mock interviews and interview preparation sessions."
            />
            <Accordion
              title="Where can I find your class schedules and syllabus for training?"
              content={
                <>
                  Please follow the link to view: &nbsp;
                  <Link href="/schedule" className="inline-block">
                    <div className="text-blue-600 dark:text-blue-500">
                      Class Schedule and Syllabus(Course Content)
                    </div>
                  </Link>
                </>
              }
            />
          </div>
        </div>
      </main>
    </div>
  );
}
