// 1) Context
import React, { createContext, useState } from "react";
import { API } from '../config/api';

export const BagContext = createContext();

export const BagProvider = ({ children, user }) => {
  const [isWeek, setIsWeek]     = useState(true);
  const [week, setWeek]         = useState("");        // "YYYY-Www"
  const [fromDate, setFromDate] = useState("");        // "YYYY-MM-DD"
  const [toDate, setToDate]     = useState("");

  const [counts, setCounts]     = useState({
    araBagging: 0,
    jnrBagging: 0,
    araApplication: 0,
    jnrApplication: 0,
    araFlaggedBags: 0,
    jnrFlaggedBags: 0,
    FlaggedDeliveryBags: 0,
    Pickup: 0,
    Delivery: 0,
  });

  // New order performance counts
  const [orderCounts, setOrderCounts] = useState({
    upcoming: 0,
    delivered: 0,
    pickedUp: 0,
  });

  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const ARA_ID = "6661c6cc2e943e2babeca581";
  const JNR_ID = "6661c6bd2e943e2babec9b4d";

  // convert ISO-week to { monday, sunday } in "YYYY-MM-DD"
  const isoWeekToDateRange = (iso) => {
    const [y, w] = iso.split("-W").map(Number);
    const d = new Date(Date.UTC(y, 0, 4));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day + (w - 1) * 7);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() - (d.getUTCDay() || 7) + 1);
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    const fmt = (d) => d.toISOString().slice(0, 10);
    return { from: fmt(monday), to: fmt(sunday) };
  };

  const handleToggle = () => {
    setIsWeek((f) => !f);
    setWeek(""); setFromDate(""); setToDate("");
    setCounts({ araBagging:0, jnrBagging:0, araApplication:0, jnrApplication:0, araFlaggedBags:0, jnrFlaggedBags:0, FlaggedDeliveryBags:0 });
    setOrderCounts({ upcoming: 0, delivered: 0, pickedUp: 0});
    setError("");
  };

  const handleChange = (field, val) => {
    setError("");
    if (field === "week") setWeek(val);
    if (field === "from") setFromDate(val);
    if (field === "to")   setToDate(val);
  };

  const handleFetch = async () => {
    if (!user?.token || !API) {
      setError("Missing auth or backend URL");
      return;
    }

    // determine from/to
    let from, to;
    if (isWeek) {
      if (!week) { setError("Select ISO-week"); return; }
      ({ from, to } = isoWeekToDateRange(week));
    } else {
      if (!fromDate || !toDate) { setError("Select both dates"); return; }
      from = fromDate;
      to   = toDate;
    }

    setLoading(true);
    setError("");

    try {
      // Fetch bag performance
      const bagRes = await fetch(
        `${API}/bags/performance?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (!bagRes.ok) throw new Error(await bagRes.text());
      const { data: { bags = [] } = {} } = await bagRes.json();

      // Initialize bag counters
      const ctr = {
        araBagging: 0, jnrBagging: 0,
        araLogging: 0, jnrLogging: 0,
        Delivery: 0, Pickup: 0,
        araApplication: 0, jnrApplication: 0,
        araFlaggedBags: 0, jnrFlaggedBags: 0,
        FlaggedDeliveryBags: 0,
      };
      const start = new Date(from);
      const end   = new Date(to);

      bags.forEach(bag => {
        const site = String(bag._site) === ARA_ID ? "ara" : "jnr";

        // Bagging date
        if (bag.bagging_date) {
          const bd = new Date(bag.bagging_date);
          if (bd >= start && bd <= end) ctr[`${site}Bagging`]++;
        }

        // Logging date
        const logTime = bag.locations?.bagging?.time;
        if (logTime) {
          const logDate = new Date(logTime.split('T')[0]);
          if (logDate >= start && logDate <= end) ctr[`${site}Logging`]++;
        }

        // Flagged bags (> 3 days between bag and log)
        if (bag.bagging_date && logTime) {
          const bd = new Date(bag.bagging_date);
          const ld = new Date(logTime.split('T')[0]);
          const diffDays = (ld - bd) / (1000*60*60*24);
          if (diffDays > 3) ctr[`${site}FlaggedBags`]++;
        }

        //pickup time 
        const pickTime = bag.locations?.pickup?.time;
        if (pickTime) {
          const pd = new Date(pickTime);
          if (pd >= start && pd <= end) ctr[`Pickup`]++;
        }

        //delivery time
        const deliveryTime = bag.locations?.delivery?.time;
        if (deliveryTime) {
          const dd = new Date(deliveryTime);
          if (dd >= start && dd <= end) ctr[`Delivery`]++;
        }

        // Flagged delivery bags (> 1 days between bag and log)
        if (pickTime && deliveryTime) {
          const pd = new Date(pickTime.split('T')[0]);
          const dd = new Date(deliveryTime.split('T')[0]);
          const diffDays = (pd - dd) / (1000*60*60*24);
          if (diffDays > 1) ctr[`FlaggedDeliveryBags`]++;
        }

        if (pickTime && !deliveryTime) {
          ctr[`FlaggedDeliveryBags`]++;
        }

        // Application date
        const appTime = bag.locations?.application?.time;
        if (appTime) {
          const ad = new Date(appTime);
          if (ad >= start && ad <= end) ctr[`${site}Application`]++;
        }
      });
      setCounts(ctr);
      console.log(ctr);

      // Fetch order performance
      const orderRes = await fetch(
        `${API}/order/performance?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      if (!orderRes.ok) throw new Error(await orderRes.text());
      const { data: {statusCounts = {}} = {} } = {} = await orderRes.json();

      // Extract upcoming & delivered & pickedUp counts
      setOrderCounts({
        upcoming: statusCounts.upcoming || 0,
        delivered: statusCounts.delivered || 0,
        pickedUp: statusCounts.pickedUp || 0,
      });

    } catch (e) {
      console.error(e);
      setError("Fetch failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BagContext.Provider
      value={{
        isWeek, week, fromDate, toDate,
        ...counts,
        ...orderCounts,
        loading, error,
        handleToggle,
        handleChange,
        handleFetch,
      }}
    >
      {children}
    </BagContext.Provider>
  );
};
