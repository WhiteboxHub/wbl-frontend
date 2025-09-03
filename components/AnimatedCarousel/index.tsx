"use client";

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import ml1 from "public/images/Carousel/machine-learning-training-bayarea.jpeg";
import GenAI from "public/images/Carousel/generative-ai-pleasanton-course.jpg";
import DL1 from "public/images/Carousel/deep-learning-bootcamp-usa.jpg";
import DL2 from "public/images/Carousel/deep-learning-certification-program.jpg";
import DL3 from "public/images/Carousel/deep-learning-job-support.jpg";
import ml3 from "public/images/Carousel/ml-job-prep-support.jpeg";
import ds1 from "public/images/Carousel/data-science-training-usa.jpg";
import ds2 from "public/images/Carousel/data-science-career-path.jpg";

type CarouselItem = {
  quote: string;
  name: string;
  designation: string;
  src: any;
};

const carouselData: CarouselItem[] = [
  {
    quote: "Master machine learning algorithms and predictive analytics with hands-on projects. Build real-world ML solutions.",
    name: "Machine Learning Mastery",
    designation: "Advanced ML Training Program",
    src: ml1,
  },
  {
    quote: "Dive deep into neural networks, computer vision, and natural language processing. Learn cutting-edge deep learning techniques.",
    name: "Deep Learning Bootcamp",
    designation: "Neural Networks & AI Systems",
    src: DL1,
  },
  {
    quote: "Explore the future of AI with generative models, large language models, and prompt engineering. Create innovative AI applications.",
    name: "Generative AI Excellence",
    designation: "Next-Gen AI Development",
    src: GenAI,
  },
  {
    quote: "Transform data into actionable insights with comprehensive data science training. Learn Python, R, SQL, and advanced analytics.",
    name: "Data Science Career Path",
    designation: "Analytics & Business Intelligence",
    src: ds2,
  },
  {
    quote: "Get job-ready with personalized ML career coaching, resume optimization, and interview preparation. Land your dream role.",
    name: "ML Job Preparation",
    designation: "Career Support & Placement",
    src: ml3,
  },
  {
    quote: "Gain industry-recognized AIML expertise. Validate your skills in machine learning, natural language processing, and intelligent system deployment.",
    name: "AIML",
    designation: "Artificial Intelligence & Machine Learning",
    src: DL2,
  },
  {
    quote: "Comprehensive job support including portfolio development, technical interviews, and industry networking. Transition successfully into AI careers.",
    name: "Deep Learning Job Support",
    designation: "Career Transition Program",
    src: DL3,
  },
  {
    quote: "Complete data science training covering statistics, machine learning, data visualization, and big data technologies. Build end-to-end solutions.",
    name: "Data Science Training",
    designation: "Full-Stack Data Solutions",
    src: ds1,
  },
];

export const AnimatedCarousel = ({
  autoplay = true,
  onWatchDemo,
}: {
  autoplay?: boolean;
  onWatchDemo?: () => void;
}) => {
  const [active, setActive] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNext = () => {
    setActive((prev) => (prev + 1) % carouselData.length);
  };

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + carouselData.length) % carouselData.length);
  };

  const isActive = (index: number) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay && isMounted) {
      const interval = setInterval(handleNext, 3000);
      return () => clearInterval(interval);
    }
  }, [autoplay, active, isMounted]);

  const randomRotateY = () => {
    return isMounted ? Math.floor(Math.random() * 21) - 10 : 0;
  };

  if (!isMounted) {
    return (
      <div className="mx-auto max-w-sm px-4 py-8 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
        <div className="relative grid grid-cols-1 gap-12 md:grid-cols-2">
          <div>
            <div className="relative h-80 w-full">
              <div className="absolute inset-0 origin-bottom">
                <img
                  src={carouselData[0].src.src}
                  alt={carouselData[0].name}
                  width={500}
                  height={500}
                  draggable={false}
                  className="h-full w-full rounded-3xl object-cover object-center shadow-xl shadow-gray-700"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col py-4 text-center">
            <div className="h-48 flex flex-col justify-start">
              <div>
                <h3 className="text-2xl font-bold text-black dark:text-white">
                  {carouselData[0].name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-neutral-500">
                  {carouselData[0].designation}
                </p>
                <p className="mt-8 text-lg text-gray-500 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                  {carouselData[0].quote}
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex flex-col items-center">
              <button
                onClick={onWatchDemo}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-8 py-4 text-base font-bold text-white shadow-lg transition duration-300 ease-in-out hover:from-blue-600 hover:to-blue-800 hover:shadow-xl"
              >
                <span className="mr-2">Watch Demo Class</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              
              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={handlePrev}
                  className="group/button flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <IconArrowLeft className="h-6 w-6 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-neutral-400" />
                </button>
                <button
                  onClick={handleNext}
                  className="group/button flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  <IconArrowRight className="h-6 w-6 text-black transition-transform duration-300 group-hover/button:-rotate-12 dark:text-neutral-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-8 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-12 md:grid-cols-2">
        <div>
          <div className="relative h-80 w-full">
            <AnimatePresence>
              {carouselData.map((item, index) => (
                <motion.div
                  key={item.src}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: randomRotateY(),
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : randomRotateY(),
                    zIndex: isActive(index)
                      ? 40
                      : carouselData.length + 2 - index,
                    y: isActive(index) ? [0, -80, 0] : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: randomRotateY(),
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={item.src.src}
                    alt={item.name}
                    width={500}
                    height={500}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover object-center shadow-xl shadow-gray-700"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex flex-col py-4 text-center">
          {/* Fixed height container for text content */}
          <div className="h-48 flex flex-col justify-start">
            <motion.div
              key={active}
              initial={{
                y: 20,
                opacity: 0,
              }}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -20,
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
                ease: "easeInOut",
              }}
            >
              <h3 className="text-2xl font-bold text-black dark:text-white">
                {carouselData[active].name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-neutral-500">
                {carouselData[active].designation}
              </p>
              <motion.p className="mt-8 text-lg text-gray-500 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                {carouselData[active].quote.split(" ").map((word, index) => (
                  <motion.span
                    key={index}
                    initial={{
                      filter: "blur(10px)",
                      opacity: 0,
                      y: 5,
                    }}
                    animate={{
                      filter: "blur(0px)",
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.2,
                      ease: "easeInOut",
                      delay: 0.02 * index,
                    }}
                    className="inline-block"
                  >
                    {word}&nbsp;
                  </motion.span>
                ))}
              </motion.p>
            </motion.div>
          </div>
          
          {/* Fixed Watch Demo Class Button and Navigation Arrows */}
          <div className="mt-8 flex flex-col items-center">
            <button
              onClick={onWatchDemo}
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-blue-700 px-8 py-4 text-base font-bold text-white shadow-lg transition duration-300 ease-in-out hover:from-blue-600 hover:to-blue-800 hover:shadow-xl"
            >
              <span className="mr-2">Watch Demo Class</span>
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            
            {/* Navigation arrows directly below button */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={handlePrev}
                className="group/button flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <IconArrowLeft className="h-6 w-6 text-black transition-transform duration-300 group-hover/button:rotate-12 dark:text-neutral-400" />
              </button>
              <button
                onClick={handleNext}
                className="group/button flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <IconArrowRight className="h-6 w-6 text-black transition-transform duration-300 group-hover/button:-rotate-12 dark:text-neutral-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedCarousel;
