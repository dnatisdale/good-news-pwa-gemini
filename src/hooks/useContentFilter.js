// src/hooks/useContentFilter.js
import { useState, useCallback } from "react";

export const useContentFilter = () => {
  // We store the IDs of selected languages and programs
  const [selectedLangs, setSelectedLangs] = useState([]);
  const [selectedPrograms, setSelectedPrograms] = useState([]);

  // --- ACTION: Toggle a Language Checkbox ---
  const handleLanguageToggle = useCallback((groupStableKey, groupMessages) => {
    setSelectedLangs((prevLangs) => {
      const isCurrentlySelected = prevLangs.includes(groupStableKey);
      const newLangs = isCurrentlySelected
        ? prevLangs.filter((k) => k !== groupStableKey) // Remove it
        : [...prevLangs, groupStableKey]; // Add it

      // Now handle the "Select All" / "Deselect All" logic for the programs
      const groupProgramIds = groupMessages.map((m) => m.id);

      setSelectedPrograms((prevProgs) => {
        if (isCurrentlySelected) {
          // If turning Language OFF, remove all its programs
          return prevProgs.filter((id) => !groupProgramIds.includes(id));
        } else {
          // If turning Language ON, add all its programs (avoiding duplicates)
          const combined = new Set([...prevProgs, ...groupProgramIds]);
          return Array.from(combined);
        }
      });

      return newLangs;
    });
  }, []);

  // --- ACTION: Toggle a Single Program Checkbox ---
  const handleProgramToggle = useCallback(
    (programId, groupStableKey, groupMessages) => {
      setSelectedPrograms((prevProgs) => {
        const isSelected = prevProgs.includes(programId);
        let newProgs;

        if (isSelected) {
          newProgs = prevProgs.filter((id) => id !== programId); // Remove
        } else {
          newProgs = [...prevProgs, programId]; // Add
        }

        // Check if we need to update the Parent Language state
        // (If we just deselected the last child, the parent Lang should turn off, etc.)
        // For simplicity, we keep the Lang selected if ANY child is selected,
        // or you can calculate purely based on visual state.
        // Here we just return the new program list.
        return newProgs;
      });
    },
    []
  );

  // --- Helper to clear everything ---
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
