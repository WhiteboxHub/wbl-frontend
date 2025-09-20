"use client";
import React from "react";

export default function QuestionsPage() {
  return (
    <main className="container mx-auto mt-20 p-6">
      <h1 className="mb-6 text-3xl font-bold">Top 500 Interview Questions</h1>
      <ul className="list-disc space-y-2 pl-6 text-gray-700">
        <li>Tell me about yourself.</li>
        <li>Why should we hire you?</li>
        <li>Explain OOP concepts with examples.</li>
        <li>What are the differences between SQL and NoSQL?</li>
        {/* Add as many as needed */}
      </ul>
    </main>
  );
}
