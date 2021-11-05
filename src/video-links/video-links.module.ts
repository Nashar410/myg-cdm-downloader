import { Module } from '@nestjs/common';
import { VideoLinksService } from './video-links.service';
import { VideoLinksController } from './video-links.controller';
import { VideoDownloaderService } from './video-downloader.service';
import { UtilsModule } from '../utils/utils/utils.module';
import { DownloaderService } from '../utils/downloader-manager/downloader.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [UtilsModule, HttpModule],
  controllers: [VideoLinksController],
  providers: [VideoLinksService, VideoDownloaderService, DownloaderService]
})
export class VideoLinksModule {}
