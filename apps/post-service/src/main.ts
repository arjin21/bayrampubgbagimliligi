import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });
  const port = process.env.PORT || 3003;
  await app.listen(port);
  console.log(`Post Service running at http://localhost:${port}`);
}
bootstrap();