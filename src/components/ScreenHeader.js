import React from 'react';
import styles from './ScreenHeader.module.css'; //styles



/*
    SCREEN HEADER
        props:
            name: str, name and label of header
            content: str, subtitle/description text
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

ScreenHeader.defaultProps = {
    name: '',
    content: '',
};


export default React.memo(ScreenHeader);