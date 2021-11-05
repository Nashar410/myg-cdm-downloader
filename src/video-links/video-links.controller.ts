import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VideoLinksService } from './video-links.service';
import { VideoLinkDto } from './dto/video-link.dto';
import { AlldebridService } from '../utils/alldebrid/alldebrid.service';

@Controller('video-links')
export class VideoLinksController {
  constructor(private readonly videoLinksService: VideoLinksService, private alldebridService: AlldebridService) {}

  @Post()
  getVideosFromLinks(@Body() videoLinkDto: VideoLinkDto[]) {
    return this.videoLinksService.getVideoFromLinks(videoLinkDto);
  }
}
