'use strict'

import { AsyncStorage, NetInfo, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import BackgroundTimer from 'react-native-background-timer';
import axios from 'axios';
import EventManager from './EventManager';

const RECORDING_DIRECTORY_PATH = Platform.select({
    ios: () => `${RNFS.DocumentDirectoryPath}/recording`,
    android: () => `${RNFS.ExternalDirectoryPath}/recording`
})();

const RECORDING_TEMP_DIRECTORY_PATH = Platform.select({
    ios: () => `${RNFS.DocumentDirectoryPath}/recording/temp`,
    android: () => `${RNFS.ExternalDirectoryPath}/recording/temp`
})();

const FILE_EXTENSION = Platform.select({
    ios: () => `aac`,
    android: () => `ts`
})();

const M3U8_ITEM_POSITION = Platform.select({
    ios: () => 3,
    android: () => 1
})();

const TS_MATCHER = (string = '') => Platform.select({
    ios: () => string.match(/[0-9.-]+.aac/gm),
    android: () => string.match(/[0-9.-]+.ts/gm)
})();

const EXTENSION = Object.freeze({
	TS: '.ts',
	AAC: '.aac',
	M3U8: '.m3u8'
});

const ERROR_RECORDER = Object.freeze({
	NOT_AVAILABLE: 1,
	FILE_MANAGER: 2,
	SPACE_DEVICE: 3,
	SERVER: 4,
	MINIMUM_TIME: 5,
	CONNECTION: 6
});

const STATUS_RECORDER = Object.freeze({
	RECORDING_START: 'RECORDING_START',
	RECORDING_STOP: 'RECORDING_STOP',
	RECORDING_ERROR: 'RECORDING_ERROR',
	RECORDING_SUCCESS: 'RECORDING_SUCCESS'
});

class StreamRecorder {

	constructor(playerInfo, statusCallback) {

		this._playerInfo			= playerInfo;
		this._appendFileName		= null		 	// Nome do arquivo temporario
		this._countRetryConnection 	= 25; 			// 25 tentativas
		this._minimumStorage 		= 2097152; 		// 2 megabytes
		this._minimumTimeout 		= 30000; 		// 30 segundos
		this._stationID 			= null
		this._isNewServer 			= false;
		this._isAvailable 			= false; 		// Verificador da pasta das estações
		this._enabled 				= false;
		this._segmentName 			= false;
		this._firstTS 				= false; 		// Verifica se o ts da thread é o primeiro da lista
		this._pendingDownloadID		= null; 		// ID do download do TS caso tenha que cancelar
		this._songName 				= null; 		// Nome do arquivo da música (contém o ID da estação com o timestamp)
		this._lastTS 				= null; 		// Guarda sempre o nome do último ts
		this._downloadTime 			= null; 		// Utilizado para fazer a diferença do tempo de download
		this._requestTimeout 		= null;
		this._firstPosition 		= 0; 			// Posição do primeiro corte em segundost
		this._timeoutRetryStop 		= null; 		// Timeout para o retry do stop
		this._recordingInitTime 	= null;
		this._songList 				= [];
		this._countStop 			= 0;
		this._countM3U8 			= 0;
		this._countTS 				= 0;
		this._noConnection 			= false;
		this._statusCallback 		= null;
		this._finishThread			= null; 	// Thread que contem a função que finaliza a gravação

		this._recordID = 0;

		this._currentSegment 		= null; 	// Qual segmento baixar caso não tenha informação da música

		this._initialize({ playerInfo, statusCallback });
	}

	async _initialize({ playerInfo, statusCallback }) {

		this._stationID 	 = playerInfo.id;
		this._statusCallback = statusCallback;

		this._registerNetInfoListener();
		this._registerStatusCallback({ statusCallback });

		this._prepareDir();
		this._deleteUnavailableSongs();
	}

	_registerNetInfoListener() {
		NetInfo.isConnected.fetch().then(isConnected => {
			this._noConnection = isConnected ? false : true;
		});

		NetInfo.addEventListener(
			'connectionChange',
			this._handleConnectionInfoChange.bind(this)
		);
	}

	_registerStatusCallback({ statusCallback }) {
		this._statusCallback = statusCallback;
	}

	_handleConnectionInfoChange(connectionInfo) {
		this._noConnection = connectionInfo === 'NONE' ? true : false;
	}

	async _prepareDir() {
		try {
			const isCreated = await RNFS.exists(RECORDING_TEMP_DIRECTORY_PATH);

			if (isCreated) {

				await RNFS.unlink(RECORDING_TEMP_DIRECTORY_PATH);
			}

			this._isAvailable = true;
			await RNFS.mkdir(RECORDING_TEMP_DIRECTORY_PATH);

		} catch (err) {
			EventManager.trackEvent({ action: 'recording', category: 'Player', params: { event_type: 'error' } });
			this._isAvailable = false;
		}
	}

	async _deleteUnavailableSongs() {
		try {
			const recordings = await RecordingManager.listRecordings();
			let songRecordings = await AsyncStorage.getItem('songRecordings');
			const hasSongRecordings = songRecordings != null;
			const isRecordingInstanceOfArray = recordings && Array.isArray(recordings);
			const hasItems = isRecordingInstanceOfArray && recordings.length > 0;



			if (hasSongRecordings && isRecordingInstanceOfArray && hasItems) {
				songRecordings = JSON.parse(songRecordings);

				for (const id in songRecordings) {
					const file = recordings.find(item => item.name.indexOf(id) > -1);
					const isValidName = id.match(/(([^_]+)_[\w]+)/) !== null;

					if (file && isValidName && !songRecordings[id].isComplete) {
						songRecordings[id].isComplete = true;
					} else if (file && !isValidName) {
						await RNFS.unlink(`${RECORDING_DIRECTORY_PATH}/${id}${EXTENSION.AAC}`);
						delete songRecordings[id];

						const pos = recordings.findIndex(obj => obj.name.indexOf(id) > -1);
						if (typeof pos === 'number' && pos > -1) recordings.splice(pos, 1);
					}
				}

				const ids = Object.keys(songRecordings);
				for (var i = 0; i < recordings.length; i++) {
					const recording = recordings[i];
					const matches = recording.name.match(/(([^_]+)_[\w]+)/);

					if (matches && matches.length) {
						const recordingID = matches[1];
						const isValid = ids.find(id => id == recordingID);

						if (!isValid) {
							await RNFS.unlink(recording.path);
						}
					} else if (recording.path) {
						await RNFS.unlink(recording.path);
					}
				}

				AsyncStorage.setItem('songRecordings', JSON.stringify(songRecordings));
			}
		} catch (err) {
			// TODO: (1) ENVIAR EVENTO DE ERRO
		}
	}

	async _hasDiskSpace() {
		let hasSpace = false;

		try {
			const deviceInfo = await RNFS.getFSInfo();
			const { totalSpace, freeSpace } = deviceInfo;
			if (freeSpace > this._minimumStorage) {
				hasSpace = true;
			}
		} catch (err) {
		}

		return hasSpace;
	}

	_getMsgError({ type }) {
		let ret;
		switch(type) {
			case ERROR_RECORDER.FILE_MANAGER:
				ret = "Desculpe, houve um problema para salvar a gravação. Por favor, tente novamente.";
			break;
			case ERROR_RECORDER.NOT_AVAILABLE:
				ret = "Desculpe, houve um problema para iniciar a gravação. Por favor, tente novamente.";
			break;
			case ERROR_RECORDER.SPACE_DEVICE:
				ret = "Desculpe, sua gravação foi interrompida por falta de espaço.";
			break;
			case ERROR_RECORDER.MINIMUM_TIME:
				ret = "Desculpe, não conseguimos concluir sua gravação. Por favor, tente novamente.";
			break;
			case ERROR_RECORDER.CONNECTION:
				ret = "Desculpe, sua gravação foi interrompida por motivo de conexão. Por favor, verifque sua conexão.";
			break;
			case ERROR_RECORDER.SERVER:
			default:
				ret = "Desculpe, houve um problema inesperado com a sua gravação. Por favor, tente novamente.";
		}
		return ret;
	}

	_setError({ type, status }, exception) {
		this._clearAuxVars();
		this._errorRecorder = true;
		const msgError = this._getMsgError(type);
		this._statusCallback(STATUS_RECORDER.RECORDING_ERROR, msgError);
		EventManager.trackEvent({ action: 'recording', category: 'Player', params: { event_type: 'error' } });
	}

	setSong(song) {
		const hasInitialTime = this._recordingInitTime !== null ||
					this._recordingInitTime !== undefined || this._recordingInitTime !== NaN;

		if (song && hasInitialTime) {
			const t1 = new Date(this._recordingInitTime);
			const t2 = new Date();
			const diff = Math.abs(((t1.getTime() - t2.getTime()) / 1000));

			const isSongListInstanceOfArray = this._songList && this._songList.length && Array.isArray(this._songList);

			if (isSongListInstanceOfArray) {
				const lastIndex = this._songList.length - 1;
				this._songList[lastIndex].recording.end = diff;
			}

			song.recording = { start: diff, end: null };
			this._songList.push(song);
		}
	}

	async _loopRecorder() {
		try {
			const hasSpace = await this._hasDiskSpace(); // Caso não tenha espaço suficiente, mostra a mensagem de erro
			if (!hasSpace) {
				if (this._firstTS) {  // Caso tenha sido o primeiro TS, mostra a mensagem
					if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.SPACE_DEVICE, status: 2 }, this._firstTS);
				} else { this.stop(this._minimumTimeout / 1000); } // Para a gravação passando o tempo máximo do ts que adquiriu (45 segundos)
				return;
			}

			const url = `https://stream.vagalume.fm/hls/${this._stationID}/${FILE_EXTENSION}.m3u8`;

			this._downloadM3U8(url);
		} catch (err) {
			if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.SPACE_DEVICE, status: 2 }, 96);
		}
	}

	async _downloadM3U8(url) {
		if (!url || typeof url !== 'string') {
			if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.NOT_AVAILABLE, status: 40 }, url);
			this._onM3U8Receive({ m3u8: null });
			return;
		}

		try {
			const response = await axios.get(url);
			this._onM3U8Receive({ m3u8: response });
		} catch (err) {
			if ((this._countM3U8 >= this._countRetryConnection) && this._noConnection) {
				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.CONNECTION, status: 30 }, this._countM3U8);
				this._onM3U8Receive({ m3u8: null });
				return;
			} else {
				BackgroundTimer.setTimeout(() => {
					this._countM3U8++;
					this._downloadM3U8(url);
				}, 1000);
			}
		}
	}

	async _onM3U8Receive({ m3u8 }) {
		if (!m3u8 || !m3u8.data) {
			if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.CONNECTION, status: 30 }, this._countM3U8);
		}

		m3u8 = m3u8.data;

		this._countM3U8 = 0; // Limpar o count do m3u8
		const tsList = TS_MATCHER(m3u8);
		const isTsListArray = tsList && Array.isArray(tsList);
		const hasThreeItems = isTsListArray && tsList.length > M3U8_ITEM_POSITION;

		if (isTsListArray && hasThreeItems) {
			let ts = Platform.OS === 'android' ?
				tsList[M3U8_ITEM_POSITION] :
				tsList[tsList.length - M3U8_ITEM_POSITION]; // Pega o ts de acordo com a plataforma ( ios 3 antes do live, android 8 antes do live)

			if (this._songList[0] && this._songList[0].segment) {
				const fileName = this._songList[0].segment.match(/[^\.]+-/g)[0];
				const file = tsList.find((f, k) => f.indexOf(fileName) > -1);
				if (this._currentSegment !== null) ts = this._currentSegment;

				if (file) {
					ts = file;
				}
			}

			let tsURL = `https://stream.vagalume.fm/hls/${this._stationID}/${ts}`; // Cria a URL para baixar

			if (this._lastTS) { // Caso já tenha pego o último ts, pega o próximo dele na lista
				const tsPos = tsList.findIndex(obj => obj === this._lastTS);
				
				if(tsList && tsList.length > 0){ //Checkar caso a lista não está vazia, para poder evitar de dar erro de null quando houver ts.lenght
					if (tsPos !== -1 && tsPos < tsList.length - 1) {
						ts = tsList[tsPos + 1];
						tsURL = `https://stream.vagalume.fm/hls/${this._stationID}/${ts}`;
					}
				}
			} else {
				this._firstTS = true; // Esse ts foi o primeiro a ser baixado
			}

			this._lastTS = ts; // Guarda o nome do último ts

			try {
				const fileExists = await RNFS.exists(`${RECORDING_DIRECTORY_PATH}/${this._songName}${EXTENSION.AAC}`);

				if (!fileExists && fileExists !== null) {
					await RNFS.writeFile(`${RECORDING_DIRECTORY_PATH}/${this._songName}${EXTENSION.AAC}`, '', 'base64');
				}

				this._downloadTS({ tsName: ts, fromUrl: tsURL }); // Começa a baixar o ts
			} catch (err) {
				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER, status: 7 }, err);
			}
		} else {
			if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.SERVER, status: 8 }, tsList);
		}
	}

	async _downloadTS({ tsName, fromUrl }) {

		this._downloadTime = Date.now(); // Guarda o tempo antes do donwload para fazer o diff depois
		this._segmentName = tsName;
		const download = RNFS.downloadFile({
			fromUrl,
			toFile: `${RECORDING_TEMP_DIRECTORY_PATH}/${tsName}`,
			background: true
		});

		this._pendingDownloadID = download.jobId;
		const downloadPromise = download.promise;

		try {
			const response = await downloadPromise;
			const httpResponseSuccess = 200;

			if (response.statusCode === httpResponseSuccess) {
				this._countTS = 0; // Limpar o count do TS
				this._onTSReceive({ tsName });

			} else if ((this._countTS >= this._countRetryConnection) && this._noConnection) {

				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.CONNECTION, status: 30}, this._countTS);

			} else if (this._noConnection) {
				setTimeout(() => {
					this._countTS++;
					this._downloadTS({ tsName, fromUrl });
				}, 1000);

			} else if (this._firstTS) { // Caso seja o primeiro ts
				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.MINIMUM_TIME, status: 52 }, this._firstTS);

			} else {
				this._appendFiles(); // Append no último ts baixado
			}
		} catch (err) {
			if (err && typeof err == "string" && err.indexOf('aborted') == -1) {
				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER, status: 14 }, err);
			}
		}
	}

	/*
	 *
	 *
	 */
	async _onTSReceive({ tsName }) {
		try {
			if (this._firstTS) {
				await RNFS.moveFile(`${RECORDING_TEMP_DIRECTORY_PATH}/${tsName}`,
					`${RECORDING_TEMP_DIRECTORY_PATH}/${this._appendFileName}${EXTENSION.AAC}`);

				if (this._segmentName) {
					this._minimumTimeout = parseFloat(this._segmentName.match(/[0-9]+\.[0-9]+/g)[0]) * 1000;
					this._segmentName = false;
				}

				const diffTime = Math.abs((this._downloadTime - Date.now() / 1000)); // Faz a verificação do tempo que irá iniciar o próximo download
				if (diffTime * 1000 < this._minimumTimeout && this._enabled) {
					const timeout = ((this._minimumTimeout - (diffTime * 1000)) - (this._firstPosition * 1000));
					this._requestTimeout = BackgroundTimer.setTimeout(() => {
						if (this._enabled) {
							this._firstTS = false;
							this._loopRecorder();
						}
					}, timeout);
				} else if (this._enabled) {
					this._firstTS = false;
					this._loopRecorder();
				}

				this._pendingDownloadID = null; // Libera essa variável para casos de stop no momento do download de um ts
			} else {
				this._appendFiles(); // Append no último ts baixado
			}
		} catch (err) {
			// TODO: (2) TRATAR ERRO E ENVIAR EVENTO
		}
	}

	/*
	 * Insere o ts baixado no arquivo de gravação
	 * Fluxo:
	 * 1º Faz a leitura do ts e pega seu conteúdo -> 2º Insere no arquivo de gravação ->
	 * 3º Persiste as informações do arquivo em um JSON(AsyncStorage) ->
	 * 4º Remove o ts que foi adicionado -> 5º Renomeia o último ts para ser adicionado depois ->
	 * 6º Libera o @this._pendingDownloadID para casos de stop no momento do download de um ts ->
	 * 7º Roda o @method _loopRecorder novamente
	 */
	async _appendFiles() {
		try {
			const tsName = `${this._appendFileName}${EXTENSION.AAC}`;
			const fileExists = await RNFS.exists(`${RECORDING_TEMP_DIRECTORY_PATH}/${tsName}`);


			if (!fileExists) {
				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER, status: 25 }, fileExists);
				return;
			}

			const tsFile = await RNFS.readFile(`${RECORDING_TEMP_DIRECTORY_PATH}/${tsName}`, 'base64');
			if (!tsFile) {
				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER, status: 26 }, tsFile);
				return;
			}

			await RNFS.appendFile(`${RECORDING_DIRECTORY_PATH}/${this._songName}${EXTENSION.AAC}`, tsFile, 'base64');

			this._storeSong({
				isComplete: false,
				recordingInitTime: this._recordingInitTime,
				songList: this._songList,
				firstPosition: this._firstPosition,
				songName: this._songName
			});

			await RNFS.unlink(`${RECORDING_TEMP_DIRECTORY_PATH}/${tsName}`);

			await RNFS.moveFile(`${RECORDING_TEMP_DIRECTORY_PATH}/${this._lastTS}`, `${RECORDING_TEMP_DIRECTORY_PATH}/${tsName}`);

			this._pendingDownloadID = null;
			const now = Date.now();
			const diffTime = Math.abs((this._downloadTime - now) / 1000);
			if (this._segmentName) {
				this._minimumTimeout = parseFloat(this._segmentName.match(/[0-9]+\.[0-9]+/g)[0]) * 1000;
				this._segmentName = false;
			}

			if (diffTime * 1000 < this._minimumTimeout && this._enabled) {
				const timeout = this._minimumTimeout - (diffTime * 1000);


				this._requestTimeout = BackgroundTimer.setTimeout(() => {
					if (this._enabled) this._loopRecorder();
				}, timeout);

			} else if (this._enabled) {

				this._loopRecorder();
			} else {
				// TODO: (5) TRATAR POSSIVEL ERRO AQUI
			}


		} catch (err) {
			if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER, status: 22 }, err);
		}
	}

	/*
	 * Inicia a thread que irá baixar os ts e fazer a gravação do streaming
	 */
	start(position, firstSong, segment) {
		if (!this._isAvailable) {
			if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.NOT_AVAILABLE, status: 1 }, this._isAvailable); // Caso não esteja disponível para gravação, retorna erro
			this._prepareDir(); // Tenta preparar o ambiente
			return;
		}

		EventManager.trackEvent({ action: 'recording', category: 'Player', params: { event_type: 'start' } });

		this._errorRecorder 	= false; 	 	// Iniciando a variável de controle para errors
		this._countStop 		= 0; 	 	 	// Variável de controle no STOP
		this._firstPosition 	= position;  	// Guarda a primeira posição de corte do ts
		this._recordingInitTime = Date.now(); 	// Tempo inicio de quando começou a gravar de fato
		this._appendFileName	= `append___${this._recordID}`;	// Nome do arquivo temporario
		this._songList 			= [];			// Limpa todas as variáveis de ajuda
		this._enabled 			= true; 		// Dá a instrução que pode iniciar a thread
		this._songName			= null;
		this._currentSegment	= segment;		// Coloca o segmento a ser baixado, caso não tenha música

		// Cria o nome da gravação com o ID e o timestamp
		if (!this._songName) {
			this._songName = `${this._stationID}_${Date.now()}`;
			if (firstSong) this.setSong(firstSong);
		}

		this._statusCallback(STATUS_RECORDER.RECORDING_START);
		this._loopRecorder();
	}

	stop(position) {
		if (!this._enabled) return;
		this._statusCallback(STATUS_RECORDER.RECORDING_STOP);

		BackgroundTimer.clearTimeout(this._requestTimeout); 	// Remove o timeout da thread de download
		BackgroundTimer.clearTimeout(this._timeoutRetryStop); 	// Caso esteja baixando algum ts, para imediatamente
		this._enabled = false;


		this._finalizeRecorder({
			position,
			songName: this._songName,
			tempFileName: this._appendFileName,
			pendingDownloadID: this._pendingDownloadID,
			countStop: this._countStop,
			songList: this._songList,
			recordingInitTime: this._recordingInitTime,
			firstPosition: this._firstPosition
		});

		this._clearAuxVars();
	}

	async _finalizeRecorder({ position, songName, tempFileName,
		pendingDownloadID, countStop, songList, recordingInitTime, firstPosition }) {

		if (pendingDownloadID) { // Verificação para finalizar os ts
			await RNFS.stopDownload(pendingDownloadID);
		}

		try {
			const fileExists = await RNFS.exists(`${RECORDING_TEMP_DIRECTORY_PATH}/${tempFileName}${EXTENSION.AAC}`);
			if (!fileExists) {
				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER, status: 17 }, fileExists);
				return;
			}

			const file = await RNFS.readFile(`${RECORDING_TEMP_DIRECTORY_PATH}/${tempFileName}${EXTENSION.AAC}`, 'base64');
			if (!file) {
				if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER,status: 55 }, file);
				return;
			}

			const success = await RNFS.appendFile(`${RECORDING_DIRECTORY_PATH}/${songName}${EXTENSION.AAC}`, file, 'base64');

			this._storeSong({
				isComplete: true,
				recordingInitTime,
				songList,
				firstPosition,
				songName
			});

			RNFS.unlink(`${RECORDING_TEMP_DIRECTORY_PATH}/${tempFileName}${EXTENSION.AAC}`);
		} catch (err) {
			if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER, status: 8059 }, err);
		}
	}

	_storeSong({ isComplete, recordingInitTime, songList,
		firstPosition, songName }) {
		const initialTime = new Date(recordingInitTime);
		const currentTime = new Date();
		const diff = Math.abs(((initialTime.getTime() - currentTime.getTime()) / 1000));

		const hasInitialTime = recordingInitTime !== null ||
				recordingInitTime !== undefined || recordingInitTime !== NaN;

		if (hasInitialTime && songList && songList instanceof Array && songList.length) {
			const lastIndex = songList.length - 1;
			songList[lastIndex].recording.end = diff;
		}

		AsyncStorage.getItem('songRecordings')
		.then(songRecordings => {
			songRecordings = songRecordings ? JSON.parse(songRecordings) : {};

			const newRecordings = { ...songRecordings };
			newRecordings[songName] = {
				ts: Date.now(),
				time: diff,
				songs: songList,
				seekTo: parseFloat(firstPosition),
				isComplete
			};

			AsyncStorage.setItem('songRecordings', JSON.stringify(newRecordings))
			.then(success => {
				if (!this._enabled) this._deleteUnavailableSongs();
			});

			if (isComplete) this._onFinishRecorder(songRecordings);
		})
		.catch(err => {
			if (isComplete) this._onFinishRecorder(null);
		});
	}

	_clearAuxVars() {
		// Limpa todas as variáveis de ajuda
		this._pendingDownloadID		= null; 	// ID do download do TS caso tenha que cancelar
		this._downloadTime 			= null; 	// Utilizado para fazer a diferença do tempo de download
		this._requestTimeout 		= null;
		this._lastTS 				= null;
		this._songName 				= null; 	// Nome do arquivo da música (contém o ID da estação com o timestamp)
		this._firstPosition 		= 0; 		// Posição do primeiro corte em segundost
		this._recordingInitTime 	= null;
		this._songList 				= [];
		this._firstTS 				= false;
		this._finishThread			= null; 	// Thread que contem a função que finaliza a gravação
		this._countStop 			= 0;
		this._countM3U8 			= 0;
		this._countTS 				= 0;
	}

	_onFinishRecorder(success) {
		if (success) {
			EventManager.trackEvent({ action: 'recording', category: 'Player', params: { event_type: 'finish' } });
			if (!this._errorRecorder) {
				this._statusCallback(STATUS_RECORDER.RECORDING_SUCCESS);
				this._recordID++;
			}
		} else {
			if (!this._errorRecorder) this._setError({ type: ERROR_RECORDER.FILE_MANAGER, status: 850 }, success);
		}
	}
}


