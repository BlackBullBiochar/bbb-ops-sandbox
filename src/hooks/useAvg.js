import { useState, useEffect } from 'react';

/**
 * @param {Array|Object} tempInput  – temps rows (array, {data:[]}, or date-keyed)
 * @param {Array|Object} bagInput   – bag rows (array, {data:[]}, or date-keyed)
 * @returns {[avg1, avg2, avg5, bagAvgWeight, bagTotalWeight]}
 */
export function useAvgTemps(tempInput, bagInput) {
  // normalize temps to plain array
  const tempRows = Array.isArray(tempInput)
    ? tempInput
    : Array.isArray(tempInput?.data)
      ? tempInput.data
      : tempInput && typeof tempInput === 'object'
        ? Object.values(tempInput).flat()
        : [];

  // normalize bags to plain array
  const bagRows = Array.isArray(bagInput)
    ? bagInput
    : Array.isArray(bagInput?.data)
      ? bagInput.data
      : bagInput && typeof bagInput === 'object'
        ? Object.values(bagInput).flat()
        : [];

  const [avg1, setAvg1] = useState(null);
  const [avg2, setAvg2] = useState(null);
  const [avg5, setAvg5] = useState(null);
  const [bagAvgWeight, setBagAvgWeight] = useState(null);
  const [bagTotalWeight, setBagTotalWeight] = useState(null);
  const [bagAvgMC, setBagAvgMC] = useState(null);

  useEffect(() => {
    // Temps
    const t1 = [], t2 = [], t5 = [];
    for (const r of tempRows) {
      const v1 = parseFloat(r.r1_temp);
      if (!isNaN(v1)) t1.push(v1);
      const v2 = parseFloat(r.r2_temp);
      if (!isNaN(v2)) t2.push(v2);
      const v5 = parseFloat(r.t5_temp);
      if (!isNaN(v5)) t5.push(v5);
    }

    // Bags
    const weights = [];
    const mContent = [];
    for (const r of bagRows) {
      const w = parseFloat(r.weight);
      if (!isNaN(w)) weights.push(w);
      const mc = parseFloat(r.moisture_content);
      if (!isNaN(mc)) mContent.push(mc);
    }

    // helper
    const average = arr =>
      arr.length > 0
        ? arr.reduce((sum, x) => sum + x, 0) / arr.length
        : null;

    // compute
    const a1 = average(t1);
    const a2 = average(t2);
    const a5 = average(t5);
    const bagMCAvg = average(mContent);
    const bagAvg = average(weights);
    const bagAvgMC = average(mContent);
    const bagTotal = weights.length > 0 ? weights.length * bagAvg : null;

    // set state
    setAvg1(a1);
    setAvg2(a2);
    setAvg5(a5);
    setBagAvgWeight(bagAvg);
    setBagAvgMC(bagMCAvg);
    setBagTotalWeight(bagTotal);
  }, [tempRows, bagRows]);

  return [avg1, avg2, avg5, bagAvgWeight, bagAvgMC, bagTotalWeight];
}
