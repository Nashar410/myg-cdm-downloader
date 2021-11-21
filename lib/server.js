import * as data from '../cdm.json';
import {CdmMapper} from './cdm-mapper.js';
import {CdmDownloader} from './cdm-downloader.js';
import express from "express";
import {EVENTS_KEY,  STRUTILS} from './constants.js';
import {EventEmitter} from 'events';
import dayjs from 'dayjs';
import {appendToRapport, getCompletePromptVideo} from './utils.js';

/*************************************************
 *                 CONFIGURATION                  *
 ************************************************/
const app = express();

/*************************************************
 *                 Server                        *
 ************************************************/
app.listen(3000, function () {

    // Récupération des données
    const cdmMapper = new CdmMapper(data);
    const currentVideo = cdmMapper.getCurrentVideo();

    // Mise en place de l'event emitter
    const eventEmitter = new EventEmitter();

    // Ecoute l'event de fin de liste pour générer le rapport
    eventEmitter.addListener(EVENTS_KEY.DOWNLOAD_ALL_OVER, (videoCount, totalVideo, abortedVideos) => {

        // Préparation du rapport
        const fileName = `../videos/${dayjs(new Date()).format(STRUTILS.DATE_FORMAT_FILE)}_rapport.txt`;
        const intro = `Tous les téléchargements ont été effectuées\n${videoCount} vidéos youtube téléchargés sur un total de ${totalVideo} vidéos youtube\nBon montage à toi !\n`;
        appendToRapport(fileName, intro);

        // Récupération des différentes champs potentiellement en erreur
        const nonYtVideo = cdmMapper.getNonYtVideo();
        const unwantedVideo = cdmMapper.getUnwantedVideo();

        // Erreur vidéo non utilisable
        if (unwantedVideo.length !== 0) {
            appendToRapport(fileName,
                `Les personnes suivantes ont indiquées ne pas vouloir rendre leur vidéo utilisable :\n${getCompletePromptVideo(unwantedVideo)}`);
        }

        // Erreur vidéo non youtube
        if (nonYtVideo.length !== 0) {
            appendToRapport(fileName,
                `Les liens suivants ne sont pas des liens youtubes :\n${getCompletePromptVideo(nonYtVideo)}`);
        }

        // Erreur de téléchargement de vidéo youtube
        if (abortedVideos.length !== 0) {
            appendToRapport(fileName,
                `Les liens suivants ont rencontrés un problème lors du téléchargement :\n${getCompletePromptVideo(abortedVideos)}`);
        }

        process.exit(1)

    });

    // Lancement de la procédure de téléchargement
    new CdmDownloader(currentVideo, eventEmitter);

});
