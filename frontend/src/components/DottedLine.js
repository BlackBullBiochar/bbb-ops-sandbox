import React, { useMemo } from 'react';
import styles from './DottedLine.module.css';


const DottedLine = ({
  segmentNumber,
  segmentHeight,
  segmentWidth,
  color,
  customStyle
}) => {

  const lineHeight = useMemo(() => {
    const heightVal = parseFloat(segmentHeight); // strip 'rem'
    return `${segmentNumber * heightVal * 1.6}rem`;
  }, [segmentNumber, segmentHeight]);

  const segments = useMemo(() => {
    return Array.from({ length: segmentNumber }).map((_, i) => (
      <div
        key={i}
        className={styles.segment}
        style={{
          width: segmentWidth,
          height: segmentHeight,
          background: `var(--${color})`
        }}
      />
    ));
  }, [segmentNumber, segmentHeight, segmentWidth, color]);

  return (
    <div
      className={styles.segmentsContainer}
      style={{ height: lineHeight, ...customStyle }}
    >
      {segments}
    </div>
  );
};

DottedLine.defaultProps = {
  segmentNumber: 5,
  segmentHeight: '0.2rem',
  segmentWidth: '0.7rem',
  color: 'grass',
  customStyle: {}
};

export default React.memo(DottedLine);
