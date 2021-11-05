import { VideoLink } from '../../video-links/entities/video-link.entity';

export interface DownloaderManager {
  download(videoLinks: VideoLink[]): any;
}
