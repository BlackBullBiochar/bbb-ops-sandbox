// hooks/useHeatTotal.js
import { useMemo } from 'react';

/**
 * Returns the difference between the first and last valid reading of a given numeric field.
 *
 * @param {Array<{ meterTs?: string|Date, timestamp?: string|Date, [key: string]: any }>} readings
 * @param {string} field  the numeric field to diff (e.g. "energy")
 * @returns {number|null}  last(field) - first(field), or null if not enough valid data
 */
export function useHeatTotal(readings, field = 'energy') {
  return useMemo(() => {
    console.log('\n🔥 ========== HEAT OUTPUT CALCULATION (useHeatTotal) ==========');
    console.log(`📊 Field being analyzed: "${field}"`);
    console.log(`📊 Total readings provided: ${readings?.length || 0}`);

    if (!Array.isArray(readings) || readings.length < 2) {
      console.log('❌ Insufficient data: Need at least 2 readings');
      console.log('Result: null');
      console.log('🔥 ========== END HEAT OUTPUT CALCULATION ==========\n');
      return null;
    }

    // Helper: convert any timestamp to a Date representing the same wall-clock
    // time in Europe/London (DST-aware) by building a UTC Date from parts.
    const toLondonDate = (input) => {
      const d = input instanceof Date ? input : new Date(input);
      if (!(d instanceof Date) || isNaN(d)) return null;
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(d).reduce((acc, p) => {
        acc[p.type] = p.value;
        return acc;
      }, {});
      const year = Number(parts.year);
      const month = Number(parts.month);
      const day = Number(parts.day);
      const hour = Number(parts.hour);
      const minute = Number(parts.minute);
      const second = Number(parts.second);
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    };

    // normalize timestamps and sort using Europe/London wall-clock time
    console.log('\n🔄 Step 1: Normalizing and sorting readings by timestamp...');
    const sorted = readings
      .map((r, idx) => {
        const rawTs = r.meterTs ?? r.timestamp;
        const _ts = rawTs instanceof Date ? rawTs : new Date(rawTs);
        const _ukTs = toLondonDate(rawTs);
        return { ...r, _ts, _ukTs, _originalIndex: idx };
      })
      .filter(r => r._ukTs instanceof Date && !isNaN(r._ukTs.getTime()))
      .sort((a, b) => a._ukTs - b._ukTs);

    console.log(`   - Valid readings after filtering: ${sorted.length}`);
    if (sorted.length > 0) {
      console.log(`   - Earliest timestamp (UK): ${sorted[0]._ukTs.toISOString()}`);
      console.log(`   - Latest timestamp (UK): ${sorted[sorted.length - 1]._ukTs.toISOString()}`);
      console.log(`   - Time span: ${((sorted[sorted.length - 1]._ukTs - sorted[0]._ukTs) / (1000 * 60 * 60 * 24)).toFixed(2)} days`);
    }

    // find first valid numeric
    console.log('\n🔍 Step 2: Finding FIRST valid reading...');
    let firstVal = null;
    let firstTimestamp = null;
    let firstIndex = -1;
    let firstRow = null;
    for (const row of sorted) {
      const n = parseFloat(row[field]);
      if (!Number.isNaN(n)) {
        firstVal = n;
        firstTimestamp = row._ukTs;
        firstIndex = row._originalIndex;
        firstRow = row;
        console.log(`   ✅ Found first valid reading:`);
        console.log(`      - Meter Reading: ${firstVal.toFixed(2)} MWh`);
        console.log(`      - Date: ${firstTimestamp.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/London' })}`);
        console.log(`      - Time: ${firstTimestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Europe/London' })}`);
        console.log(`      - Full Timestamp (ISO): ${firstTimestamp.toISOString()}`);
        console.log(`      - Array index: ${firstIndex}`);
        break;
      }
    }

    // find last valid numeric
    console.log('\n🔍 Step 3: Finding LAST valid reading...');
    let lastVal = null;
    let lastTimestamp = null;
    let lastIndex = -1;
    let lastRow = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      const row = sorted[i];
      const n = parseFloat(row[field]);
      if (!Number.isNaN(n)) {
        lastVal = n;
        lastTimestamp = row._ukTs;
        lastIndex = row._originalIndex;
        lastRow = row;
        console.log(`   ✅ Found last valid reading:`);
        console.log(`      - Meter Reading: ${lastVal.toFixed(2)} MWh`);
        console.log(`      - Date: ${lastTimestamp.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/London' })}`);
        console.log(`      - Time: ${lastTimestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Europe/London' })}`);
        console.log(`      - Full Timestamp (ISO): ${lastTimestamp.toISOString()}`);
        console.log(`      - Array index: ${lastIndex}`);
        break;
      }
    }

    if (firstVal === null || lastVal === null) {
      console.log('\n❌ Could not find valid first and/or last values');
      console.log('Result: null');
      console.log('🔥 ========== END HEAT OUTPUT CALCULATION ==========\n');
      return null;
    }

    console.log('\n🧮 Step 4: Calculating delta...');
    const delta = lastVal - firstVal;
    const timeSpanMs = lastTimestamp - firstTimestamp;
    const timeSpanDays = timeSpanMs / (1000 * 60 * 60 * 24);
    const timeSpanHours = timeSpanMs / (1000 * 60 * 60);
    
    console.log('\n   📊 START READING:');
    console.log(`      Meter: ${firstVal.toFixed(2)} MWh`);
    console.log(`      Date:  ${firstTimestamp.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}`);
    console.log(`      Time:  ${firstTimestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`);
    
    console.log('\n   📊 END READING:');
    console.log(`      Meter: ${lastVal.toFixed(2)} MWh`);
    console.log(`      Date:  ${lastTimestamp.toLocaleDateString('en-GB', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}`);
    console.log(`      Time:  ${lastTimestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`);
    
    console.log('\n   🧮 CALCULATION:');
    console.log(`      Formula: End Reading - Start Reading`);
    console.log(`      ${lastVal.toFixed(2)} MWh - ${firstVal.toFixed(2)} MWh = ${delta.toFixed(2)} MWh`);
    console.log(`      Delta (MWh): ${delta.toFixed(2)} MWh`);
    
    console.log('\n   ⏱️  TIME SPAN:');
    console.log(`      Days: ${timeSpanDays.toFixed(2)} days`);
    console.log(`      Hours: ${timeSpanHours.toFixed(2)} hours`);
    console.log(`      Average per day: ${(delta / timeSpanDays).toFixed(2)} MWh/day`);
    console.log(`      Average per hour: ${(delta / timeSpanHours).toFixed(2)} MWh/hour`);

    console.log(`\n✅ FINAL RESULT: ${delta.toFixed(2)} MWh`);
    console.log('🔥 ========== END HEAT OUTPUT CALCULATION ==========\n');

    return delta;
  }, [readings, field]);
}
