// EditableParagraph.jsx
import React, { useRef, useState, useEffect } from "react";
import styles from "./EditableParagraph.module.css";

export default function EditableParagraph({
  initialText = "",
  onSave = () => {},
  placeholder = "Click to edit"
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const ref = useRef(null);
  const hasBeenEdited = useRef(false);

  // enter edit mode on click
  const handleClick = () => {
    setEditing(true);
  };

  // save on blur
  const handleBlur = () => {
    setEditing(false);
    onSave(text);
  };

  // keep state in sync if parent changes initialText, but only if user hasn't edited
  useEffect(() => {
    if (!editing && !hasBeenEdited.current) {
      setText(initialText);
    }
  }, [initialText, editing]);

  // when entering edit mode, focus and set content without moving cursor
  useEffect(() => {
    if (editing && ref.current) {
      const el = ref.current;
      el.focus();
      // Set the text content directly to avoid React interference
      el.textContent = text;
      // Don't manipulate cursor position - let user click where they want
    }
  }, [editing]); // Removed 'text' dependency to prevent cursor jumping

  // Handle input without causing cursor jumps
  const handleInput = (e) => {
    const newText = e.currentTarget.textContent;
    setText(newText);
    hasBeenEdited.current = true;
  };

  return (
    <p
      ref={ref}
      className={`${styles.editableParagraph} ${
        !text.trim() ? "empty" : ""
      }`}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={!editing ? handleClick : undefined}
      onInput={handleInput}
      onBlur={handleBlur}
    >
      {!editing && (text.trim() || placeholder)}
    </p>
  );
}
