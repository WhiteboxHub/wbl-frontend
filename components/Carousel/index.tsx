"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { BsChevronCompactLeft, BsChevronCompactRight } from "react-icons/bs";
import { RxDotFilled } from "react-icons/rx";
import ml1 from "public/images/Carousel/ML 1.jpeg";
// import html_css_js from "public/images/Carousel/html-css-JS.webp";
import GenAI from "public/images/Carousel/GenAI.jpg";
import DL1 from "public/images/Carousel/DL1.jpg";
import DL2 from "public/images/Carousel/DL2.jpg";
import DL3 from "public/images/Carousel/DL3.jpg";
import ml3 from "public/images/Carousel/ML 3.jpeg";
import ds1 from "public/images/Carousel/ds1.jpg";
import ds2 from "public/images/Carousel/ds2.jpg";

function Carousel() {
  const slides = [
    { url: ml1 },
    { url: DL1 },
    { url: GenAI },
    { url: ds2 },
    { url: ml3 },
    { url: DL2 },
    { url: DL3 },
    { url: ds1 },
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
    <div className="group relative mx-auto h-[200px] w-full max-w-sm px-2 sm:h-[250px] sm:max-w-md md:h-[300px] md:max-w-lg lg:h-[350px] lg:max-w-xl xl:h-[400px] xl:max-w-3xl  2xl:h-[500px] 2xl:max-w-4xl">
      <div className="relative h-full w-full rounded-2xl bg-cover bg-center">
        {slides.map((slide, index) => (
          <Image
            key={index}
            src={slide.url}
            alt={`Slide ${index}`}
            fill
            className={`rounded-2xl shadow-xl shadow-gray-700 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? "opacity-100" : "opacity-0"
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
            className={`cursor-pointer ${
              slideIndex === currentIndex ? "text-blue-500" : "text-gray-300"
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
