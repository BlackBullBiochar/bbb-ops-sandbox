const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const formsRoute     = require('./routes/forms'); 
const ebcStatusRoutes = require('./routes/EBCStatus');
const authRoutes = require('./routes/authRoutes');
const siteRoutes = require('./routes/sites');
const bagRoutes = require('./routes/bags');
const ebcstatusRoutes = require('./routes/ebcstatusRoutes')
const tempDataRoutes = require('./routes/tempData')

const app = express();
const PORT = 5000;
let server; // for niuce shutdown


app.use(cors());
app.use(express.json());

// Routes
app.use('/api/forms', formsRoute);
app.use('/api/ebcstatus', ebcStatusRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/bags', bagRoutes);
app.use('/api/ebcstatus', ebcstatusRoutes)
app.use('/api/tempData', tempDataRoutes)


// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('MongoDB connected');

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n Shutting down...');
  if (server) {
    server.close(() => console.log('HTTP server closed'));
  }
  await mongoose.disconnect();
  console.log(' MongoDB disconnected');
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);  // Ctrl+C
process.on('SIGTERM', gracefulShutdown); // e.g. from Docker stop