class RecordingManager {
	constructor() {}

	static setKeys(element, matches, allStations, songs) {
		const fileName = matches[1];
		const stationID = matches[2];
		const station = allStations.find((station) => station.id === stationID);
		const fileInfo = {
			...songs[fileName],
			path: element.path,
			station,
			id: fileName,
			selected: false
		};

		return fileInfo;
	}

	static compare(elementA, elementB) {
		if (elementA.ts < elementB.ts) return 1;
		if (elementA.ts > elementB.ts) return -1;
		return 0;
	}

	static async listRecordings() {
		try {
			const paths = [];

			const dirExist = await RNFS.exists(RECORDING_DIRECTORY_PATH);
			if (!dirExist) return paths;

			const dirItems = await RNFS.readDir(RECORDING_DIRECTORY_PATH);
			const dirItemsIsArray = dirItems &&  Array.isArray(dirItems);
			const hasItemsInDir = dirItemsIsArray && dirItems.length > 0;
			if (!(dirItems || dirItemsIsArray || hasItemsInDir)) return paths;

			const pathFiles = dirItems.filter(dirItems => dirItems.isFile(), paths);


			return pathFiles;
		} catch (error) {
			return error;
		}
	}

	static async listRecordingsComplete(allStations) {
		try {
			const files = [];

			const recordings = await this.listRecordings();

			const isRecordingInstanceOfArray = recordings && Array.isArray(recordings);
			const hasItems = isRecordingInstanceOfArray && recordings.length > 0;
			if (!(isRecordingInstanceOfArray || hasItems)) return files;

			const songRecordings = await AsyncStorage.getItem('songRecordings');
			if (!songRecordings) return files;
			const songs = JSON.parse(songRecordings);

			recordings.map(
				(element, index, array) => {
					const matches = element.name.match(/(([^_]+)_[\w]+)/);
					if (matches && matches.length) {
						files.push(this.setKeys(element, matches, allStations, songs));
					}
				}
			);

			files.sort(this.compare.bind(this));

			return files;

		} catch (err) {
			return err;
		}
	}

