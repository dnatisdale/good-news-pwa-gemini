import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Pen, Trash2, Plus } from "lucide-react";

const ACCENT_COLOR_CLASS = "text-brand-red";

const NotesPage = ({ lang, t, onBack, onForward, hasPrev, hasNext, userData, saveUserData }) => {
  // Use notes from userData directly
  const notes = userData?.notes || [];
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    id: null,
    title: "",
    content: "",
  });

  // REMOVED: LocalStorage effects. Data is now managed by useFirebase.

  const handleSaveNote = () => {
    if (!currentNote.title.trim() && !currentNote.content.trim()) return;

    let updatedNotes;
    if (currentNote.id) {
      // Update existing note
      updatedNotes = notes.map((note) => 
        note.id === currentNote.id ? currentNote : note
      );
    } else {
      // Create new note
      const newNote = {
        ...currentNote,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      updatedNotes = [newNote, ...notes];
    }
    
    // Save to Firebase/LocalStorage via hook
    saveUserData({ ...userData, notes: updatedNotes });
    
    setIsEditing(false);
    setCurrentNote({ id: null, title: "", content: "" });
  };

  const handleDeleteNote = (id) => {
    if (window.confirm(t.confirm_delete_note || "Delete this note?")) {
      const updatedNotes = notes.filter((note) => note.id !== id);
      saveUserData({ ...userData, notes: updatedNotes });
      
      if (currentNote.id === id) {
        setIsEditing(false);
        setCurrentNote({ id: null, title: "", content: "" });
      }
    }
  };

  const startEditing = (note = { id: null, title: "", content: "" }) => {
    setCurrentNote(note);
    setIsEditing(true);
  };

  return (
    <div className="p-4 pt-8 h-full overflow-y-auto fade-in">
      {/* Navigation Header */}
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

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          {t.my_notes || "My Notes"}
        </h1>
        {!isEditing && (
          <button
            onClick={() => startEditing()}
            className="bg-gradient-to-br from-brand-red to-brand-red-dark text-white p-2 rounded-full shadow-lg hover:brightness-110 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-white p-4 rounded-xl shadow-md space-y-4 slide-up">
          <input
            type="text"
            placeholder={t.note_title_placeholder || "Title"}
            value={currentNote.title}
            onChange={(e) =>
              setCurrentNote({ ...currentNote, title: e.target.value })
            }
            className="w-full text-lg font-bold border-b border-gray-200 focus:outline-none focus:border-brand-red p-2"
          />
          <textarea
            placeholder={t.note_content_placeholder || "Write your note here..."}
            value={currentNote.content}
            onChange={(e) =>
              setCurrentNote({ ...currentNote, content: e.target.value })
            }
            className="w-full h-48 p-2 resize-none focus:outline-none text-gray-700"
          />
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              {t.cancel || "Cancel"}
            </button>
            <button
              onClick={handleSaveNote}
              className="px-4 py-2 bg-brand-red text-white rounded-lg hover:bg-red-700"
            >
              {t.save || "Save"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              <Pen className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>{t.no_notes || "No notes yet. Tap + to create one!"}</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                onClick={() => startEditing(note)}
                className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer relative group"
              >
                <h3 className="font-bold text-gray-800 mb-1 pr-8">
                  {note.title || (
                    <span className="text-gray-400 italic">
                      {t.untitled || "Untitled"}
                    </span>
                  )}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                  {note.content}
                </p>
                {/* Date Display */}
                <p className="text-xs text-gray-400">
                  {note.createdAt
                    ? new Date(note.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </p>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
      <div className="h-16"></div>
    </div>
  );
};

export default NotesPage;
