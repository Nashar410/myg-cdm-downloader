import { Injectable } from '@nestjs/common';
import { VideoLinkDto } from './dto/video-link.dto';
import { SupportedHost } from '../utils/enums/supported-host';
import { VideoLink } from './entities/video-link.entity';
import { HostsStr } from '../utils/enums/hosts-str';
import { DownloaderManager } from '../utils/downloader-manager/downloader-manager.interface';
import { YoutubeDownloaderManager } from '../utils/downloader-manager/youtube-downloader-manager';
import { VimeoDownloaderManager } from '../utils/downloader-manager/vimeo-downloader-manager';
import { WetransferDownloaderManager } from '../utils/downloader-manager/wetransfer-downloader-manager';
import { AlldebridService } from '../utils/alldebrid/alldebrid.service';
import { DownloaderService } from '../utils/downloader-manager/downloader.service';

@Injectable()
export class VideoDownloaderService {
  
  constructor(private allDebridService: AlldebridService, private downloaderService: DownloaderService) {
  }
  
  async downloadVideoFromVideoLinks(videoLinks: VideoLinkDto[]) {
    const queue = this.getSortedVideoQueue(videoLinks);
    return await this.launchQueue(queue);
  }
  
  /**
   * Prends une liste de vidéo en param et les tri par host
   * @param videoLinks
   * @private
   */
  private getSortedVideoQueue(videoLinks: VideoLinkDto[]): Map<SupportedHost, VideoLink[]> {
  
    ////////////////////// Préparation
    const formattedVideoList: Map<SupportedHost, VideoLink[]> = new Map();
    
    ////////////////////// Complétion
    // Préparation et tri
    for(const vid of videoLinks){
      const host = this.resolveHost(vid.link);
      const vidEntity = new VideoLink({
        host,
        ...vid
      })
      if(formattedVideoList.has(host)){
        formattedVideoList.get(host).push(vidEntity);
      } else {
        formattedVideoList.set(host, [vidEntity])
      }
    }
    return formattedVideoList
  }
  
  private resolveHost(link: string): SupportedHost {
    const hostsStr = Object.values(HostsStr);
    let flag = undefined;
    for(const hostName of hostsStr) {
      if(link.search(hostName as unknown as string) !== -1){
        flag = HostsStr[hostName] as SupportedHost;
        break;
      }
    }
    return flag;
  }
  
  /**
   * Lancement du téléchargement, renvoie une trace des fichiers
   * @param queue
   * @private
   */
  private async launchQueue(queue: Map<SupportedHost, VideoLink[]>){

    const trace: Map<SupportedHost, string[]> = new Map()
    const hosts = queue.keys();
    
    for(const host of hosts) {
      const manager: DownloaderManager = this.resolveDownloaderManager(host);
      const traces = await manager.download(queue.get(host));
      trace.set(host, traces);
    }
    
    return trace;
  }
  
  /**
   * Rend le bon manager de téléchargement selon l'host
   * @param host
   * @private
   */
  private resolveDownloaderManager(host: SupportedHost): DownloaderManager {
    switch(host) {
      case SupportedHost.YOUTUBE:
        return new YoutubeDownloaderManager(this.allDebridService, this.downloaderService);
      case SupportedHost.VIMEO:
        return new VimeoDownloaderManager(this.allDebridService, this.downloaderService);
      case SupportedHost.WETRANSFER:
        //return new WetransferDownloaderManager();
        console.error("Non implémenté");
        return;
    }
  }
}
