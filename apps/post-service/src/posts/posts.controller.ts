import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CommentDto } from './dto/comment.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  // For simplicity, authorId is hard-coded or will come from auth middleware later
  @Post()
  create(@Body() dto: CreatePostDto) {
    const authorId = 'demo-author-id';
    return this.postsService.createPost(authorId, dto);
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