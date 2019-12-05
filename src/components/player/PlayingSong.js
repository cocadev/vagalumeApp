import axios from 'axios';
import BackgroundTimer from 'react-native-background-timer';
import { STATE_TYPE } from '../containers/Player';
import { PLAYER_TYPES } from './PlayerController';

class PlayingSong {
    constructor(player, status, playerInfo, setPlayingSong, playerType, currentTimeOffline) {
        this.playingSongTimeout = null;
        this.listSongsOffline = false;

        this.player = player;
        this.status = status;
        this.playerInfo = playerInfo;
        this.setPlayingSong = setPlayingSong;
        this.playerType = playerType;
        this.currentTimeOffline = currentTimeOffline;

        this.start = this.start;
        this.startOffline = this.startOffline;
        this.stop = this.stop;
        this.set = this.set;

		this._nextSongList = [];
    }

    set({ player, status, playerInfo, setPlayingSong, playerType, currentTimeOffline }) {
        this.player = player;
        this.status = status;
        this.playerInfo = playerInfo;
        this.setPlayingSong = setPlayingSong;
        this.playerType = playerType;
        this.currentTimeOffline = currentTimeOffline;
    }

	next() {
		const now = Date.now();
		const playingSongIndex = this._nextSongList.findIndex((song) => song.tsStart < now && song.tsEnd > now);

		if (playingSongIndex > -1) {
			const playingSong = this._nextSongList.splice(playingSongIndex, 1)[0];
			const tsDuration = new Date(playingSong.tsEnd - playingSong.tsStart);
			const tsPosition = new Date(tsDuration - (playingSong.tsEnd - now));

			playingSong.duration = tsDuration.getTime();
			playingSong.position = tsPosition.getTime();

			if (this.playerType == PLAYER_TYPES.STREAM) this.setPlayingSong(playingSong, this._nextSongList);

			time = playingSong.tsEnd - now;
			this.playingSongTimeout = BackgroundTimer.setTimeout(this.next.bind(this), time);

			if (!this._nextSongList.length) this.start();
		} else {
			this.start();
		}
	}

    start() {
        this.stop();
        if (this.status === STATE_TYPE.STOPPED || !this.playerInfo.id) {
            return;
        }

        let time = 2000;
        let delay = 0;

        try {
            if (this.player.getDelay()){
                delay = this.player.getDelay();
            }
        } catch(e) { delay = 0; }

		axios.get(`https://api.vagalume.fm/v2/${this.playerInfo.id}/next?delay=${delay}&count=20`)
        .then(response => {
            if (response && response.data && response.data.content && response.data.content instanceof Array && response.data.content.length) {
				const now = Date.now();
				const nextSongList = response.data.content.map((song) => { return {...song, tsStart: song.tsStart * 1000, tsEnd: song.tsEnd * 1000} });
				const playingSongIndex = nextSongList.findIndex((song) => song.tsStart < now && song.tsEnd > now);

				this._nextSongList = nextSongList;

				if (playingSongIndex > -1) {
					const playingSong = nextSongList.splice(playingSongIndex, 1)[0];
					const tsDuration = new Date(playingSong.tsEnd - playingSong.tsStart);
					const tsPosition = new Date(tsDuration - (playingSong.tsEnd - now));

					playingSong.duration = tsDuration.getTime();
					playingSong.position = tsPosition.getTime();

					if (this.playerType == PLAYER_TYPES.STREAM) this.setPlayingSong(playingSong, nextSongList);

					time = playingSong.tsEnd - now;
					this.playingSongTimeout = BackgroundTimer.setTimeout(this.next.bind(this), time);
					return;
				}
            }
			this.playingSongTimeout = BackgroundTimer.setTimeout(this.start.bind(this), time);
        })
        .catch(error => {
            this.playingSongTimeout = BackgroundTimer.setTimeout(this.start.bind(this), time);
        });
    }

    startOffline(recording) {
		const recordingSongs = recording.songs;

		this.stop();

		if (this.status === STATE_TYPE.STOPPED || !this.playerInfo.id) {
            return;
        }

        let time = 2000;

        if (recording && recordingSongs && recordingSongs instanceof Array && recordingSongs.length) {
            let song = recordingSongs.find(obj => this.currentTimeOffline >= obj.recording.start && this.currentTimeOffline < obj.recording.end)
            if (song && song.recording.end != this.currentTimeOffline) {
                time = this.currentTimeOffline == 1 ? (song.recording.end * 1000) : ((song.recording.end - this.currentTimeOffline) * 1000);

                song.position = this.currentTimeOffline * 1000;
                song.duration = recording.time * 1000;
                if (this.playerType == PLAYER_TYPES.OFFLINE) this.setPlayingSong(song);

                this.currentTimeOffline = song.recording.end;
            }
        }
        this.playingSongTimeout = BackgroundTimer.setTimeout(this.startOffline.bind(this, recording, recordingSongs), time);
    }

    stop() {
        BackgroundTimer.clearTimeout(this.playingSongTimeout);
    }
}

export default PlayingSong;
