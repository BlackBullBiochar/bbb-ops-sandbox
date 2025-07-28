// EditableParagraph.jsx
import React, { useRef, useState, useEffect } from "react";
import styles from "./EditableParagraph.module.css";

export default function EditableParagraph({
  initialText = "",
  onSave = () => {}
}) {
  const [editing, setEditing]   = useState(false);
  const [text, setText]         = useState(initialText);
  const ref = useRef(null);

  // enter edit mode on click
  const handleClick = () => {
    setEditing(true);
  };

  // save on blur
  const handleBlur = () => {
    setEditing(false);
    onSave(text);
  };

  // keep state in sync if parent changes initialText
  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  // when entering edit, focus and place caret at end
  useEffect(() => {
    if (editing && ref.current) {
      const el = ref.current;
      el.focus();
      document.execCommand("selectAll", false);
      document.getSelection().collapseToEnd();
    }
  }, [editing]);

  return (
    <p
      ref={ref}
      className={`${styles.editableParagraph} ${
        !text.trim() ? "empty" : ""
      }`}
      contentEditable={editing}
      suppressContentEditableWarning
      onClick={!editing ? handleClick : undefined}
      onInput={e => setText(e.currentTarget.textContent)}
      onBlur={handleBlur}
    >
      {text}
    </p>
  );
}
