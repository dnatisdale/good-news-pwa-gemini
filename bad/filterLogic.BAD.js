// src/utils/filterLogic.js

// 1) Return the list of message objects whose IDs are selected
export const getFilteredMessages = (
  allMessages = [],
  selectedPrograms = []
) => {
  if (!Array.isArray(allMessages) || !Array.isArray(selectedPrograms)) {
    return [];
  }
  if (selectedPrograms.length === 0) return [];

  return allMessages.filter(
    (item) => item && selectedPrograms.includes(item.id)
  );
};

// 2) Return "checked" / "unchecked" / "indeterminate" for a language row
export const getLanguageIndeterminateState = (
  languageGroup,
  selectedPrograms = []
) => {
  if (
    !languageGroup ||
    !Array.isArray(languageGroup.messages) ||
    !Array.isArray(selectedPrograms)
  ) {
    return "unchecked";
  }

  const programIds = languageGroup.messages
    .map((msg) => msg && msg.id)
    .filter((id) => id != null);

  if (programIds.length === 0) return "unchecked";

  const selectedCount = programIds.filter((id) =>
    selectedPrograms.includes(id)
  ).length;

  if (selectedCount === 0) return "unchecked";
  if (selectedCount === programIds.length) return "checked";
  return "indeterminate";
};

// Optional default export (safe if something imports default)
export default { getFilteredMessages, getLanguageIndeterminateState };
