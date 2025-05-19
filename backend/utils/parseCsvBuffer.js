const csv = require('csv-parser');
const { Readable } = require('stream');

const parseCsvBuffer = (buffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    Readable.from(buffer)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

module.exports = parseCsvBuffer;
