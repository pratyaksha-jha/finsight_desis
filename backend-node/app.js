require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors    = require('cors');
const app     = express();

app.use(cors());
app.use(express.json());

const authRoutes     = require('./routes/auth.routes');
const parentalRoutes = require('./routes/parental.routes');
const comparisonRoutes = require('./routes/comparison');
const newsRoutes       = require('./routes/news');
const watchlistRoutes  = require('./routes/watchlist');


app.use('/api/auth',     authRoutes);
app.use('/api/parental', parentalRoutes);
app.use('/api/comparison', comparisonRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/watchlist', watchlistRoutes);

app.get('/', (req, res) => res.send('FinSight Node API running'));

const PORT = process.env.NODE_PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`FinSight Node backend running on port ${PORT}`);
});
