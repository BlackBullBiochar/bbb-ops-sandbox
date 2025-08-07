import React from 'react';
import styles from './ScreenHeader.module.css'; //styles
import helpers from '../helpers.js';



/*

<img/>
<div className="squareClassAndA"/>
    BUTTON
        props:
            name: str, name and label of input
            placeholder: str, placeholder text
            labelStyle: default is on the left, top has the label above the input
            iconName: font awesome icon name, default is no icon
            value: input value (state) from parent
            onPress: setter from parent
            customStyle: TODO based on future requirements
*/
const ScreenHeader = (props) => {
    return(
            <div className={styles.container}>
                <div className={styles.contentWrapper}>
                    <h2 className={styles.header}>
                        {props.name}
                    </h2>
                    <h3 className={styles.subHeader}>
                        {props.content}
                    </h3>
                 </div>
                 <div className={styles.line}/>
            </div>
    )
}


export default React.memo(ScreenHeader);