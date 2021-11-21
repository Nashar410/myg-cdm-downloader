import ytdl from 'ytdl-core';
import {EVENTS_KEY, HEADERS} from './constants.js';
import sanitize from 'sanitize-filename';
import childProcess from "child_process";
import * as readline from 'readline';
import ffmpeg from 'ffmpeg-static';
import {createFolder} from './utils.js';


export class CdmDownloader {
    constructor(videoList, eventEmitter) {
        /*************************************************
         *                 DECLARARTION                  *
         ************************************************/
        this.videoList = videoList;
        this.currentIndex = 0;
        this.eventEmitter = eventEmitter;
        this.abortedVideos = [];

        /*************************************************
         *                 FUNCTION                     *
         ************************************************/
        this.getVideoName = () => {
            const videoName = sanitize(
                `${
                    this.videoList[this.currentIndex][HEADERS.FIRSTNAME]}_${
                    this.videoList[this.currentIndex][HEADERS.LASTNAME]}_${
                    this.videoList[this.currentIndex][HEADERS.CHANSON]}
                `);
            return videoName.split(" ").join("_");
        };

        this.showProgress = (tracker, videoName) => {
            readline.cursorTo(process.stdout, 0);

            process.stdout.write(` \u2693 Téléchargement de ${videoName.slice(0, 20)}... ${this.currentIndex + 1}/${this.videoList.length + 1} \u2693\n`);

            process.stdout.write(` \u26a1 Lancé depuis : ${((Date.now() - tracker.start) / 1000 / 60).toFixed(2)} Minutes.`);
            process.stdout.write(`(at ${tracker.merged.fps} fps => ${tracker.merged.speed}).${' '.repeat(10)}\n`);

            readline.moveCursor(process.stdout, 0, 0);
        };

        /*************************************************
         *                 EVENT                         *
         ************************************************/
        this.eventEmitter.addListener(EVENTS_KEY.DOWNLOAD_START, () => this.downloadStart());
        this.eventEmitter.addListener(EVENTS_KEY.DOWNLOAD_OVER, () => this.downloadOver());
        this.eventEmitter.addListener(EVENTS_KEY.DOWNLOAD_ABORTED, (video) => this.downloadAborted(video));

        /*************************************************
         *                 LOGIC                         *
         ************************************************/
        this.downloadStart();
    }

    /**
     * Event lorsque qu'un téléchargement est terminé
     * @returns {Promise<void>}
     */
    async downloadOver() {
        // Passage à la vidéo suivante
        this.currentIndex++;
        // Si le l'emplacement actuelle dans la liste de vidéo ne dépasse pas sa taille
        if (this.currentIndex < this.videoList.length) {
            // Sleep arbitraire pour éviter un conflit de stream
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Ordre de démarage du prochain téléchargement
            this.eventEmitter.emit(EVENTS_KEY.DOWNLOAD_START);
        } else {
            // Nous sommes la fin de la liste, event de signalement de fin de téléchargement de la liste
            this.eventEmitter.emit(EVENTS_KEY.DOWNLOAD_ALL_OVER, (this.videoList.length) - (this.abortedVideos.length), this.videoList.length, this.abortedVideos);
        }
    }

    /**
     * Démarrage des téléchargements
     */
    async downloadStart() {

        // Préparation du nom de fichier
        let videoName = this.getVideoName();

        // Préparation pour le téléchargement
        const ref = this.videoList[this.currentIndex][HEADERS.LINK];
        const folderName = sanitize(this.videoList[this.currentIndex][HEADERS.CHANSON]).split(" ").join("_");
        try {
            // Vérification de la disponibilité du lien
            await ytdl.getBasicInfo(ref);

            // Tracker pour UI
            const tracker = {
                start: Date.now(),
                audio: {downloaded: 0, total: Infinity},
                video: {downloaded: 0, total: Infinity},
                merged: {frame: 0, speed: '0x', fps: 0},
            };


            // Récupération du meilleur son et de la meilleur image de la vidéo
            const audio = ytdl(ref, {quality: 'highestaudio'})
                .on('progress', (_, downloaded, total) => {
                    tracker.audio = {downloaded, total};
                });
            const video = ytdl(ref, {quality: 'highestvideo'})
                .on('progress', (_, downloaded, total) => {
                    tracker.video = {downloaded, total};
                });


            // Création du dossier
            createFolder(folderName);

            // Préparation de la bar de chargement
            let progressbarHandle = null;
            const progressbarInterval = 2000;

            // Logic de ffmpegProcess
            const ffmpegProcess = childProcess.spawn(ffmpeg, [
                // Remove ffmpeg's console spamming
                '-loglevel', '8', '-hide_banner',
                // Redirect/Enable progress messages
                '-progress', 'pipe:3',
                // Set inputs
                '-i', 'pipe:4',
                '-i', 'pipe:5',
                // Map audio & video from streams
                '-map', '0:a',
                '-map', '1:v',
                // Keep encoding
                '-c:v', 'copy',
                // Define output file
                `../videos/${folderName}/${videoName}.mp4`,
            ], {
                windowsHide: true,
                stdio: [
                    /* Standard: stdin, stdout, stderr */
                    'inherit', 'inherit', 'inherit',
                    /* Custom: pipe:3, pipe:4, pipe:5 */
                    'pipe', 'pipe', 'pipe',
                ],
            });
            ffmpegProcess.on('close', () => {
                process.stdout.write('\u26fe Fichier téléchargé');
                // Cleanup
                process.stdout.write('\n\n');
                clearInterval(progressbarHandle);
                this.eventEmitter.emit(EVENTS_KEY.DOWNLOAD_OVER);
            });
            // Link streams
            // FFmpeg creates the transformer streams and we just have to insert / read data
            ffmpegProcess.stdio[3].on('data', chunk => {
                // Start the progress bar
                if (!progressbarHandle) progressbarHandle = setInterval(() => this.showProgress(tracker, videoName), progressbarInterval);
                // Parse the param=value list returned by ffmpeg
                const lines = chunk.toString().trim().split('\n');
                const args = {};
                for (const l of lines) {
                    const [key, value] = l.split('=');
                    args[key.trim()] = value.trim();
                }
                tracker.merged = args;
            });
            audio.pipe(ffmpegProcess.stdio[4]);
            video.pipe(ffmpegProcess.stdio[5]);
        } catch (e) {

            // En cas d'un erreur pendant un téléchagement, prévenir l'user et le futur retour
            console.log(" \u2620 Un problème avec cette vidéo est survenue. \u2620 Lancement du prochain téléchargement...");
            this.eventEmitter.emit(EVENTS_KEY.DOWNLOAD_ABORTED, this.videoList[this.currentIndex]);
        }

    }

    /**
     * En cas de problème de téléchargement, stock la vidéo problématique pour le futur retour utilisateur
     * @param video
     */
    downloadAborted(video) {
        this.abortedVideos.push(video);
        this.eventEmitter.emit(EVENTS_KEY.DOWNLOAD_OVER);
    }
}
