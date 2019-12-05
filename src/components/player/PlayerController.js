import { Platform } from 'react-native'
import BackgroundTimer from 'react-native-background-timer';
import { Player, STATE_TYPE } from '../containers/Player';
import { PlayerOffline } from '../containers/PlayerOffline';
import { RecordingManager } from '../containers/StreamRecorder';
import PlayingSong from './PlayingSong';
import Widget from '../../../react-native-widget';
import Chromecast from '../../../react-native-chromecast';
import PlayerHandler from '../../../react-native-player-handler';
import EventManager from '../containers/EventManager';

import axios from 'axios';

export const PLAYER_TYPES = {
	STREAM: 1,
	OFFLINE: 2,
	CHROMECAST: 3
}

// Variável de controle dos tipos dos players
const players = {};
players[PLAYER_TYPES.STREAM] = PlayerControllerStream;
players[PLAYER_TYPES.OFFLINE] = PlayerControllerOffline;
players[PLAYER_TYPES.CHROMECAST] = PlayerControllerChromecast;

export class PlayerController {
	constructor() {
		this.instance = null;
	}

	// Inicia o player
	initPlayer({ playerInfo, recordingFile, playerType, autoplay }) {
		this.instance && this.instance.destroy();

		// Retorna a instância do player
		if (playerType) {
			// Pede o foco para reprodução
			if (Platform.OS === 'android') PlayerHandler.startService();

			switch (playerType) {
				case PLAYER_TYPES.STREAM: this.instance = new PlayerControllerStream({ playerInfo, autoplay });
				break;
				case PLAYER_TYPES.OFFLINE: this.instance = new PlayerControllerOffline({ playerInfo, recordingFile, autoplay });
				break;
				case PLAYER_TYPES.CHROMECAST: this.instance = new PlayerControllerChromecast({ playerInfo, autoplay });
				break;
			}
		}

		return this.instance;
	}

	static updateNotification({ playingSong, playerInfo, playerState, isRecording, playerType }) {
		if (!this.instance || !playerInfo || (playerInfo && !playerInfo.id)) return;

		// Verificando se existe o timestamp da gravação dentro da variável
		if (isRecording) isRecording = true;

		const isPlaying = ((playerState === STATE_TYPE.RUNNING) || (playerState === STATE_TYPE.STARTING))
		? true
		: false;

		const artist = playingSong.title.id
		? playerState === STATE_TYPE.STARTING ? playerInfo.name : playingSong.artist.name
		: playerInfo.name;

		const info = playerState === STATE_TYPE.STARTING || (playerState === STATE_TYPE.RUNNING && !playingSong.title.id)  ? '' : playerInfo.name;

		let title = 'Estação';

		if (playingSong && playingSong.title.id) {
			title = playingSong.title.name;
		} else if (playerState === STATE_TYPE.STARTING) {
			title = 'Carregando...';
		} else if (playerState === STATE_TYPE.RUNNING) {
			title = 'Você está ouvindo';
		}

		const position = playingSong.title.id ? playingSong.position : 0;
		const duration = playingSong.title.id ? playingSong.duration : 0;

		const artwork = (playerInfo.img && playerInfo.img.featured) ? playerInfo.img.featured : null;
		const artistArtwork = (playingSong.img && playingSong.img.medium) ? playingSong.img.medium : null;

		if (Platform.OS === 'android') {
			try {
				Widget.buildWidget({ title, artist, info, artwork, duration, position, isPlaying });
				PlayerHandler.buildNotification({ title, artist, info, artwork, artistArtwork, duration, position, isPlaying, isRecording, playerType });
			} catch (error) { return; }
		} else {
			this.instance.setMetadata({
	            title,
	            artist,
	            album: info,
	            cover: artwork,
	            current: playingSong.position ? (playingSong.position / 1000) : 0,
	            duration: playingSong.duration ? (playingSong.duration / 1000) : 0
	        });
		}

	}
}

class PlayerControllerStream {
	constructor({ playerInfo, autoplay }) {
		if (!playerInfo || !playerInfo.stream || !playerInfo.id || !playerInfo.stream_ssl) return;

		// Herdando a função do PlayerController
		this.updateNotification = PlayerController.updateNotification.bind(this);

		// Guarda as informações da estação
		this.playerInfo = playerInfo;

		// Caso não exista player instanciado ainda
		if (this.instance) {
			this.instance.stop();
		} else {
			// Cria o novo player e guarda a instância
			this.instance = new Player();
		}

		if (playerInfo.stream_ssl.master) {
			// Altera a URL hls comum para a nova
			playerInfo.stream_ssl.hls = playerInfo.stream_ssl.master;
		}

		this.instance.setStreamings(playerInfo.stream_ssl);
		this.instance.prepare();

		if (autoplay) {
			// Inicia o player e reproduz
			this.instance.play();
		}
	}

