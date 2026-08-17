import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { router } from './routes.js';

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true
}));

app.use(express.json({ limit: '2mb' }));

app.use('/api', router);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: error.message || 'Internal server error.'
  });
});

app.listen(port, () => {
  console.log(`AnimeVault API running at http://localhost:${port}`);
});
