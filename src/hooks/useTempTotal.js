// hooks/useRunningHours.js
import { useMemo } from 'react';

/**
 * Calculates total time (in hours) that the given fields
 * stayed within [low, high] over the provided timestamped rows.
 *
 * @param {Array<{ timestamp: string|Date, [field: string]: string|number }>} rows
 * @param {number} low   lower bound (inclusive)
 * @param {number} high  upper bound (inclusive)
 * @param {string[]} fields  which numeric fields to check (e.g. ['r1_temp','r2_temp'])
 * @returns {{ hours: number, milliseconds: number }}
 */
export function useRunningHours(rows, low, high, fields = ['r1_temp','r2_temp']) {
  return useMemo(() => {
    console.log('\n⏱️  ========== RUNNING HOURS CALCULATION (useRunningHours) ==========');
    console.log(`📊 Total rows provided: ${rows?.length || 0}`);
    console.log(`📊 Temperature range: ${low}°C - ${high}°C`);
    console.log(`📊 Fields to monitor: [${fields.join(', ')}]`);
    
    if (!Array.isArray(rows) || rows.length < 2) {
      console.log('❌ Insufficient data: Need at least 2 readings');
      console.log('Result: { hours: 0, milliseconds: 0 }');
      console.log('⏱️  ========== END RUNNING HOURS CALCULATION ==========\n');
      return { hours: 0, milliseconds: 0 };
    }

    // normalize & sort by timestamp
    console.log('\n🔄 Step 1: Normalizing and sorting temperature readings...');
    const sorted = rows
      .map(r => {
        const ts = r.timestamp instanceof Date
          ? r.timestamp
          : new Date(r.timestamp);
        return { ...r, _ts: ts };
      })
      .filter(r => r._ts instanceof Date && !isNaN(r._ts.getTime()))
      .sort((a, b) => a._ts - b._ts);

    console.log(`   - Valid readings after filtering: ${sorted.length}`);
    if (sorted.length > 0) {
      console.log(`   - Earliest timestamp: ${sorted[0]._ts.toISOString()}`);
      console.log(`   - Latest timestamp: ${sorted[sorted.length - 1]._ts.toISOString()}`);
      console.log(`   - Time span: ${((sorted[sorted.length - 1]._ts - sorted[0]._ts) / (1000 * 60 * 60 * 24)).toFixed(2)} days`);
    }

    let totalMs = 0;
    let inSpecIntervals = 0;
    let outOfSpecIntervals = 0;

    console.log('\n🔍 Step 2: Processing intervals between consecutive readings...');
    console.log('   (Only counting intervals where ALL fields are within spec at BOTH endpoints)\n');

    for (let i = 0; i < sorted.length - 1; i++) {
      const a = sorted[i];
      const b = sorted[i + 1];
      
      // check every field in‐spec at both ends
      const fieldChecksA = [];
      const fieldChecksB = [];
      
      fields.forEach(f => {
        const vA = parseFloat(a[f]);
        const vB = parseFloat(b[f]);
        const inSpecA = !isNaN(vA) && vA >= low && vA <= high;
        const inSpecB = !isNaN(vB) && vB >= low && vB <= high;
        fieldChecksA.push({ field: f, value: vA, inSpec: inSpecA });
        fieldChecksB.push({ field: f, value: vB, inSpec: inSpecB });
      });
      
      const inSpecA = fieldChecksA.every(fc => fc.inSpec);
      const inSpecB = fieldChecksB.every(fc => fc.inSpec);
      
      const intervalMs = b._ts - a._ts;
      const intervalHours = intervalMs / (1000 * 60 * 60);
      
      if (inSpecA && inSpecB) {
        totalMs += intervalMs;
        inSpecIntervals++;
        
        // Only log first 5 and last 5 in-spec intervals to avoid console spam
        if (inSpecIntervals <= 5 || i >= sorted.length - 6) {
          console.log(`   ✅ Interval ${i + 1}/${sorted.length - 1} [IN SPEC]:`);
          console.log(`      Time: ${a._ts.toISOString()} → ${b._ts.toISOString()}`);
          console.log(`      Duration: ${intervalHours.toFixed(4)} hours`);
          fieldChecksA.forEach(fc => {
            console.log(`      ${fc.field} at start: ${fc.value?.toFixed(1) || 'N/A'}°C ${fc.inSpec ? '✓' : '✗'}`);
          });
          fieldChecksB.forEach(fc => {
            console.log(`      ${fc.field} at end: ${fc.value?.toFixed(1) || 'N/A'}°C ${fc.inSpec ? '✓' : '✗'}`);
          });
          console.log(`      Running total: ${(totalMs / (1000 * 60 * 60)).toFixed(2)} hours\n`);
        } else if (inSpecIntervals === 6) {
          console.log(`   ... (showing first 5 and last 5 in-spec intervals only) ...\n`);
        }
      } else {
        outOfSpecIntervals++;
        
        // Only log first 3 out-of-spec intervals
        if (outOfSpecIntervals <= 3) {
          console.log(`   ⚠️  Interval ${i + 1}/${sorted.length - 1} [OUT OF SPEC - SKIPPED]:`);
          console.log(`      Time: ${a._ts.toISOString()} → ${b._ts.toISOString()}`);
          console.log(`      Duration: ${intervalHours.toFixed(4)} hours (not counted)`);
          fieldChecksA.forEach(fc => {
            console.log(`      ${fc.field} at start: ${fc.value?.toFixed(1) || 'N/A'}°C ${fc.inSpec ? '✓' : '✗'}`);
          });
          fieldChecksB.forEach(fc => {
            console.log(`      ${fc.field} at end: ${fc.value?.toFixed(1) || 'N/A'}°C ${fc.inSpec ? '✓' : '✗'}`);
          });
          console.log();
        } else if (outOfSpecIntervals === 4) {
          console.log(`   ... (${outOfSpecIntervals} more out-of-spec intervals not shown) ...\n`);
        }
      }
    }

    const totalHours = totalMs / 1000 / 60 / 60;
    const totalDays = totalHours / 24;
    const percentageInSpec = sorted.length > 1 ? (inSpecIntervals / (sorted.length - 1)) * 100 : 0;

    console.log('\n📊 Step 3: Summary Statistics');
    console.log(`   - Total intervals analyzed: ${sorted.length - 1}`);
    console.log(`   - Intervals IN SPEC (counted): ${inSpecIntervals}`);
    console.log(`   - Intervals OUT OF SPEC (skipped): ${outOfSpecIntervals}`);
    console.log(`   - Percentage in spec: ${percentageInSpec.toFixed(1)}%`);
    
    console.log(`\n✅ FINAL RESULTS:`);
    console.log(`   - Total running time (milliseconds): ${totalMs.toLocaleString()} ms`);
    console.log(`   - Total running time (hours): ${totalHours.toFixed(2)} hours`);
    console.log(`   - Total running time (days): ${totalDays.toFixed(2)} days`);
    console.log('⏱️  ========== END RUNNING HOURS CALCULATION ==========\n');

    return {
      milliseconds: totalMs,
      hours: totalHours
    };
  }, [rows, low, high, fields.join(',')]);
}