	static renameRecording(recording, name) {
		return new Promise(async (resolve, reject) => {
			if (recording && recording instanceof Object && recording.id) {
				try {
					const songRecordings = await AsyncStorage.getItem('songRecordings');
					if (!songRecordings) resolve();

					const songs = JSON.parse(songRecordings);
					if (songs[recording.id]) {
						songs[recording.id].name = name;
						AsyncStorage.setItem('songRecordings', JSON.stringify(songs));
						resolve();
					} else {
						reject();
					}
				} catch (e) {
					reject();
				}
			}
		});
	}

	static async deleteRecordings(recordings) {
		const isRecordingInstanceOfArray = recordings && Array.isArray(recordings);
		const hasItems = isRecordingInstanceOfArray && recordings.length > 0;
		if (!(isRecordingInstanceOfArray || hasItems)) return;

		try {
			const songRecordings = await AsyncStorage.getItem('songRecordings');
			if (!songRecordings) return;
			const songs = JSON.parse(songRecordings);
			const unlink = async (path) => {
				try { await RNFS.unlink(path); }
				catch (err) {}
			};

			recordings.forEach(
				(element) => {
					const path = element.path;
					const id = element.id;

					delete songs[id];
					unlink(path);
				}
			);

			AsyncStorage.setItem('songRecordings', JSON.stringify(songs));
		} catch (err) {
			return err;
		}
	}
}

export { StreamRecorder, RecordingManager, ERROR_RECORDER, STATUS_RECORDER };
