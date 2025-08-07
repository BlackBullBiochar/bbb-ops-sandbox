// utils/sameDayDelivery.js
export const getSameDayDeliveryStats = (bags) => {
  console.log('📦 Total bags received:', bags.length);

  const validBags = bags.filter(bag =>
    bag?.locations?.pickedUp?.time && bag?.locations?.delivered?.time
  );
  console.log('✅ Bags with both pickup and delivery times:', validBags.length);

  const sameDayCount = validBags.filter(bag => {
    const pickedUpDate = new Date(bag.locations.pickedUp.time).toISOString().slice(0, 10);
    const deliveredDate = new Date(bag.locations.delivered.time).toISOString().slice(0, 10);
    const isSameDay = pickedUpDate === deliveredDate;

    console.log(`🕓 Bag ${bag._id || '[no id]'} - Picked up: ${pickedUpDate}, Delivered: ${deliveredDate}, Same day: ${isSameDay}`);
    return isSameDay;
  }).length;

  const total = validBags.length;
  const percentage = total === 0 ? 0 : (sameDayCount / total) * 100;

  console.log('📊 Same-day count:', sameDayCount);
  console.log('📊 Total valid bags:', total);
  console.log('📊 Percentage same-day:', percentage.toFixed(2), '%');

  return {
    total,
    sameDayCount,
    percentage: percentage.toFixed(2)
  };
};
