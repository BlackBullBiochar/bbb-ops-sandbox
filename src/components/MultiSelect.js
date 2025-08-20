import { useState, useEffect, useRef, useMemo } from "react";
import styles from "./MultiSelect.module.css";
import helpers from "../helpers.js";
import arrowGrey from "../assets/images/selectArrowGrey.png";
import arrowWhite from "../assets/images/selectArrowWhite.png";

const MultiSelector = ({
  name = "SelectorName",
  placeholder = "Select…",
  labelStyle = "left",
  iconName = "",
  data = [],
  values = [],
  onChange = () => {},
  color = "white",
  customStyle,
  maxPreview = 3,
}) => {
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFocus = () => setFocused((prev) => !prev);

  const toggleValue = (v) => {
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };

  const selectAll = () => onChange(data.map((d) => d.value));
  const clearAll = () => onChange([]);

  const allSelected = values.length === data.length && data.length > 0;
  const noneSelected = values.length === 0;

  const selectedNames = useMemo(() => {
    const map = new Map(data.map((d) => [d.value, d.name]));
    return values.map((v) => map.get(v) || v);
  }, [values, data]);

  const selectedPreview = useMemo(() => {
    if (noneSelected) return placeholder;
    if (selectedNames.length === 1) return selectedNames[0];
    if (selectedNames.length === 2) return `${selectedNames[0]}, ${selectedNames[1]}`;
    return `${selectedNames[0]} +${selectedNames.length - 1}`;
  }, [selectedNames, noneSelected, placeholder]);


  const onKeyDown = (e) => {
    if (["Enter", " "].includes(e.key)) {
      e.preventDefault();
      toggleFocus();
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <div
      ref={wrapperRef}
      className={helpers.clx(
        styles.mainContainer,
        labelStyle === "top" && styles.mainContainerLabelTop,
        labelStyle === "none" && styles.mainContainerNoLabel
      )}
    >
      {labelStyle !== "none" && (
        <div className={styles.LabelContainer}>
          {name}
        </div>
      )}

      <div
        className={helpers.clx(
          styles.selectorContainer,
          !focused && styles.selectorContainerCollapsed,
          labelStyle === "none" && styles.selectorContainerNoLabel
        )}
        onClick={toggleFocus}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="listbox"
        aria-multiselectable="true"
        style={customStyle}
      >
        <img
          src={color === "white" ? arrowGrey : arrowWhite}
          className={helpers.clx(styles.arrow, focused && styles.arrowReversed)}
          alt=""
        />
        <div
          className={helpers.clx(
            styles.selectedOption,
            noneSelected && styles.selectedOptionPlaceholder
          )}
          title={noneSelected ? placeholder : selectedPreview}
        >
          {selectedPreview}
        </div>

        <div
          className={focused ? styles.selectedOptionLineFocused : styles.selectedOptionLine}
        />

        {focused && (
          <div className={styles.optionsContainer}>
            {data.map((option) => {
              const checked = values.includes(option.value);
              return (
                <div
                  key={option.value}
                  className={helpers.clx(
                    styles.optionRow,
                    checked && styles.optionRowSelected
                  )}
                  onClick={() => toggleValue(option.value)}
                  role="option"
                  aria-selected={checked}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleValue(option.value)}
                    className={styles.checkbox}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className={styles.optionLabel}>{option.name}</span>
                </div>
              );
            })}

            <div className={styles.footerRow}>
              <button
                type="button"
                className={helpers.clx(styles.footerBtn, allSelected && styles.footerBtnActive)}
                onClick={selectAll}
              >
                Select all
              </button>
              <button type="button" className={styles.footerBtn} onClick={clearAll}>
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MultiSelector;
