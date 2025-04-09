  const express = require('express');
  const mongoose = require('mongoose');
  const cors = require('cors');
  require('dotenv').config();

  const userRoutes = require('./routes/userRoutes');
  const adminRoutes = require('./routes/adminRoutes');
  const paymentRoutes = require('./routes/paymentRoutes');


  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(cors());
  app.use(express.json());

  app.use('/api/user', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use("/api/payment", paymentRoutes);

  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error(err));
