import React, { useMemo } from 'react';
import styles from './DottedLine.module.css';

/*
  DottedLine Component

  Props:
    - segmentNumber: number of segments to render
    - segmentHeight: height of each segment (e.g., "1rem")
    - segmentWidth: width of each segment (e.g., "0.5rem")
    - color: CSS var name (e.g., "grass" → var(--grass))
    - customStyle: optional inline style override for container
*/

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