	destroy() { this.instance && this.instance.destroy(); }

	stop() {
		if (this.instance) {
			this.instance.stop();
			EventManager.trackEvent({ action: 'stop', category: 'Player', params: { station_id: this.playerInfo.id, player_type: 'stream' } });
		}
	}

	play() {
		if (this.instance) {
			this.instance.play();
			EventManager.trackEvent({ action: 'play', category: 'Player', params: { station_id: this.playerInfo.id, player_type: 'stream' } });
		}
	}
}

class PlayerControllerOffline {
	constructor({ playerInfo, recordingFile, autoplay }) {
		if (!playerInfo || !playerInfo.id || !recordingFile) return;

		// Herdando a função do PlayerController
		this.updateNotification = PlayerController.updateNotification.bind(this);

		// Guarda as informações da estação
		this.playerInfo = playerInfo;

		// Guarda a gravação
		this.recordingFile = recordingFile;

		// Caso não exista player instanciado ainda
		if (this.instance) {
			this.instance.stop();
		} else {
			// Cria o novo player e guarda a instância
			this.instance = new PlayerOffline();
		}

		// Seta o source do player e prepara para iniciar
		this.instance.prepare();
		this.instance.setFileAudio(this.recordingFile.path);

		// Cortar a música no player
		try {
			this.instance.setTrimAudio(this.recordingFile.seekTo);
		} catch(e) {}

		if (autoplay) {
			// Inicia o player e reproduz
			this.instance.play();
		}
	}

	destroy() {
		this.instance && this.instance.destroy();
		this.recordingFile = null;
	}

	stop() {
		if (this.instance) {
			this.instance.stop();
			EventManager.trackEvent({ action: 'stop', category: 'Player', params: { station_id: this.playerInfo.id, player_type: 'offline' } });
		}
	}

	play() {
		if (this.instance) {
			this.instance.play();
			EventManager.trackEvent({ action: 'play', category: 'Player', params: { station_id: this.playerInfo.id, player_type: 'offline' } });
		}
	}
}

class PlayerControllerChromecast {
	constructor({ playerInfo, autoplay }) {
		this._controlTimeout;
		this._onStateChanged;

		if (!playerInfo || !playerInfo.stream || playerInfo.stream == null || !playerInfo.id) return;

		// Herdando a função do PlayerController
		this.updateNotification = PlayerController.updateNotification.bind(this);

		// Guarda as informações da estação
		this.playerInfo = playerInfo;

		this.instance = {
			onStateChanged: (callback) => {
				this._onStateChanged = callback;
			}
		};

		this.setOnStateChanged();

		const station = JSON.stringify(playerInfo);

		if (autoplay) {
			this._onStateChanged && this._onStateChanged(STATE_TYPE.STARTING);
		}

		Chromecast.sendMedia({ station, isPlaying: autoplay });
	}

	setOnStateChanged() {
		Chromecast.getPlayerState((res) => {
			const state = parseInt(res);
			this._onStateChanged && this._onStateChanged(state);
		});
	}

	destroy() { if (this.instance) this.instance = null; }

	play() {
		if (this.instance) {
			this._onStateChanged && this._onStateChanged(STATE_TYPE.RUNNING);
			BackgroundTimer.clearTimeout(this._controlTimeout);
			this._controlTimeout = BackgroundTimer.setTimeout(() => {
				EventManager.trackEvent({ action: 'play', category: 'Player', params: { station_id: this.playerInfo.id, player_type: 'chromecast' } });
				Chromecast.play();
			}, 200);
		}
	}

	stop() {
		if (this.instance) {
			this._onStateChanged && this._onStateChanged(STATE_TYPE.STOPPED);
			BackgroundTimer.clearTimeout(this._controlTimeout);
			this._controlTimeout = BackgroundTimer.setTimeout(() => {
				EventManager.trackEvent({ action: 'stop', category: 'Player', params: { station_id: this.playerInfo.id, player_type: 'chromecast' } });
				Chromecast.pause();
			}, 200);
		}
	}
}
