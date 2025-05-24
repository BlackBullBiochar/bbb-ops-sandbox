import { useState } from "react";
import styles from './TextInput.module.css';
import helpers from '../helpers.js';

import eyePassword1 from "../assets/images/eyePassword1.png"; // visible
import eyePassword2 from "../assets/images/eyePassword2.png"; // hidden

const TextInput = (props) => {
  const [displayPassword, setDisplayPassword] = useState(false);
  const [displayEye, setDisplayEye] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  

  return (
    <div
      style={props.customStyle}
      className={helpers.clx(
        styles.mainContainer,
        props.labelStyle === "top" ? styles.mainContainerLabelTop : ""
      )}
      onMouseEnter={() => setDisplayEye(true)}
      onMouseLeave={() => setDisplayEye(false)}
    >
      <div
        className={helpers.clx(
          styles.labelContainer,
          props.highlighted ? styles.highlightedLabel : ""
        )}
      >
        <div className={styles.labelIcon}>
          {props.iconName}
        </div>
        {props.iconCustom && (
          <img src={props.iconCustom} className={styles.customIcon} alt="icon" />
        )}
        {props.name}
      </div>

      {(props.isPassword && (passwordFocused || displayEye)) && (
        <img
          src={displayPassword ? eyePassword1 : eyePassword2}
          className={styles.passwordDisplayIcon}
          alt="Toggle visibility"
          onClick={() => setDisplayPassword(!displayPassword)}
        />
      )}

      <input
        type="text"
        placeholder={props.placeholder}
        className={helpers.clx(
          styles.textInput,
          props.isPassword && !displayPassword ? styles.password : "",
          props.highlighted ? styles.highlightedInput : ""
        )}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            props.onEnter?.(); // call a custom handler if provided
          } else {
            props.onKeyDown?.(e); // pass other keydowns upstream if defined
          }
        }}
        onFocus={() => setPasswordFocused(true)}
        onBlur={() => setPasswordFocused(false)}
        style={props.height ? { height: props.height } : {}}
      />
    </div>
  );
};

TextInput.defaultProps = {
  highlighted: false,
  name: 'InputName',
  height: "",
  placeholder: "Change Placeholder Prop",
  labelStyle: 'left',
  onChange: () => console.log("Change onChangeProp"),
  iconName: "",
  isPassword: false,
  onKeyDown: () => {}
};

export default TextInput;
