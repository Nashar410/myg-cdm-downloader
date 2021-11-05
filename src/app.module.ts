import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { VideoLinksModule } from './video-links/video-links.module';
import { AlldebridService } from './utils/alldebrid/alldebrid.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { UtilsModule } from './utils/utils/utils.module';
import { DownloaderService } from './utils/downloader-manager/downloader.service';

@Module({
  imports: [
    VideoLinksModule,
    HttpModule.register({
      timeout: 5000,
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    UtilsModule],
  providers: [AppService, AlldebridService, DownloaderService],
})
export class AppModule {
}
