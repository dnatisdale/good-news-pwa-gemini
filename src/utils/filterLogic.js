// src/utils/filterLogic.js

// 1. Get Filtered Messages
// Returns the actual list of message objects based on what is checked.
export const getFilteredMessages = (allMessages, selectedPrograms) => {
  if (!selectedPrograms || selectedPrograms.length === 0) {
    return [];
  }
  // We simply return any message whose ID is in the "selectedPrograms" list
  return allMessages.filter((item = []) => selectedPrograms.includes(item.id));
};

// 2. Get Language Checkbox State
// Returns: "checked", "unchecked", or "indeterminate" (the dash -)
export const getLanguageIndeterminateState = (
  languageGroup,
  selectedPrograms
) => {
  // Get all program IDs belonging to this specific language group
  const programIds = languageGroup.messages.map((msg) => msg.id);

  // Count how many of them are currently selected
  const selectedCount = programIds.filter((id) =>
    selectedPrograms.includes(id)
  ).length;

  if (selectedCount === programIds.length && programIds.length > 0) {
    return "checked"; // All selected
  } else if (selectedCount === 0) {
    return "unchecked"; // None selected
  } else {
    return "indeterminate"; // Some selected (needs the dash icon)
  }
};
