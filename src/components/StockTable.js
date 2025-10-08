import React from 'react';
import Button from './Button.js';

const StockTable = ({ stocks = [], onDelete }) => (
  <table border="1" cellPadding="8">
    <thead>
      <tr>
        <th>Symbol</th>
        <th>Name</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {stocks.length === 0 ? (
        <tr>
          <td colSpan="5">No stock data available.</td>
        </tr>
      ) : (
        stocks.map(stock => (
          <tr key={stock.shorthand}>
            <td>{stock.shorthand}</td>
            <td>{stock.name}</td>
            <td>{stock.price}</td>
            <td>{stock.quantity}</td>
            <td>
              <Button
                name="Delete"
                onPress={() => onDelete(stock.shorthand)}
                color="Coal"
                size="small"
              />
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

export default StockTable;
