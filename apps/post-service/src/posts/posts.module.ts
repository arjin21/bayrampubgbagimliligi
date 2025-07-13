import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';

const storage = diskStorage({
  destination: './uploads',
  filename: (_req, file, cb) => {
    const unique = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, unique);
  },
});

@Module({
  imports: [
    MulterModule.register({ storage }),
  ],
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
})
export class PostsModule {}