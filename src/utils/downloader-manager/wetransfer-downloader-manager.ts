import { DownloaderManager } from './downloader-manager.interface';
import { VideoLink } from '../../video-links/entities/video-link.entity';

export class WetransferDownloaderManager implements DownloaderManager{
  download(videoLinks: VideoLink[]): string[]  {
    return ['']
  
  }
}
