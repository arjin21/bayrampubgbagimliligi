import { Body, Controller, Get, Param, Post, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CommentDto } from './dto/comment.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // For simplicity, authorId is hard-coded or will come from auth middleware later
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req: Express.Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const unique = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, unique);
        },
      }),
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreatePostDto,
    @Req() req: any,
  ) {
    const authorId = (req.user?.userId as string) || 'demo-author-id';
    const mediaUrl = `/uploads/${file.filename}`;
    return this.postsService.createPost(authorId, dto.caption, mediaUrl);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.postsService.findById(id);
  }

  @Post(':id/like')
  toggleLike(@Param('id') id: string) {
    const userId = 'demo-user-id';
    return this.postsService.toggleLike(id, userId);
  }

  @Post(':id/comment')
  comment(@Param('id') id: string, @Body() dto: CommentDto) {
    const userId = 'demo-user-id';
    return this.postsService.addComment(id, userId, dto);
  }
}