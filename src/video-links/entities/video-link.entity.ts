import { SupportedHost } from '../../utils/enums/supported-host';

export class VideoLink {
  host: SupportedHost;
  link: string;
  options: Object;
  
  
  constructor(params: { host: SupportedHost, link: string, options: Object }) {
    this.host = params.host;
    this.link = params.link;
    this.options = params.options || undefined;
  }
}
