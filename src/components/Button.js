import React from 'react';
import styles from './Button.module.css';
import helpers from '../helpers.js';

// Button component supports two size variants: "normal" and "small" via the `size` prop.
const Button = React.memo(({
  name = 'InputName',
  nameSelected = '',
  color = 'Leaf',
  size = 'normal',        // 'normal' or 'small'
  disabled = false,
  selected = false,
  onPress = () => {},
  customStyle = {},
  iconName = '',
  icon = '',              // Character/emoji icon
  iconPosition = 'left',  // 'left' or 'right'
}) => {
  console.log('render Button');

  // Determine the base container style based on size
  const baseClass = size === 'small' ? styles.ContainerSmall : styles.Container;
  // Determine the color variation
  const colorClass = styles[`Container${color}`] || '';
  // Disabled and selected states
  const disabledClass = disabled ? styles.ContainerDisabled : '';
  const selectedClass = selected ? styles.buttonSelected : '';

  const className = helpers.clx(
    baseClass,
    colorClass,
    disabledClass,
    selectedClass
  );

  const renderContent = () => {
    const displayName = selected ? nameSelected : name;
    const iconElement = icon ? <span className={styles.buttonIcon}>{icon}</span> : null;
    
    if (iconPosition === 'right') {
      return (
        <>
          {displayName}
          {iconElement}
        </>
      );
    } else {
      return (
        <>
          {iconElement}
          {displayName}
        </>
      );
    }
  };

  return (
    <div className={styles.ButtonContainer} style={customStyle}>
      <div
        className={className}
        onClick={!disabled ? onPress : null}
      >
        {renderContent()}
      </div>
    </div>
  );
});

export default Button;
