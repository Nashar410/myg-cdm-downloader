import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VideoLink } from '../../video-links/entities/video-link.entity';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom, map } from 'rxjs';

@Injectable()
export class AlldebridService {
  
  constructor(private configService: ConfigService, private httpService: HttpService) {
  }
  
  get appName(){
    return this.configService.get('ALLDEBRID_APPNAME')
  }
  get apiKey(){
    return this.configService.get('ALLDEBIRD_APIKEY')
  }
  
  /**
   * Demande à alldebrid d'unlocker des liens
   * @param videoList
   */
  async requestFiles(videoList: VideoLink[]){
  
    const endpoint = `https://api.alldebrid.com/v4/link/unlock?agent=${this.appName}&apikey=${this.apiKey}&link=`;
    const videoUnlocked = [];
    const failedToUnlocked = []
    let response;
    for(const vid of videoList) {
  
      response = await lastValueFrom(
      this.httpService.get(endpoint + encodeURIComponent(vid.link)).pipe(
        map(resp => {
          if(resp.data.status === "success"){
  
            videoUnlocked.push(resp.data);
          } else {
            failedToUnlocked.push(vid);
          }
        } )
      ));
  }
    return await this.downloadUnlockedVideo(videoUnlocked);
  }
  
  /**
   * Depuis la liste des vidéos unlock, tri les erreur des succèss et génére les liens adéquats
   * @param videoUnlock
   * @private
   */
  private async downloadUnlockedVideo(videoUnlock) {
  
    const failedToDownload = [];
    const downloadQueue = [];
    for(const unlocked of videoUnlock) {
  
      if(unlocked.status !== "success") {
        failedToDownload.push(unlocked);
        continue;
      }
      if(unlocked.data.link){
        downloadQueue.push(unlocked.data.link)
        continue;
      }
      if(unlocked.data.streams?.length) {
        const unCheckedlink = await this.generateDownloadLink(unlocked.data);
        if(typeof unCheckedlink === 'string') {
          downloadQueue.push(unCheckedlink)
        } else {
          failedToDownload.push(unlocked);
        }
        
      }
    }
    return {
      failedToDownload,
      downloadQueue
    }
  }
  
  /**
   * Génére un lien de dl d'un streaming
   * @private
   * @param video
   */
  private async generateDownloadLink(video: any) {
    
    // Sélectionner la vidéo à récupérer
    video.streams.sort((stream1, stream2) => stream1.filesize - stream2.filesize )
    const largerFile =  video.streams.pop();
    const endpoint = `https://api.alldebrid.com/v4/link/streaming?agent=${this.appName}&apikey=${this.apiKey}&id=${video.id}&stream=${encodeURIComponent(largerFile.id)}`
    let firstResponse = undefined;
    let failed = false;
    // Faire la requête
    await lastValueFrom(
      this.httpService.get(endpoint).pipe(
        map(resp => {
          failed = false
  
          if(resp.data.status === 'success') {
            firstResponse = resp.data.data;
          } else {
            failed = true
          }
        } )
      ));
    if(failed) {
      return video;
    }
  
    // Vérifier si le lien est directement dispo ou delayed
    if(firstResponse?.link){
      return firstResponse?.link
    }
  
    if(firstResponse?.delayed){
      // requêter alldebrid
      return await this.getDelayedLink(firstResponse, video);
    }
    
  }
  
  private async getDelayedLink(delayed: any, video: any) {
    const endpoint = `https://api.alldebrid.com/v4/link/delayed?agent=${this.appName}&apikey=${this.apiKey}&id=${encodeURIComponent(delayed.delayed)}`;
    let finalResponse = '';
    await lastValueFrom(
      this.httpService.get(endpoint).pipe(
        map(async (resp) => {
          switch(resp.data.data.status) {
            case 0:
              await new Promise(resolve => setTimeout(resolve, 6500));
              finalResponse = await this.getDelayedLink(delayed, video);
              break;
            case 2:
              finalResponse = resp.data.data.link;
              break;
            default:
              finalResponse = video;
              break;
          }
        } )
      ));
    return finalResponse
  }
}
