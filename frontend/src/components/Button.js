import React from 'react';
import styles from './Button.module.css'; //styles
import helpers from '../helpers.js';



const Button = (props) => {

    let colorString = "Container" + props.color; //ContainerCoal
    console.log("render")

    return(
            <div style={props.customStyle} className={styles.ButtonContainer}>
                <div className={helpers.clx(styles.Container, props.disabled ? styles.ContainerDisabled : "", styles[colorString], props.selected ? styles.buttonSelected : "")}  onClick={!props.disabled ? props.onPress: null}>
                    {props.selected ? props.nameSelected : props.name}
                 </div>
            </div>
    )
}

Button.defaultProps = {
    name: 'InputName',
    disabled: false,
    color: "Leaf",
    onPress: console.log("Change onReleaseProp"),
    iconName: "",
    customStyle: {},
    selected: false,
    nameSelected: ""
};

export default React.memo(Button);