import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentDto } from './dto/comment.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async createPost(authorId: string, caption: string | undefined, mediaUrl: string) {
    return this.prisma.post.create({
      data: {
        authorId,
        mediaUrl,
        caption,
      },
    });
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        likes: true,
        comments: {
          include: { author: true },
        },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async toggleLike(postId: string, userId: string) {
    const existing = await this.prisma.like.findFirst({ where: { postId, userId } });
    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }
    await this.prisma.like.create({ data: { postId, userId } });
    return { liked: true };
  }

  async addComment(postId: string, userId: string, dto: CommentDto) {
    return this.prisma.comment.create({
      data: {
        postId,
        authorId: userId,
        content: dto.content,
      },
    });
  }
}