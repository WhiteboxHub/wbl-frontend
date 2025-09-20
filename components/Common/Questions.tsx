"use client";
import React from "react";

export default function QuestionsTable() {
  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-lg">
      <h2 className="mb-4 text-2xl font-bold">Top Interview Questions</h2>
      <p className="mb-4 text-gray-700">
        Explore the most frequently asked interview questions to sharpen your
        preparation.
      </p>
      <a
        href="https://docs.google.com/document/d/17qGxNGidriSlISfXgyUua57-SlY4Rjue/edit?usp=sharing&ouid=104533500296086934734&rtpof=true&sd=true"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-md bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700"
      >
        Open Full Questions Page
      </a>
    </div>
  );
}
