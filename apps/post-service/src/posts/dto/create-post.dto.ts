import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  mediaUrl!: string;

  @IsString()
  @IsOptional()
  caption?: string;
}