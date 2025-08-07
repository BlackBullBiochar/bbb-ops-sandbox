import { useMemo } from 'react';

const usePowerFromSensorRows = (sensorRows) => {
  return useMemo(() => {
    if (!Array.isArray(sensorRows) || sensorRows.length < 2) return { powerData: [], powerLabels: [] };

    // Ensure sorted by timestamp ascending
    const sorted = [...sensorRows].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const powerData = [];
    const powerLabels = [];

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      const deltaEnergy = curr.energy - prev.energy; // MWh
      const deltaTimeHrs = (new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60); // ms → h

      const powerMW = deltaTimeHrs !== 0 ? deltaEnergy / deltaTimeHrs : 0;

      powerData.push(powerMW);
      powerLabels.push(curr.timestamp); // You can use midpoint if preferred
    }

    return { powerData, powerLabels };
  }, [sensorRows]);
};

export default usePowerFromSensorRows;
