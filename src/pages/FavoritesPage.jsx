import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight, Heart } from "../components/Icons";
import ContentCard from "../components/ContentCard";
import { staticContent } from "../data/staticContent";

const ACCENT_COLOR_CLASS = "text-brand-red";

const FavoritesPage = ({
  lang,
  t,
  onSelect,
  userData,
  onBack,
  onForward,
  hasPrev,
  hasNext,
}) => {
  // Added nav props for consistency
  const favoriteItems = useMemo(() => {
    // Ensure userData.favorites is an array before calling includes()
    const favorites = userData?.favorites || [];
    return staticContent.filter((item) => favorites.includes(item.id));
  }, [userData.favorites]);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      {/* Back and Forward Controls (added for consistency) */}
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

      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t.favorites}</h1>
      {favoriteItems.length > 0 ? (
        favoriteItems.map((item) => (
          // Show language name on search/favorite cards
          <ContentCard
            key={item.id}
            item={item}
            lang={lang}
            onSelect={onSelect}
            showLanguageName={true}
          />
        ))
      ) : (
        <div className="text-center p-8 text-gray-500">
          <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>{t.no_favorites}</p>
          <p className="text-sm mt-2">{t.favorite_tip}</p>
        </div>
      )}
      <div className="h-16"></div>
    </div>
  );
};

export default FavoritesPage;
