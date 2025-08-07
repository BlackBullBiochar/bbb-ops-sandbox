import styles from './Checkbox.module.css'; //styles
import helpers from '../helpers.js';
import { useState } from 'react';



/*
    CHECKBOX
        props:
            checked: boolean, sets checkbox status (checked, unchecked)
            onPress: function, action carried out when checked/unchecked
            label: str, label
            inverted: bool, if true sets label before checkbox 
*/
const Checkbox = (props) => {
    // const [isChecked, setIsChecked] = useState(props.checked);
    const check = () => {
        // setIsChecked((prevIsChecked) => !prevIsChecked);
        props.onPress();
    }

    // useEffect(() => { OTHER COLORS?
        
    // }, [props.color])

    return(
        <div className={props.inverted ? helpers.clx(styles.CheckboxRow, styles.CheckboxRowInverted) : styles.CheckboxRow} style={props.customStyle}>
            <div className={props.inverted ? helpers.clx(styles.Checkbox, styles.CheckboxInverted): styles.Checkbox} onClick={check}>  
                <div className={props.checked ? helpers.clx(styles.Check, styles.Checked) : styles.Check}/>
            </div>
            <div className={props.thinnerText ? styles.thinnerText : null}>
                {props.text}
            </div>
        </div>
    )
}

Checkbox.defaultProps = {
    thinnerText: false,
    checked: false,
    onPress: console.log("Set CheckBox onPress"),
    text: "Change checkbox text prop",
    inverted: false
  };

export default Checkbox;