import { DownloaderManager } from './downloader-manager.interface';
import { VideoLink } from '../../video-links/entities/video-link.entity';
import { AlldebridService } from '../alldebrid/alldebrid.service';
import { DownloaderService } from './downloader.service';

export class YoutubeDownloaderManager implements DownloaderManager{
  
  constructor(private allDebridService: AlldebridService, private downloaderService: DownloaderService) {
  }
  
  async download(videoLinks: VideoLink[]){
  
    const {failedToDownload, downloadQueue} = await this.allDebridService.requestFiles(videoLinks);
    const result = await this.downloaderService.download(downloadQueue);
  
    return {
      failedToDownload,
      result
    }
  }
}
