import React from 'react';
import styles from './Button.module.css';
import helpers from '../helpers.js';
import Icon from './Icon.js';

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
  iconName = '',          // react-icons icon name (e.g., "FaHome")
  icon = '',              // Character/emoji icon (deprecated in favor of iconName)
  iconPosition = 'left',  // 'left' or 'right'
  iconSize = 18,
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
    
    // Prefer iconName (react-icons) over legacy icon prop
    let iconElement = null;
    if (iconName) {
      iconElement = <Icon name={iconName} size={iconSize} className={styles.buttonIcon} />;
    } else if (icon) {
      iconElement = <span className={styles.buttonIcon}>{icon}</span>;
    }
    
    if (iconPosition === 'right') {
      return (
        <span className={styles.buttonContent}>
          {displayName}
          {iconElement}
        </span>
      );
    } else {
      return (
        <span className={styles.buttonContent}>
          {iconElement}
          {displayName}
        </span>
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
