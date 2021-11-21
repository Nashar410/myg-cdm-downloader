import {HEADERS, STRUTILS} from './constants.js';
import dayjs from 'dayjs';

export class CdmMapper {

    constructor(json) {
        // Contenu du sheet
        const sheet = json[Object.keys(json)[0]];

        // Liste de liens non youtube
        this.nonYt = [];

        // Liste de vidéo sans accord d'utilisation
        this.unwantedVideo = [];

        // Liste des vidéos exploitable pour ce mois-ci
        this.videoList = sheet[Object.keys(sheet)[0]].filter((item) => {

            // Triage par date
            const itemDate = dayjs(item[HEADERS.DATE], STRUTILS.DATE_FORMAT);
            const now = dayjs(Date.now(), STRUTILS.DATE_FORMAT);
            const diffYear = now.diff(itemDate, 'year');
            const diffMonth = now.diff(itemDate, 'month');
            if (diffYear === 0 && diffMonth === 1) {

                // Si l'utilisateur est d'accord
                if (item[HEADERS.AGREED].trim() === STRUTILS.OK) {

                    // Si ce n'est pas une vidéo youtube
                    if (item[HEADERS.LINK].indexOf('yout') <= -1) {
                        // On retient les liens non youtubes
                        this.nonYt.push(item);
                        return false;
                    }
                } else {
                    // Ajout aux non utilisable
                    this.unwantedVideo.push(item);
                    return false;
                }
                return true;
            }
        });

    }

    getCurrentVideo() {
        return this.videoList;
    }

    getUnwantedVideo() {
        return this.unwantedVideo;
    }

    getNonYtVideo() {
        return this.nonYt;
    }

}
