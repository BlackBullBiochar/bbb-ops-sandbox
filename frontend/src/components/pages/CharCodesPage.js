import React from 'react';

const CharCodesPage = ({ charCodes = [] }) => {
  return (
    <div>
      <h2>Charcodes</h2>
      {charCodes.length === 0 ? (
        <p>No char codes to display.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {charCodes.map((char, index) => (
              <tr key={index}>
                <td>{char.code}</td>
                <td>{char.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CharCodesPage;
