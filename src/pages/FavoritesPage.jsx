import React, { useMemo } from "react";
import { Heart } from "../components/Icons";
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
  setLang,
  fontSize,
  setFontSize,
  pageStack,
  onToggleFavorite,
  // from App.jsx
  languageGroups,
  onToggleFavoriteLanguage,
  onSelectLanguage,
}) => {
  // ⭐ Favorite messages
  const favoriteMessageItems = useMemo(() => {
    const favorites = userData?.favorites || [];
    if (!Array.isArray(favorites) || favorites.length === 0) return [];
    return staticContent.filter((item) => favorites.includes(item.id));
  }, [userData?.favorites]);

  // ⭐ Favorite languages (by stableKey)
  const favoriteLanguageKeys = userData?.favoriteLanguages || [];

  const favoriteLanguageGroups = useMemo(() => {
    if (!languageGroups || !Array.isArray(languageGroups)) return [];
    if (
      !Array.isArray(favoriteLanguageKeys) ||
      favoriteLanguageKeys.length === 0
    )
      return [];
    return languageGroups.filter((g) =>
      favoriteLanguageKeys.includes(g.stableKey)
    );
  }, [languageGroups, favoriteLanguageKeys]);

  // --- Audio Playback State for "sample" ---
  const [playingSampleId, setPlayingSampleId] = React.useState(null);
  const audioRef = React.useRef(new Audio());

  const handlePlaySample = (item) => {
    // If this item is already playing, stop it
    if (playingSampleId === item.id) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingSampleId(null);
    } else {
      // Start a new sample if we have a URL
      if (item.sampleUrl) {
        // Stop any current audio
        audioRef.current.pause();
        audioRef.current.currentTime = 0;

        // Load new URL
        audioRef.current.src = item.sampleUrl;
        audioRef.current
          .play()
          .then(() => {
            setPlayingSampleId(item.id);
          })
          .catch((e) => {
            console.error("Error playing sample:", e);
            console.error("Sample URL:", item.sampleUrl);
            setPlayingSampleId(null);
          });

        // Reset state when audio finishes
        audioRef.current.onended = () => setPlayingSampleId(null);
      }
    }
  };

  // Cleanup audio when page is unmounted
  React.useEffect(() => {
    return () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    };
  }, []);

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
        <Heart className="w-8 h-8 mr-3 text-brand-red dark:text-white" />
        {t.favorites}
      </h1>

      {/* =======================
          FAVORITE LANGUAGES
         ======================= */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          {t.favorite_languages || "Favorite Languages"}
        </h2>

        {favoriteLanguageGroups.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-200">
            {t.no_favorite_languages || "No favorite languages yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {favoriteLanguageGroups.map((group) => {
              const name =
                lang === "en" ? group.displayNameEn : group.displayNameTh;
              const count = group.count ?? group.messages?.length ?? 0;
              const isFav = favoriteLanguageKeys.includes(group.stableKey);

              // 🔴 Light mode: red if favorite
              // ⚪ Dark mode: always white text for readability
              const nameClasses = isFav
                ? "text-brand-red dark:text-white"
                : "text-gray-800 dark:text-white";

              return (
                <div
                  key={group.stableKey}
                  className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#374151] shadow-sm"
                >
                  {/* Click name to jump to MessagesByLanguage */}
                  <button
                    onClick={() =>
                      onSelectLanguage && onSelectLanguage(group.stableKey)
                    }
                    className="flex-1 text-left"
                  >
                    <div className={`font-semibold ${nameClasses}`}>{name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-200">
                      {count} {t.messages || "messages"}
                    </div>
                  </button>

                  {/* Heart to toggle favorite language */}
                  {onToggleFavoriteLanguage && (
                    <button
                      onClick={() => onToggleFavoriteLanguage(group.stableKey)}
                      className={`ml-2 p-2 rounded-full transition-all ${
                        isFav ? "bg-red-100" : "bg-gray-100 hover:bg-red-100"
                      }`}
                      title={
                        isFav
                          ? t.unfavorite_language || "Remove favorite language"
                          : t.favorite_language || "Favorite language"
                      }
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isFav
                            ? "fill-brand-red text-brand-red"
                            : "text-gray-500"
                        }`}
                        style={
                          isFav ? { fill: "#CC3333", color: "#CC3333" } : {}
                        }
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* =======================
          FAVORITE MESSAGES
         ======================= */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          {t.favorite_messages || "Favorite Messages"}
        </h2>

        {favoriteMessageItems.length > 0 ? (
          favoriteMessageItems.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              lang={lang}
              t={t}
              onSelect={onSelect}
              showLanguageName={true}
              isFavorite={userData?.favorites?.includes(item.id)}
              onToggleFavorite={() => onToggleFavorite(item.id)}
              isPlayingSample={playingSampleId === item.id}
              onPlaySample={() => handlePlaySample(item)}
            />
          ))
        ) : (
          <div className="text-center p-8 text-gray-500">
            <Heart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>{t.no_favorites}</p>
            <p className="text-sm mt-2">{t.favorite_tip}</p>
          </div>
        )}
      </section>

      {/* Spacer at bottom so fixed bars don't cover content */}
      <div className="h-16"></div>
    </div>
  );
};

export default FavoritesPage;
