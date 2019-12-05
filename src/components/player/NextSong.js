import axios from 'axios';
import BackgroundTimer from 'react-native-background-timer';
import { STATE_TYPE } from '../containers/Player';
import { PLAYER_TYPES } from './PlayerController';

class NextSong {
	static get(stationID, id3Metadata) {
		const { pointerID } = id3Metadata.extra;
		const promise = new Promise((resolve, reject) => {
			axios.get(`https://api.vagalume.fm/v2/${stationID}/next?pointerID=${pointerID}&count=20`)
	        .then(response => {
				if (response && response.data && response.data.content && response.data.content instanceof Array && response.data.content.length) {
					resolve(response.data.content);
				} else {
					reject('bad_response');
				}
			});
		});
		return promise;
	}
}

export default NextSong;
