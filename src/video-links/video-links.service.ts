import { Injectable } from '@nestjs/common';
import { VideoLinkDto } from './dto/video-link.dto';
import { VideoDownloaderService } from './video-downloader.service';

@Injectable()
export class VideoLinksService {
  
  constructor(protected videoDownloaderService: VideoDownloaderService){}
  
    async getVideoFromLinks(videoLinksDto: VideoLinkDto[]) {
      return await this.videoDownloaderService.downloadVideoFromVideoLinks(videoLinksDto);
  }
  
}
