import React from 'react';
import StockTable from '../StockTable';

const StockPage = ({ stocks, newStock, addStock, removeStock, handleInputChange }) => {
  return (
    <div>
      <h2>Add Stock</h2>
      <input
        name="shorthand"
        placeholder="shorthand"
        value={newStock.shorthand}
        onChange={handleInputChange}
      />
      <input
        name="name"
        placeholder="Name"
        value={newStock.name}
        onChange={handleInputChange}
      />
      <input
        name="price"
        placeholder="Price"
        type="number"
        value={newStock.price}
        onChange={handleInputChange}
      />
      <input
        name="quantity"
        placeholder="Quantity"
        type="number"
        value={newStock.quantity}
        onChange={handleInputChange}
      />
      <button onClick={addStock}>Add Stock</button>

      <StockTable stocks={stocks} onDelete={removeStock} />
    </div>
  );
};

export default StockPage;
