import { IsNotEmpty, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class VideoLinkDto {
  
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  link: string;
  
  @IsObject()
  @IsOptional()
  options: Object;
}
