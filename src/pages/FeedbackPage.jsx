import React, { useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare } from "../components/Icons";

const ACCENT_COLOR_CLASS = "text-brand-red";

const FeedbackPage = ({ lang, t, onBack, onForward, hasPrev, hasNext }) => {
  const [message, setMessage] = useState("");

  const handleSend = async () => {
    const subject =
      lang === "th"
        ? "ความคิดเห็นเกี่ยวกับแอป Thai Good News"
        : "Feedback for Thai Good News App";

    const emailText = `${subject}\n\n${message}\n\n---\nPlease send to: Kow-D@globalrecordings.net`;

    // Try Web Share API first (works better on mobile/PWA)
    if (navigator.share) {
      try {
        await navigator.share({
          title: subject,
          text: emailText,
        });
        return; // Success, exit early
      } catch (err) {
        // User cancelled or share failed, fall through to mailto
        if (err.name !== "AbortError") {
          console.log("Share failed, trying mailto fallback:", err);
        }
      }
    }

    // Fallback to mailto if share not available or failed
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(message);
    window.location.href = `mailto:Kow-D@globalrecordings.net?subject=${encodedSubject}&body=${encodedBody}`;
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Back and Forward Controls */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onBack}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasPrev
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasPrev}
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {t.back || "Back"}
        </button>
        <button
          onClick={onForward}
          className={`text-sm font-semibold flex items-center transition-colors ${
            hasNext
              ? `${ACCENT_COLOR_CLASS} hover:text-red-700`
              : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!hasNext}
        >
          {t.forward || "Forward"}
          <ChevronRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      {/* Title - White in Dark Mode */}
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center justify-center">
        <MessageSquare className="w-8 h-8 mr-3 text-brand-red dark:text-white" />
        {t.feedback || "Feedback"}
      </h1>

      {/* Content Container - Centered and Max Width */}
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-700 p-6 rounded-xl shadow-md space-y-6">
        <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed text-center">
          {t.feedback_intro ||
            "We value your feedback! Please let us know if you have any suggestions, questions, or issues."}
        </p>

        {/* In-App Text Area */}
        <textarea
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent dark:bg-gray-600 dark:border-gray-500 dark:text-white placeholder-gray-400"
          rows="5"
          placeholder={t.feedback_placeholder || "Type your message here..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        ></textarea>

        <div className="flex justify-center">
          <button
            onClick={handleSend}
            className="bg-brand-red text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-red-800 transition-colors flex items-center"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            {t.send_feedback || "Send Feedback"}
          </button>
        </div>

        <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
          Kow-D@globalrecordings.net
        </p>
      </div>
    </div>
  );
};

export default FeedbackPage;
