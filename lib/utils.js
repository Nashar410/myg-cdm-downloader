import dayjs from 'dayjs';
import {HEADERS, STRUTILS} from './constants.js';
import * as fs from 'fs';

export const getPromptVideo = (video) => `${dayjs(video[HEADERS.DATE]).format(STRUTILS.DATE_FORMAT)} \t|\t ${video[HEADERS.CHANSON]} \t|\t ${video[HEADERS.FIRSTNAME]} \t|\t ${video[HEADERS.LASTNAME]} \t|\t ${video[HEADERS.LINK]}\n`;
export const getCompletePromptVideo = (videos) => {
    let str = ``;
    videos.forEach(
        (video) => {
            str += getPromptVideo(video);
        }
    );
    return str;
};

export const appendToRapport = (fileName, data) => fs.appendFile(fileName, data + '\n\n', (err) => {
    if (err) console.error(err);
});

export const createFolder = (dir) => {
    try {
        if (!fs.existsSync(`../videos/${dir}`)) {
            fs.mkdirSync(`../videos/${dir}`);
            console.log(`\u2692 Le dossier "${dir} a été créé"`);
        }
    } catch (err) {
        console.error(err);
    }
};
