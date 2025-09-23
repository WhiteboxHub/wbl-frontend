"use client";
import React from "react";

export default function QuestionsTable() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg w-full">
      <h2 className="text-2xl font-bold mb-4">Top 500 Interview Questions</h2>
      <p className="text-gray-700 mb-4">
        Explore the most frequently asked interview questions to sharpen your preparation.
      </p>
      <a
        href="https://docs.google.com/document/d/17qGxNGidriSlISfXgyUua57-SlY4Rjue/edit?usp=sharing&ouid=104533500296086934734&rtpof=true&sd=true"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition"
      >
        Open Full Questions Page
      </a>
    </div>
  );
}