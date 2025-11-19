// src/hooks/useContentFilter.js
import { useState, useCallback } from "react";

export const useContentFilter = () => {
  // IDs for selected language groups (stableKey) and selected programs (message IDs)
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);

  // Toggle a whole language group
  // groupStableKey  = languageGroups[x].stableKey
  // groupMessages   = languageGroups[x].messages (array of items with .id)
  const handleLanguageToggle = useCallback(
    (groupStableKey, groupMessages = []) => {
      const groupProgramIds = groupMessages
        .map((m) => m && m.id)
        .filter((id) => id != null);

      setSelectedPrograms((prevProgs) => {
        if (!Array.isArray(prevProgs)) prevProgs = [];

        const allSelected =
          groupProgramIds.length > 0 &&
          groupProgramIds.every((id) => prevProgs.includes(id));

        if (allSelected) {
          // Turn OFF language: remove all its programs
          return prevProgs.filter((id) => !groupProgramIds.includes(id));
        } else {
          // Turn ON language: add all its programs
          const combined = new Set([...prevProgs, ...groupProgramIds]);
          return Array.from(combined);
        }
      });

      // Track which language rows have been toggled
      setSelectedLangs((prevLangs) => {
        const isSelected = prevLangs.includes(groupStableKey);
        if (isSelected) {
          return prevLangs.filter((k) => k !== groupStableKey);
        }
        return [...prevLangs, groupStableKey];
      });
    },
    []
  );

  // Toggle a single program checkbox
  // programId       = item.id
  // groupStableKey  = language stableKey
  // groupMessages   = all items in that language
  const handleProgramToggle = useCallback(
    (programId, groupStableKey, groupMessages = []) => {
      setSelectedPrograms((prevProgs) => {
        if (!Array.isArray(prevProgs)) prevProgs = [];

        const isSelected = prevProgs.includes(programId);
        const newProgs = isSelected
          ? prevProgs.filter((id) => id !== programId)
          : [...prevProgs, programId];

        const groupIds = groupMessages
          .map((m) => m && m.id)
          .filter((id) => id != null);

        const allSelected =
          groupIds.length > 0 && groupIds.every((id) => newProgs.includes(id));
        const noneSelected = groupIds.every((id) => !newProgs.includes(id));

        setSelectedLangs((prevLangs) => {
          if (allSelected) {
            if (prevLangs.includes(groupStableKey)) return prevLangs;
            return [...prevLangs, groupStableKey];
          }
          if (noneSelected) {
            return prevLangs.filter((k) => k !== groupStableKey);
          }
          // indeterminate: leave as-is
          return prevLangs;
        });

        return newProgs;
      });
    },
    []
  );

  // Clear everything
  const clearSelection = useCallback(() => {
    setSelectedLangs([]);
    setSelectedPrograms([]);
  }, []);

  return {
    selectedLangs,
    selectedPrograms,
    handleLanguageToggle,
    handleProgramToggle,
    clearSelection,
  };
};

// Also export as default so BOTH styles work:
//   import { useContentFilter } from ...
//   import useContentFilter from ...
export default useContentFilter;
