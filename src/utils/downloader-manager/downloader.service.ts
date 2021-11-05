import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { map } from 'rxjs';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DownloaderService {
  constructor(private httpService: HttpService, private configService: ConfigService) {
  }
  
  async download(videoLinks) {
    for(const link of videoLinks) {
      try {
        await this.downloadFile(link, this.configService.get('SAVE_PATH'));
      } catch(e) {
        return link;
      }
    }
  }
  
  private async downloadFile(fileUrl: string, downloadFolder: string) {
  
    let response = this.httpService.get(fileUrl, {
      responseType: 'stream',
    }).pipe(map(response => response.data));
    response.subscribe(async (value) => {
      const fileName = path.basename(fileUrl);
      const localFilePath = path.resolve(__dirname, downloadFolder, decodeURI(fileName));
      const w = value.pipe(fs.createWriteStream(localFilePath));
  
      w.on('finish', () => {
        console.log(localFilePath, 'Successfully downloaded file!');
      });
    });
  }
}
