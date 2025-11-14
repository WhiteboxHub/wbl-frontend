"use client";
import { useState, useEffect, useRef } from "react";
import { X, Send, Trash2 } from "lucide-react";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello 👋 I'm WBL Assist! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  //  Send message
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: data.reply || "Sorry, I didn’t catch that." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Could not reach server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  //  Scroll to bottom on message change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clear chat functionality
  const handleClearChat = () => {
    setMessages([
      { sender: "bot", text: "Hello 👋 I'm WBL Assist! How can I help you today?" },
    ]);
  };

  return (
    <>
      {/* 🧊 Ask Cuboo Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-24 z-50 flex items-center gap-2 bg-primary hover:bg-primarylight text-white px-4 py-2 rounded-full shadow-lg transition-all"
        >
          <span className="text-lg">🧊</span>
          <span className="font-medium text-sm">Ask WBL Assist</span>
        </button>
      )}

      {/* 💬 Chat Window */}
      {isOpen && (
        <div
          className="fixed bottom-40 right-0 z-50 w-[380px] h-[520px] bg-white dark:bg-darklight rounded-l-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-300 animate-slide-up"
        >
          {/* Header */}
          <div className="bg-white dark:bg-darklight border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                W
              </div>
              <span className="font-semibold text-gray-800 dark:text-white">WBL Assist</span>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2">
              {/*  Clear Chat Button */}
              <button
                onClick={handleClearChat}
                className="text-gray-500 hover:text-red-500 transition"
                title="Clear chat"
              >
                <Trash2 size={17} />
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-800 transition"
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm bg-gray-50 dark:bg-dark">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl leading-relaxed ${
                  msg.sender === "bot"
                    ? "bg-white dark:bg-darklight border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white"
                    : "bg-primary text-white ml-auto text-right"
                } max-w-[80%]`}
              >
                {msg.text}
              </div>
            ))}

            {loading && (
              <div className="bg-white border border-gray-200 text-gray-500 dark:bg-darklight dark:text-white p-2 rounded-lg w-fit text-xs">
                Typing...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/*  Input Section (shorter + styled) */}
          <div className="flex items-center border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-darklight px-3 py-2">
            <div className="flex items-center gap-2 w-full">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Write your question..."
                className="w-[87%] bg-transparent p-2 text-sm text-gray-800 dark:text-gray-200 rounded-md outline-none border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                className="flex items-center justify-center bg-primary hover:bg-primarylight text-white rounded-full p-2 w-9 h-9 transition"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
