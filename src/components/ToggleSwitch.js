import styles from './ToggleSwitch.module.css'; //styles
import helpers from '../helpers.js';
import { useState } from 'react';



/*
    ToggleSwitch
        props:
            checked: boolean, sets ToggleSwitch status (checked, unchecked)
            onPress: function, action carried out when checked/unchecked
            label: str, label
            inverted: bool, if true sets label before ToggleSwitch 
*/
const ToggleSwitch = (props) => {
    const toggle = () => {
        props.onPress();
    }

    // useEffect(() => { OTHER COLORS?
        
    // }, [props.color])

    return(
        <div className={helpers.clx(styles.container, props.toggled ? styles.containerToggled : "")} onClick={toggle}>
            <div className={helpers.clx(styles.circle, props.toggled ? styles.circleToggled : "")}/>
        </div>
    )
}

ToggleSwitch.defaultProps = {
    toggled: false,
    onPress: console.log("Set ToggleSwitch onPress")
  };

export default ToggleSwitch;