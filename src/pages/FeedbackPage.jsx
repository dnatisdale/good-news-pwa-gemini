import React from "react";
import { ChevronLeft, ChevronRight, MessageSquare } from "../components/Icons";

const ACCENT_COLOR_CLASS = "text-brand-red";

const FeedbackPage = ({
  lang,
  t,
  onBack,
  onForward,
  hasPrev,
  hasNext,
}) => {
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

      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <MessageSquare className="w-8 h-8 mr-3 text-brand-red" />
        {t.feedback || "Feedback"}
      </h1>

      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
        <p className="text-gray-700 text-lg leading-relaxed">
          {t.feedback_intro ||
            "We value your feedback! Please let us know if you have any suggestions, questions, or issues."}
        </p>

        <div className="flex justify-center">
          <a
            href={`mailto:Kow-D@globalrecordings.net?subject=${encodeURIComponent(
              lang === "th" ? "ความคิดเห็นเกี่ยวกับแอป Thai Good News" : "Feedback for Thai Good News App"
            )}`}
            className="bg-brand-red text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:bg-red-800 transition-colors flex items-center"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            {t.send_feedback || "Send Feedback Email"}
          </a>
        </div>
        
        <p className="text-center text-gray-500 text-sm">
          Kow-D@globalrecordings.net
        </p>
      </div>
    </div>
  );
};

export default FeedbackPage;
