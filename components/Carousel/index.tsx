"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { BsChevronCompactLeft, BsChevronCompactRight } from "react-icons/bs";
import { RxDotFilled } from "react-icons/rx";
// import html_css_js from "public/images/Carousel/html-css-JS.webp";

function Carousel() {
  const slides = [
    { url: "/images/Carousel/machine-learning-training-bayarea.jpeg" },
    { url: "/images/Carousel/deep-learning-bootcamp-usa.jpg" },
    { url: "/images/Carousel/generative-ai-pleasanton-course.jpg" },
    { url: "/images/Carousel/data-science-career-path.jpg" },
    { url: "/images/Carousel/ml-job-prep-support.jpeg" },
    { url: "/images/Carousel/deep-learning-certification-program.jpg" },
    { url: "/images/Carousel/deep-learning-job-support.jpg" },
    { url: "/images/Carousel/data-science-training-usa.jpg" },
    // { url: html_css_js },
    // { url: GenAI2 },
    // { url: ml },
    // { url: de1 },
    // { url: js_libs },
    // { url: ntt },
    // { url: tlJ },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: React.SetStateAction<number>) => {
    setCurrentIndex(slideIndex);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [currentIndex]); // Run useEffect every time currentIndex changes

  return (
    <div className="group relative mx-auto h-[180px] w-full max-w-sm px-2 sm:h-[200px] sm:max-w-md md:h-[240px] md:max-w-lg lg:h-[270px] lg:max-w-xl xl:h-[300px] xl:max-w-2xl 2xl:h-[340px] 2xl:max-w-3xl">
      <div className="relative h-full w-full rounded-2xl bg-cover bg-center">
        {slides.map((slide, index) => (
          // <Image
          //   key={index}
          //   src={slide.url}
          //   alt={`Slide ${index}`}
          //   fill
          //   className={`rounded-2xl shadow-xl shadow-gray-700 transition-opacity duration-1000 ease-in-out ${
          //     index === currentIndex ? "opacity-100" : "opacity-0"
          //   }`}
          // />
          <Image
            key={index}
            src={slide.url}
            alt={
              [
                "Machine Learning training and placement in Bay Area",
                "Deep Learning training with job support in California",
                "Generative AI training in Pleasanton with career guidance",
                "Data Science job-focused training near Bay Area",
                "ML job preparation program for freshers and professionals",
                "Deep Learning project-based training for placements",
                "Bay Area AI training with real-time project support",
                "Data Science training with resume and interview support",
              ][index]
            }
            fill
            className={`rounded-2xl shadow-xl shadow-gray-700 transition-opacity duration-1000 ease-in-out ${index === currentIndex ? "opacity-100" : "opacity-0"
              }`}
          />
        ))}
      </div>
      {/* Left Arrow */}
      <div
        className="absolute top-1/2 left-5 hidden -translate-y-1/2 transform cursor-pointer rounded-full bg-black/30 p-2 text-2xl text-white transition hover:bg-black/50 group-hover:block"
        onClick={prevSlide}
      >
        <BsChevronCompactLeft size={30} />
      </div>
      {/* Right Arrow */}
      <div
        className="absolute top-1/2 right-5 hidden -translate-y-1/2 transform cursor-pointer rounded-full bg-black/30 p-2 text-2xl text-white transition hover:bg-black/50 group-hover:block"
        onClick={nextSlide}
      >
        <BsChevronCompactRight size={30} />
      </div>
      <div className="flex justify-center space-x-2 py-4">
        {slides.map((_, slideIndex) => (
          <div
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            className={`cursor-pointer ${slideIndex === currentIndex ? "text-blue-500" : "text-gray-300"
              }`}
          >
            <RxDotFilled size={30} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Carousel;
