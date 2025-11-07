// hooks/useBagStats.js
import { useMemo } from 'react';

/**
 * @param {Array<{ weight: number|string }>} bagRows
 * @returns {{ totalWeight: number, bagCount: number }}
 */
export function useBagStats(bagRows) {
  return useMemo(() => {
    console.log('\n🔷 ========== BIOCHAR WEIGHT CALCULATION (useBagStats) ==========');
    
    if (!Array.isArray(bagRows) || bagRows.length === 0) {
      console.log('❌ No bag rows available');
      console.log('Result: { totalWeight: 0 kg, bagCount: 0 }');
      console.log('🔷 ========== END BIOCHAR WEIGHT CALCULATION ==========\n');
      return { totalWeight: 0, bagCount: 0 };
    }

    const bagCount = bagRows.length;
    console.log(`📊 Total bags to process: ${bagCount}`);
    console.log('\n📦 Processing individual bags:');
    
    const totalWeight = bagRows.reduce((sum, row, index) => {
      const rawWeight = row.weight;
      const w = typeof rawWeight === 'string'
        ? parseFloat(rawWeight)
        : rawWeight;
      
      const validWeight = Number.isNaN(w) ? 0 : w;
      const newSum = sum + validWeight;
      
      console.log(`  Bag ${index + 1}/${bagCount}:`);
      console.log(`    - Raw weight: ${rawWeight}`);
      console.log(`    - Parsed weight: ${w} kg`);
      console.log(`    - Valid weight: ${validWeight} kg`);
      console.log(`    - Running total: ${newSum.toFixed(2)} kg`);
      
      return newSum;
    }, 0);

    console.log(`\n✅ FINAL RESULTS:`);
    console.log(`   - Total bags processed: ${bagCount}`);
    console.log(`   - Total weight (raw): ${totalWeight.toFixed(2)} kg`);
    console.log(`   - Total weight (tonnes): ${(totalWeight / 1000).toFixed(3)} t`);
    console.log('🔷 ========== END BIOCHAR WEIGHT CALCULATION ==========\n');

    return { totalWeight, bagCount };
  }, [bagRows]);
}
