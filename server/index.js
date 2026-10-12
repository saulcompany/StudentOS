import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', aiRoutes);

app.use((error, req, res, next) => {
  if (error) {
    console.error('Unexpected API error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An unexpected server error occurred.',
      },
    });
  }
  return next();
});

app.listen(port, () => {
  console.log(`StudentOS API running on http://localhost:${port}`);
});
