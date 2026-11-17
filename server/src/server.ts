import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { connectDB } from './config/db';
import { seedBenchmarkData } from './scripts/seedBenchmark';
import { Product } from './models';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    
    // Auto-seed if database is fresh
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('[Bootstrap] No existing products found. Seeding NIT Tiruchirappalli Section 5 Master Data...');
      await seedBenchmarkData();
    }

    const app = createApp();
    app.listen(PORT, () => {
      console.log(`================================================================`);
      console.log(` ZenLyft Manufacturing Business OS API running on port ${PORT} `);
      console.log(` Health check: http://localhost:${PORT}/health                  `);
      console.log(` API Endpoint: http://localhost:${PORT}/api                     `);
      console.log(`================================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
