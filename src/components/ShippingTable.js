// components/ShippingTable.jsx
import React from "react";
import PerformanceTable from "./PerformanceTable";

const ShippingTable = ({ bags = [] }) => {
  const columns = [
    { header: "Bag ID", accessor: (b) => b._id },
    {
      header: "Pickup Time",
      accessor: (b) =>
        b.locations?.pickup?.time
          ? new Date(b.locations.pickup.time).toLocaleString()
          : "–",
    },
    {
      header: "Delivery Time",
      accessor: (b) =>
        b.locations?.delivery?.time
          ? new Date(b.locations.delivery.time).toLocaleString()
          : "–",
    },
    { header: "Status", accessor: (b) => b.status || "–" },
    {
      header: "Flagged?",
      accessor: (b) =>
        b.flagged ? (
          <span style={{ color: "red" }}>Flagged</span>
        ) : (
          <span style={{ color: "green" }}>Approved</span>
        ),
    },
  ];

  return <PerformanceTable columns={columns} data={bags} />;
};

export default ShippingTable;
