import axios from 'axios';
import { Platform, NetInfo, AppState } from 'react-native';

import AVPlayer from '../../../react-native-avplayer';
import StreamPlayer from '../../../react-native-streamplayer';
import AACPlayer from '../../../react-native-aac-player';
import Media from '../../../react-native-media-player';
import MediaControlsIOS from '../../../react-native-media-controls-ios';
import BackgroundTimer from 'react-native-background-timer';
import Toast from 'react-native-root-toast';
import EventManager from './EventManager';
const ToastAndroid = require('ToastAndroid');

import ExoPlayer2 from '../../../react-native-exoplayer2';

/*
* ----------------------------
* Instância principal do player [Player]
* ----------------------------
*/

export class Player {

    constructor() {
        // PlayerManager é o controlador de todos os players
        // Por default, o player começa com HLS
        this.instance = new PlayerManager(STREAM_TYPE.hls);
        this.currentTypeStreaming = this.instance && this.instance.currentTypeStreaming;
    }

    prepare() {this.instance && this.instance.prepare()}

    stop() {this.instance && this.instance.stop()}

    play() {this.instance && this.instance.play()}

    getPosition() {return this.instance ? this.instance.getPosition() : 0}

    destroy() {this.instance && this.instance.destroy()}

    onNext(cb) {this.instance && this.instance.onNext(cb)}

    onPrev(cb) {this.instance && this.instance.onPrev(cb)}

    getState() {return this.instance ? this.instance.getState() : false}

    getDelay() {return this.instance ? this.instance.getDelay() : 0}

    setStreamings(data) {this.instance && this.instance.setStreamings(data)}

    onError(cb) {this.instance && this.instance.onError(cb)}

    onDelay(cb) {this.instance && this.instance.onDelay(cb)}

	onId3Metadata(cb) {this.instance && this.instance.onId3Metadata(cb)}

    onStateChanged(cb) {this.instance && this.instance.onStateChanged(cb)}

    setMetadata(data) {this.instance && this.instance.setMetadata(data)}

	setVolume(volume) {this.instance && this.instance.setVolume(volume)}
}

/*
* ----------------------------
* Controlador do player [PlayerManager]
* ----------------------------
*/

class PlayerManager {

    // Construtor para inicia as variáveis
    constructor(defaultType) {
        this.state = false;
        this.stateEmitter = false;
        this.currentStreaming = false;
        this.currentTypeStreaming = defaultType;
        this.currentModule = false;
        this.cbState = false;
        this.cbError = false;
        this.cbDelay = false;
		this.cbMetadata = false;
        this.cbNext = false;
        this.cbPrev = false;
        this.cbUpdatedSong = false;
        this.delay   = 0;
		this.id3Metadata = false;
        this.error   = false;
        this.intervalPause = false;
        this.countPause = 0
        this.limitPause = 10;
        this.noConnection = false;

		// Buffer inicial do player
		this.buffer = 0;

        // Segmento atual
        this.segment = null;

        // Verificação de conexão
        NetInfo.isConnected.fetch().then(isConnected => {
            this.noConnection = isConnected ? false : true;
        })
        NetInfo.addEventListener(
            'connectionChange',
            this._handleConnectionInfoChange
        );
    }

    // Método para pausar o áudio
    stop() {
        this.currentModule && this.currentModule.stop();

        // Validação para destruir o player depois de 10s
        if (this.currentTypeStreaming == STREAM_TYPE.hls) {
            BackgroundTimer.clearInterval(this.intervalPause);
            this.intervalPause = BackgroundTimer.setInterval(() => {
                if (this.state === STATE_TYPE.STOPPED) {
                    this.countPause++;
                    this.delay++;
                    if (this.countPause == this.limitPause) {
                        BackgroundTimer.clearInterval(this.intervalPause);
                        this.cleanValues();
                    }
                } else {
                    BackgroundTimer.clearInterval(this.intervalPause);
                }
            }, 1000);
        }
    }

    // Método para tocar o áudio
    play() {
        if (this.currentModule) {
            this.currentModule.play(this.currentStreaming[this.currentTypeStreaming], this.currentTypeStreaming);
        } else {
            this.prepareAndPlay();
        }
        // Limpando o interval do limit do pause
        BackgroundTimer.clearInterval(this.intervalPause);
    }

    // Método para destruir o player
    destroy() {
        BackgroundTimer.clearInterval(this.intervalPause);
        this.currentModule && this.currentModule.destroy();
    }

    // Método que prepara o player
    prepare() {
        // Limpar os valores iniciais
        this.cleanValues();
        // Função para obter o streaming para tocar
        this.currentStreaming = this.getCurrentStreaming();
        // Função para instanciar o modulo correto de acordo com o tipo da streaming
        this.setCurrentModuleByType();
        // Caso tenha error, envia um evento para o player
        if (this.error) {
            PlayerManager.triggerEvents(this.error, this.cbError);
            this.cleanValues();
        }
    }

    // Função para retornar a posição da música
    getPosition() {
        if (this.currentModule) {
            return this.currentModule.getPosition();
        }
    }

	setVolume(volume) {
		if (this.currentModule) {
            return this.currentModule.setVolume(volume);
        }
	}

    // Função que prepara o player e toca
    prepareAndPlay() {
        this.prepare();
        if (!this.error) {
			this.play();
		}
    }

    // Função para limpar as variáveis
    cleanValues() {
        this.countPause = 0;
        this.error = false;
        this.delay = 0;
        this.state = false;
        if (this.currentModule) this.currentModule.destroy();
        this.currentStreaming = false;
        this.currentModule = false;
    }

    // Função para trocar o tipo da streaming, por exemplo: HLS para MP3 ou AAC
    changeTypeStreamingAndPlay() {
        let keysTypeStreaming = Object.keys(STREAM_TYPE);
        for (let x=0; x<keysTypeStreaming.length; x++) {
            if (keysTypeStreaming[x] == this.currentTypeStreaming) {
                if (keysTypeStreaming[x+1]) {
                    this.currentTypeStreaming = keysTypeStreaming[x+1];
                } else {
                    this.currentTypeStreaming = keysTypeStreaming[0];
                }
                break;
            }
        }

        // Logo depois de trocar, ele manda tocar novamente
        this.prepareAndPlay();
    }

    // Função para enviar o array com as streamings
    setStreamings(data) {
        if (data && Object.keys(data)) {
            this.streamings = data;
        } else {
            this.error = ERROR_TYPES.STREAMING_LIST;
            PlayerManager.triggerEvents(this.error, this.cbError);
        }
    }

    // Função para colocar informações do que está tocando no celular
    setMetadata(data) {
        if (data && Object.keys(data)) {
            this.mediaControls && this.mediaControls.updateMetas(data);
        }
    }


    // Função para obter a streaming que deve ser tocado
    getCurrentStreaming() {
        let ret = false;
        let keysStreaming = Object.keys(this.streamings);
        if (this.streamings) {
            if (!this.currentStreaming) {
                if (this.streamings[this.currentTypeStreaming]) {
                    ret = {};
                    ret[this.currentTypeStreaming] = this.streamings[this.currentTypeStreaming];
                } else {
                    this.error = ERROR_TYPES.CURRENT_TYPE_STREAMING;
                }
            }
        } else {
            this.error = ERROR_TYPES.STREAMING_LIST;
        }
        return ret;
    }

    // Função para obter os eventos do player
    onStateChanged(cb) {this.cbState = cb;}

    // Função para obter os eventos de error do player
    onError(cb) {this.cbError = cb;}

    onDelay(cb) { this.cbDelay = cb; }

	onId3Metadata(cb) { this.cbMetadata = cb; }

    onNext(cb) { this.cbNext = cb; }

    onPrev(cb) { this.cbPrev = cb; }

    // Função responsável por enviar os eventos
    static triggerEvents(data, cb) {
        cb && cb(data);
    }

    // Função para obter o status do player
    getState() { return this.state; }

    // Função para obter o delay do player
    getDelay() { return (this.delay) }

	setId3Metadata(id3Metadata) {
		this.id3Metadata = id3Metadata;
		PlayerManager.triggerEvents(this.id3Metadata, this.cbMetadata);
	}

	setDelay(delay, isId3Metadata) {
        let url = this.currentStreaming[this.currentTypeStreaming];
        if (this.currentTypeStreaming === STREAM_TYPE.hls) {
            if (this.delay === 0) {
				if (url && url.match(/master.m3u8/)) {
					// Desconsiderando o delay na nova URL do server por conta do metadata
					return;
				} else if (url && !url.match(/index.m3u8/)) {
                    url = url.replace('.m3u8', '/index.m3u8');
                }

                axios.get(url)
                .then(res => {
                    if (!res || !res.data) {
                        PlayerManager.triggerEvents(this.delay, this.cbDelay);
                        return;
                    }

                    const headers = res.headers;
                    const lastModified = new Date(headers['last-modified']).getTime();
                    const origDate = new Date(headers.date).getTime();
                    let duration = res.data.match(/(X-TARGET.*:)([0-9]+)/i);
                    const tsLength = res.data.match(/EXTINF/g);

                    if (duration.length && duration[2] && tsLength && tsLength.length) {
                        duration = parseInt(duration[2], 10);
                        const diff = (origDate - lastModified) / 1000;
                        this.delay = ((duration * tsLength.length) + diff) - delay;
                        if (this.delay < 0) this.delay = 135;

                        this.delay = this.delay + this.countPause;
                        PlayerManager.triggerEvents(this.delay, this.cbDelay);
                    }
                })
                .catch(error => {
                  PlayerManager.triggerEvents(this.delay, this.cbDelay);
                });
            } else if (url && !url.match(/master.m3u8/)) {
                PlayerManager.triggerEvents(this.delay, this.cbDelay);
            }
        } else {
            PlayerManager.triggerEvents(0, this.cbDelay);
        }
    }

    // Função que instância o módulo correto do player
    setCurrentModuleByType() {
        if (Platform.OS === "ios") {
            switch(this.currentTypeStreaming) {
                case STREAM_TYPE.hls:
                    this.currentModule = new AVPlayerModule(this);
                    this.mediaControls = new MediaControlsIOS(this.onMediaControlsEvent.bind(this));
                break;
                case STREAM_TYPE.aac:
                case STREAM_TYPE.mp3:
                    this.currentModule = new StreamPlayerModule(this);
                    this.mediaControls = new MediaControlsIOS(this.onMediaControlsEvent.bind(this));
                break;
                default:
                    this.error = ERROR_TYPES.STREAM_TYPE_NOT_RECOGNIZED;
                break;
            }
        } else {
            switch(this.currentTypeStreaming) {
                case STREAM_TYPE.hls:
                    this.currentModule = new ExoPlayerHLSModule(this);
                break;
                case STREAM_TYPE.aac:
                    this.currentModule = new AACPlayerModule(this);
                break;
                case STREAM_TYPE.mp3:
                    this.currentModule = new MediaPlayerModule(this);
                break;
                default:
                    this.error = ERROR_TYPES.STREAM_TYPE_NOT_RECOGNIZED;
                break;
            }
        }
    }

    // Função que escuta os controles do celular
    onMediaControlsEvent(event) {
        switch(event) {
            case MEDIA_CONTROLS_EVENTS.TOGGLE:
                if (this.state == STATE_TYPE.RUNNING) {
                    this.stop()
                } else {
                    this.play()
                }
            break;
            case MEDIA_CONTROLS_EVENTS.PLAY:
                this.play();
            break;
            case MEDIA_CONTROLS_EVENTS.PAUSE:
                this.stop();
            break;
            case MEDIA_CONTROLS_EVENTS.NEXT:
                PlayerManager.triggerEvents(false, this.cbNext);
            break;
            case MEDIA_CONTROLS_EVENTS.PREV:
                PlayerManager.triggerEvents(false, this.cbPrev);
            break;
        }
    }

    // Função para buscar o buffer da primeira parte da música atual
    async loadBuffer({ instance, source, onStateChanged }) {
        // Seta o estado do player para loading
        onStateChanged(STATE_TYPE.STARTING);

        // Troca a url para trazer os segmentos do streaming atual
        const url = source.replace("master.m3u8", "aac.m3u8");
        // Buffer inicial para dazer a soma
        let buffer = 0;

        try {

            const res = await axios.get(url);
            if (res && res.data) {
                const { data } = res;
                // Lista todos os segmentos do m3u8
                let segments = data.match(/[\d-\.]+\.aac/gm).map(segment => {
                    const matches = segment.match(/-(\d{2,2})-(\d+?.+).aac/);
                    const position = matches[1];
                    const duration = matches[2];

                    return { segment, position, duration };
                });


	            // Caso tenha itens na lista de segmentos
	            if (segments && segments.length) {
	                for (var i = 0; i < segments.length; i++) {
	                    const segment = segments[i];
	                    // Verifica se é a primeia parte da música
	                    if (segment.position === "00") {
	                        // Verifica se está na faixa entre os segmentos que nãos erão removidos
	                        if (i >= 3 && i < (segments.length - 2)) {

							   // VERIFICAR A CONDIÇÃO DO FOR POIS NO ANDROID ESTAVA '<' e no ios '<='
								if (Platform.OS == 'android') {
									for (var j = 0; j < i; j++) {
										// Vai somando o tamanho dos segmentos anteriores
										buffer += parseFloat(segments[j].duration);

									}
								} else {
									for (var j = 0; j <= i; j++) {
										// Vai somando o tamanho dos segmentos anteriores
										buffer += parseFloat(segments[j].duration);

									}
								}

	                            // Coloca o buffer em ms (caso android)
								if (Platform.OS === 'android') buffer *= 1000;
	                            this.segment = segment.segment;
	                            break;
	                        }
	                    }
	                }
	            }
			}

        } catch (err) {}

        // Caso não tenha encontrado o buffer, coloca o padrão do AVPlayer (60 segundos) : ExoPlayer (60000)
		if (!buffer) buffer = Platform.OS === 'ios' ? 60 : 60000;

		// Seta o buffer no PlayerManager
		this.buffer = buffer;
		instance.setBuffer(this.buffer);
		instance.play();
    }

    // Evento de conexão
    _handleConnectionInfoChange = (connectionInfo) => {
        this.noConnection = connectionInfo === 'NONE' ? true : false;
    };
}

/*
* ----------------------------
* Módulos existentes do player [AVPlayerModule, StreamPlayerModule]
* ----------------------------
*/

// Módulo para tocar HLS no device IOS
class AVPlayerModule {

    constructor(PlayerManager) {
        this.self = PlayerManager;
        this.instance = false;
        this.source = false;
        this.type = false;
        this.retryStation = false;
        this.userPaused = false;
        this.errorTimeout = false;
        this.errorTime = 10000;
		this.lastMetadata = false;
    }

	// Função para buscar o buffer da primeira parte da música atual
	async loadBuffer() {
		// Seta o estado do player para loading
		this.onStateChanged(STATE_TYPE.STARTING);

		// Troca a url para trazer os segmentos do streaming atual
		const url = this.source.replace("master.m3u8", "aac.m3u8");
		// Buffer inicial para dazer a soma
		let buffer = 0;

		try {
			const res = await axios.get(url);

			if (res && res.data) {
				const { data } = res;
				// Lista todos os segmentos do m3u8
				let segments = data.match(/[\d-\.]+\.aac/gm).map(segment => {
					const matches = segment.match(/-(\d{2,2})-(\d+?.+).aac/);
					const position = matches[1];
					const duration = matches[2];

					return { segment, position, duration };
				});

				// Caso tenha itens na lista de segmentos
				if (segments && segments.length) {
					for (var i = 0; i < segments.length; i++) {
						const segment = segments[i];
						// Verifica se é a primeia parte da música
						if (segment.position === "00") {
							// Verifica se está na faixa entre os segmentos que nãos erão removidos
							if (i >= 3 && i < (segments.length - 2)) {
								for (var j = 0; j <= i; j++) {
									// Vai somando o tamanho dos segmentos anteriores
									buffer += parseFloat(segments[j].duration);
								}
								break;
							}
						}
					}
				}
			}
		} catch (e) {
			// Continua sem setar o buffer do player
		}

		// Caso não tenha encontrado o buffer, coloca o padrão do AVPlayer (60 segundos)
		if (!buffer) buffer = 60;

		// Seta o buffer no PlayerManager
		this.self.buffer = buffer;
		this.instance.setBuffer(this.self.buffer);

		this.instance.play();
	}

    // Função rensponável por tocar o áudio
    play(source, type) {
        this.source = source;
        this.type = type;

        BackgroundTimer.clearTimeout(this.errorTimeout);

        if (this.source) {
			if (this.instance && this.source != this.instance.src) {
				this.released = true;
				this.instance.release();
				this.instance = false;
				if (!this.retryStation) this.countRetry = 0;
			}
			if (!this.instance) {
				this.source = this.source.replace("master.m3u8", "aac.m3u8");
                this.instance = new AVPlayer(this.source, this.onStateChanged.bind(this), this.onDelay.bind(this), this.onError.bind(this), this.onId3Metadata.bind(this));
				if (!this.self.buffer) {
					this.self.loadBuffer({
						instance: this.instance,
						source: this.source,
						onStateChanged: this.onStateChanged.bind(this)
					});
					return;
				} else {
					this.instance.setBuffer(this.self.buffer);
				}
            }
		}

		this.instance.play();
    }

    // Função rensponável por pausar o áudio
    stop() {
        this.userPaused = true;
        this.instance && this.instance.stop();
    }

    // Função rensponável por destruir o player
    destroy() {
		this.idRetry && BackgroundTimer.clearTimeout(this.idRetry);
        BackgroundTimer.clearTimeout(this.errorTimeout);
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
		this.instance && this.instance.release();
    }

    // Função que recebe o delay do player
    onDelay(delay) {
		if (delay && delay >= 0) {
			delay = Math.floor(delay);
		} else {
			delay = 0;
		}
		this.self.setDelay(delay);
    }

    // Função para retornar a posição da música
    getPosition() {
        if (this.instance) {
            return this.instance.getPosition();
        }
    }

    // Funçnao para cuidar dos erros do player
    onError(error) {
        error = Number(error);
        // Caso seja um problema problema no streaming, ele tenta novamente
		if (error == ERROR_TYPES.STREAM_FAIL || !error) {
			this.retrier();
		} else if (error == ERROR_TYPES.INVALID_STREAM) {
			if (this.retryStation) {
				this.retrier();
			} else {
                // Caso seja problema de URL inválida, passa para o próximo tipo
                PlayerManager.triggerEvents(ERROR_TYPES.INVALID_STREAM, this.self.cbError);
                this.self.changeTypeStreamingAndPlay();
			}
		} else {
            // Caso seja problema desconhecido, passa para o próximo tipo
            PlayerManager.triggerEvents(ERROR_TYPES.INVALID_STREAM, this.self.cbError);
            this.self.changeTypeStreamingAndPlay();
        }
        this.self.state = STATE_TYPE.ERROR;
        BackgroundTimer.clearTimeout(this.errorTimeout);
    }

	onId3Metadata(id3Metadata) {
		this.self.setId3Metadata(id3Metadata);
	}

    // Funçnao para escutar eventos do player
    onStateChanged(state) {
        state = Number(state);
        switch (state) {
            // Evento do buffer
            case STATE_TYPE.STARTING: {
				// Zera o item do metadata
				this.lastMetadata = false;

                BackgroundTimer.clearTimeout(this.errorTimeout);
                let that = this;
                // Caso demore até 10s para tocar, lança o error
                this.errorTimeout = BackgroundTimer.setTimeout(() => {
                    that.onError(ERROR_TYPES.STREAM_FAIL);
                }, this.errorTime);
                this.self.state = STATE_TYPE.STARTING;
                PlayerManager.triggerEvents(STATE_TYPE.STARTING, this.self.cbState);
            } break;
            // Evento que começou a tocar
            case STATE_TYPE.RUNNING: {
                this.self.state = STATE_TYPE.RUNNING;
                PlayerManager.triggerEvents(STATE_TYPE.RUNNING, this.self.cbState);
                BackgroundTimer.clearTimeout(this.errorTimeout);
                this.retryStation = false;
                this.userPaused = false;
            } break;
            // Evento que parou de tocar
            case STATE_TYPE.STOPPED: {
                this.self.state = STATE_TYPE.STOPPED;
                PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
            } break;
            // Evento quando der algum problema
            case STATE_TYPE.ERROR: {
                this.onError();
            }
        }
    }

    // Função que fica responsável por tentar tocar novamente, tempo de 2s
    retrier() {
        this.idRetry && BackgroundTimer.clearTimeout(this.idRetry);
        this.idRetry = null;
        if (this.idRetry == null) {
            let that = this;
            this.idRetry = BackgroundTimer.setTimeout(() => {
                that.countRetry++;
                if (that.self.noConnection) {
                    // Mostrar toast somente se o usuário estiver com o celular ativo
                    if (AppState.currentState == "active") {
						EventManager.trackEvent({ action: 'stream_reconnect', category: 'Player', params: { is_connected: that.self.noConnection } });
                        Toast.show("Reconectando"+(that.countRetry > 1 ? " ( "+ that.countRetry +" tentativas )" : '')+"\nVerifique sua conexão com a internet");
                    }
                } else {
                    // Mostrar toast somente se o usuário estiver com o celular ativo
                    if (AppState.currentState == "active") {
                        if (that.countRetry > 20) {
                            Toast.show("Reconectando ("+that.countRetry+" tentativas)\nSe a sua conexão com a Internet estiver boa, pode ser algum problema nos nossos servidores. Se for isso, aguarde mais um pouco ou tente novamente mais tarde. Desculpe! :(");
                        } else {
                            Toast.show("Reconectando "+(that.countRetry > 1 ? "( "+ that.countRetry +" tentativas )" : ''));
                        }
						EventManager.trackEvent({ action: 'stream_reconnect', category: 'Player', params: { is_connected: that.self.noConnection } });
                    }
                }

                let newRetry = that.instance.src;
                that.retryStation = true;
                that.instance.src = false;
                that.play(newRetry, this.type);
                that.idRetry = null;
            }, 1000);
        }
    };
}

// Módulo para tocar MP3 E AAC no device IOS
class StreamPlayerModule {

    constructor(PlayerManager) {
        this.self = PlayerManager;
        this.instance = false;
        this.source = false;
        this.type = false;
        this.userPaused = false;
        this.errorTimeout = false;
        this.errorTime = 10000;
        this.delay = 0;
    }

    // Função rensponável por tocar o áudio
    play(source, type) {
        this.source = source;
        this.type = type;

        BackgroundTimer.clearTimeout(this.errorTimeout);

        if (this.source) {
			if (this.instance && this.source != this.instance.src) {
				this.released = true;
				this.instance.release();
				this.instance = false;
			}
			if (!this.instance) {
				this.instance = new StreamPlayer(this.source, this.onStateChanged.bind(this), this.onError.bind(this));
			}
		}
		this.instance.play();
    }

    // Função rensponável por pausar o áudio
    stop() {
        this.userPaused = true;
        this.instance && this.instance.stop();
    }

    // Função rensponável por destruir o player
    destroy() {
        BackgroundTimer.clearTimeout(this.errorTimeout);
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
		this.instance && this.instance.release();
    }

    // Funçnao para cuidar dos erros do player
    onError() {
        BackgroundTimer.clearTimeout(this.errorTimeout);
        PlayerManager.triggerEvents(ERROR_TYPES.INVALID_STREAM, this.self.cbError);
        this.self.changeTypeStreamingAndPlay();
        this.self.state = STATE_TYPE.ERROR;
    }

	// Função para retornar a posição da música
    getPosition() {
        if (this.instance) {
            return 0;
        }
    }

    // Funçnao para escutar eventos do player
    onStateChanged(state) {
        state = Number(state);
        switch (state) {
            // Evento do buffer
            case STATE_TYPE.STARTING: {
                BackgroundTimer.clearTimeout(this.errorTimeout);
                let that = this;
                // Caso demore até 10s para tocar, lança o error
                this.errorTimeout = BackgroundTimer.setTimeout(() => {
                    that.onError(ERROR_TYPES.STREAM_FAIL);
                }, this.errorTime);
                this.self.state = STATE_TYPE.STARTING;
                PlayerManager.triggerEvents(STATE_TYPE.STARTING, this.self.cbState);
            } break;
            // Evento que começou a tocar
            case STATE_TYPE.RUNNING: {
                this.self.state = STATE_TYPE.RUNNING;
                PlayerManager.triggerEvents(STATE_TYPE.RUNNING, this.self.cbState);
                BackgroundTimer.clearTimeout(this.errorTimeout);
                this.userPaused = false;
                this.self.setDelay(0);
            } break;
            // Evento que parou de tocar
            case STATE_TYPE.STOPPED: {
                this.self.state = STATE_TYPE.STOPPED;
                PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
            } break;
            // Evento quando der algum problema
            case STATE_TYPE.ERROR: {
                this.onError();
            }
        }
    }
}

class AACPlayerModule {

    constructor(PlayerManager) {
        this.self = PlayerManager;
        this.instance = false;
        this.source = false;
        this.type = false;
        this.userPaused = false;
        this.errorTimeout = false;
        this.errorTime = 10000;
        this.delay = 0;
    }

    // Função rensponável por tocar o áudio
    play(source, type) {
        this.source = source;
        this.type = type;

        BackgroundTimer.clearTimeout(this.errorTimeout);

        if (this.source) {
			if (this.instance && this.source != this.instance.src) {
				this.released = true;
				this.instance.release();
				this.instance = false;
			}
			if (!this.instance) {
				this.instance = new AACPlayer(this.source, this.onStateChanged.bind(this));
			}
		}
		this.instance.play();
    }

    // Função rensponável por pausar o áudio
    stop() {
        this.userPaused = true;
        this.instance && this.instance.stop();
    }

    // Função rensponável por destruir o player
    destroy() {
        BackgroundTimer.clearTimeout(this.errorTimeout);
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
        this.userPaused = true;
		this.instance && this.instance.release();
    }

    // Funçnao para cuidar dos erros do player
    onError() {
        BackgroundTimer.clearTimeout(this.errorTimeout);
        PlayerManager.triggerEvents(ERROR_TYPES.INVALID_STREAM, this.self.cbError);
        this.self.changeTypeStreamingAndPlay();
        this.self.state = STATE_TYPE.ERROR;
    }

    // Funçnao para escutar eventos do player
    onStateChanged(state) {
        state = Number(state);
        switch (state) {
            // Evento do buffer
            case STATE_TYPE.STARTING: {
                BackgroundTimer.clearTimeout(this.errorTimeout);
                let that = this;
                // Caso demore até 10s para tocar, lança o error
                this.errorTimeout = BackgroundTimer.setTimeout(() => {
                    that.onError(ERROR_TYPES.STREAM_FAIL);
                }, this.errorTime);
                this.self.state = STATE_TYPE.STARTING;
                PlayerManager.triggerEvents(STATE_TYPE.STARTING, this.self.cbState);
            } break;
            // Evento que começou a tocar
            case STATE_TYPE.RUNNING: {
                this.self.state = STATE_TYPE.RUNNING;
                PlayerManager.triggerEvents(STATE_TYPE.RUNNING, this.self.cbState);
                BackgroundTimer.clearTimeout(this.errorTimeout);
                this.userPaused = false;
                this.self.setDelay(0);
            } break;
            // Evento que parou de tocar
            case STATE_TYPE.STOPPED: {
                if (this.userPaused) {
                    this.self.state = STATE_TYPE.STOPPED;
                    PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
                } else {
                    this.onError();
                }
            } break;
            // Evento quando der algum problema
            case STATE_TYPE.ERROR: {
                this.onError();
            }
        }
    }

	// Função para retornar a posição da música
    getPosition() {
		return 0;
    }
}

class MediaPlayerModule {

    constructor(PlayerManager) {
        this.self = PlayerManager;
        this.instance = false;
        this.source = false;
        this.type = false;
        this.userPaused = false;
        this.errorTimeout = false;
        this.errorTime = 10000;
        this.delay = 0;
    }

    // Função rensponável por tocar o áudio
    play(source, type) {
        this.source = source;
        this.type = type;

        BackgroundTimer.clearTimeout(this.errorTimeout);

        if (this.source) {
			if (this.instance && this.source != this.instance.src) {
				this.released = true;
				this.instance.release();
				this.instance = false;
			}
			if (!this.instance) {
				this.instance = new Media(this.source, this.onStateChanged.bind(this), this.onError.bind(this));
			}
		}
		this.instance.play();
    }

    // Função rensponável por pausar o áudio
    stop() {
        this.userPaused = true;
        this.instance && this.instance.stop();
    }

    // Função rensponável por destruir o player
    destroy() {
        BackgroundTimer.clearTimeout(this.errorTimeout);
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
		this.instance && this.instance.release();
    }

    // Funçnao para cuidar dos erros do player
    onError() {
        BackgroundTimer.clearTimeout(this.errorTimeout);
        PlayerManager.triggerEvents(ERROR_TYPES.INVALID_STREAM, this.self.cbError);
        this.self.changeTypeStreamingAndPlay();
        this.self.state = STATE_TYPE.ERROR;
    }

    // Funçnao para escutar eventos do player
    onStateChanged(state) {
        state = Number(state);
        switch (state) {
            // Evento do buffer
            case STATE_TYPE.STARTING: {
                BackgroundTimer.clearTimeout(this.errorTimeout);
                let that = this;
                // Caso demore até 10s para tocar, lança o error
                this.errorTimeout = BackgroundTimer.setTimeout(() => {
                    that.onError(ERROR_TYPES.STREAM_FAIL);
                }, this.errorTime);
                this.self.state = STATE_TYPE.STARTING;
                PlayerManager.triggerEvents(STATE_TYPE.STARTING, this.self.cbState);
            } break;
            // Evento que começou a tocar
            case STATE_TYPE.RUNNING: {
                this.self.state = STATE_TYPE.RUNNING;
                PlayerManager.triggerEvents(STATE_TYPE.RUNNING, this.self.cbState);
                BackgroundTimer.clearTimeout(this.errorTimeout);
                this.userPaused = false;
                this.self.setDelay(0);
            } break;
            // Evento que parou de tocar
            case STATE_TYPE.STOPPED: {
                if (this.userPaused) {
                    this.self.state = STATE_TYPE.STOPPED;
                    PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
                } else {
                    this.onError();
                }
            } break;
            // Evento quando der algum problema
            case STATE_TYPE.ERROR: {
                this.onError();
            }
        }
    }
}

// Módulo para tocar HLS no device Android
class ExoPlayerHLSModule {

    constructor(PlayerManager) {
        this.self = PlayerManager;
        this.instance = false;
        this.source = false;
        this.type = false;
        this.retryStation = false;
        this.userPaused = false;
        this.errorTimeout = false;
        this.errorTime = 30000;
        this.errorHasOccurredPreviously = false;
        this.countRetry = 0;
		this.volumeFade = 0;
    }

	// Função para buscar o buffer da primeira parte da música atual
	async loadBuffer() {
		// Seta o estado do player para loading
		this.onStateChanged(STATE_TYPE.STARTING);

		// Troca a url para trazer os segmentos do streaming atual
		const url = this.source.replace("master.m3u8", "aac.m3u8");
		// Buffer inicial para dazer a soma
		let buffer = 0;

		try {
			const res = await axios.get(url);

			if (res && res.data) {
				const { data } = res;
				// Lista todos os segmentos do m3u8
				let segments = data.match(/[\d-\.]+\.aac/gm).map(segment => {
					const matches = segment.match(/-(\d{2,2})-(\d+?.+).aac/);
					const position = matches[1];
					const duration = matches[2];

					return { segment, position, duration };
				});

				// Caso tenha itens na lista de segmentos
				if (segments && segments.length) {
					for (var i = 0; i < segments.length; i++) {
						const segment = segments[i];
						// Verifica se é a primeia parte da música
						if (segment.position === "00") {
							// Verifica se está na faixa entre os segmentos que nãos erão removidos
							if (i >= 3 && i < (segments.length - 2)) {
								for (var j = 0; j < i; j++) {
									// Vai somando o tamanho dos segmentos anteriores
									buffer += parseFloat(segments[j].duration);
								}
								// Coloca o buffer em ms
								buffer *= 1000;
                                this.self.segment = segment.segment;
								break;
							}
						}
					}
				}
			}
		} catch (e) {
			// Continua sem setar o buffer do player
		}

		// Caso não tenha encontrado o buffer, coloca o padrão do ExoPlayer (60000)
		if (!buffer) buffer = 60000;

		// Seta o buffer no PlayerManager
		this.self.buffer = buffer;
		// Coloca o buffer no ExoPlayer
		this.instance.setBuffer(this.self.buffer);

		// Reproduz a estação normalmente
		this.instance.play();
	}

    // Função rensponável por tocar o áudio
    play(source, type) {
        this.source = source;
        this.type = type;

        BackgroundTimer.clearTimeout(this.errorTimeout);

        if (this.source) {
			if (this.instance && this.source != this.instance.src) {
				this.released = true;
				this.instance.release();
				this.instance = false;
                if (!this.retryStation) this.countRetry = 0;
			}
			if (!this.instance) {
				this.instance = new ExoPlayer2(this.source, this.onStateChanged.bind(this), this.onId3Metadata.bind(this));
				if (!this.self.buffer) {
					this.self.loadBuffer({
						instance: this.instance,
						source: this.source,
						onStateChanged: this.onStateChanged.bind(this)
					});
					return;
				}
            }
		}

		this.instance.play();
    }

    // Função rensponável por pausar o áudio
    stop() {
        this.userPaused = true;
        this.instance && this.instance.stop();
    }

    // Função para retornar a posição da música
    getPosition() {
        if (this.instance) {
            return this.instance.getPosition();
        }
    }

    // Função rensponável por destruir o player
    destroy() {
		this.idRetry && BackgroundTimer.clearTimeout(this.idRetry);
        BackgroundTimer.clearTimeout(this.errorTimeout);
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
		this.instance && this.instance.release();
    }

    // Função que recebe o delay do player
    onDelay(delay) {
        if (delay && delay >= 0) {
            delay = Math.floor(delay);
        } else {
            delay = 0;
        }
        this.self.setDelay(delay);
    }

	onId3Metadata(id3Metadata) {
		this.self.setId3Metadata(id3Metadata);
	}

    // Funçnao para cuidar dos erros do player
    onError(error) {
        error = Number(error);
        this.errorHasOccurredPreviously = true;

        // Caso seja um problema problema no streaming, ele tenta novamente
		if (error == ERROR_TYPES.STREAM_FAIL || !error) {
			this.retrier();
		} else if (error == ERROR_TYPES.INVALID_STREAM) {
			if (this.retryStation) {
				this.retrier();
			} else {
                // Caso seja problema de URL inválida, passa para o próximo tipo
                PlayerManager.triggerEvents(ERROR_TYPES.INVALID_STREAM, this.self.cbError);
                this.self.changeTypeStreamingAndPlay();
			}
		} else {
            // Caso seja problema desconhecido, passa para o próximo tipo
            PlayerManager.triggerEvents(ERROR_TYPES.INVALID_STREAM, this.self.cbError);
            this.self.changeTypeStreamingAndPlay();
        }
        this.self.state = STATE_TYPE.ERROR;
        BackgroundTimer.clearTimeout(this.errorTimeout);
    }

    // Função para escutar eventos do player
    onStateChanged(state) {
        state = Number(state);
        switch (state) {
            // Evento do buffer
            case this.instance.STATE_STARTING: {
				this.volumeFade = 0;
                BackgroundTimer.clearTimeout(this.errorTimeout);
                let that = this;
                // Caso demore até 10s para tocar, lança o error
                this.errorTimeout = BackgroundTimer.setTimeout(() => {
                    that.onError(ERROR_TYPES.STREAM_FAIL);
                }, this.errorTime);
                this.self.state = STATE_TYPE.STARTING;
                PlayerManager.triggerEvents(STATE_TYPE.STARTING, this.self.cbState);
            } break;
            // Evento que começou a tocar
            case this.instance.STATE_RUNNING: {
				this.volumeFade = 0;
                this.self.state = STATE_TYPE.RUNNING;
                PlayerManager.triggerEvents(STATE_TYPE.RUNNING, this.self.cbState);
                BackgroundTimer.clearTimeout(this.errorTimeout);
                this.retryStation = false;
                this.userPaused = false;
                this.errorHasOccurredPreviously = false;
                this.countRetry = 0;
				this.volumeController();
            } break;
            // Evento que parou de tocar
            case this.instance.STATE_STOPPED: {
                if (this.userPaused) {
                    this.self.state = STATE_TYPE.STOPPED;
                    PlayerManager.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
                    this.errorHasOccurredPreviously = false;
                } else if (this.instance.src && !this.type.match(/hls/)){
                    this.onError(ERROR_TYPES.STREAM_FAIL);
                }
            } break;
            // Evento quando der algum problema
            case this.instance.STREAM_FAIL: {
                this.onError(ERROR_TYPES.STREAM_FAIL);
            } break;
            case this.instance.INVALID_STREAM: {
                this.onError(ERROR_TYPES.INVALID_STREAM);
            } break;
			case this.instance.TS_NOT_FOUND: {
				EventManager.trackEvent({ action: 'stream_fail_ts_notfound', category: 'Player', params: { is_connected: this.self.noConnection } });
            } break;
            case this.instance.UNKNOWN_HOST: {
                // Lançado quando o cliente tenta realizar o download do arquivo m3u8 ou o arquivo aac no momento em que a música ainda está tocando, mas falha
            } break;
            case this.instance.SOCKET_TIMEOUT: {
                if (!this.errorHasOccurredPreviously) {
                    // Lançado quando o cliente tente conectar-se e acontece um timeout
                    EventManager.trackEvent({ action: 'exoplayer_exception', category: 'Player', params: { exception: 'SocketTimeoutException' } });
                }
            } break;
            case this.instance.CONNECT_EXCEPTION: {
                // Lançado quando o cliente tenta realizar uma conexão em um endereço ou porta invalida
                if (!this.errorHasOccurredPreviously) {
                    EventManager.trackEvent({ action: 'exoplayer_exception', category: 'Player', params: { exception: 'ConnectException' } });
                }
            } break;
            case this.instance.TS_FAIL: {
                // Lançado quando o download do arquivo .ts falha. Nesse ponto a stream já não está mais tocando
                if (!this.errorHasOccurredPreviously) {
                    EventManager.trackEvent({ action: 'stream_fail_ts', category: 'Player', params: { is_connected: this.self.noConnection } });
                }
                this.onError(ERROR_TYPES.STREAM_FAIL);
            } break;
            case this.instance.AAC_FAIL: {
                // Lançado quando o download do arquivo .aac falha. Nesse ponto a stream já não está mais tocando
                if (!this.errorHasOccurredPreviously) {
                    EventManager.trackEvent({ action: 'stream_fail_aac', category: 'Player', params: { is_connected: this.self.noConnection } });
                }
                this.onError(ERROR_TYPES.STREAM_FAIL);
            } break;
            case this.instance.M3U8_FAIL: {
                // Lançado quando o download do arquivo .m3u8 falha. Nesse ponto a stream já não está mais tocando
				if (!this.errorHasOccurredPreviously) {
					EventManager.trackEvent({ action: 'stream_fail_m3u8', category: 'Player', params: { is_connected: this.self.noConnection } });
				}
				this.onError(ERROR_TYPES.STREAM_FAIL);
            } break;
        }
    }

	volumeController() {
		if (this.volumeFade >= 0 && this.volumeFade < 0.99) {
			BackgroundTimer.setTimeout(() => {
				this.volumeFade += 0.02;
				this.instance.setVolume(this.volumeFade);
				this.volumeController();
			}, 15);
		}
	}

    // Função que fica responsável por tentar tocar novamente, tempo de 2s
    retrier() {
        this.idRetry && BackgroundTimer.clearTimeout(this.idRetry);
		this.idRetry = null;
        if (this.idRetry == null) {
            let that = this;
            this.idRetry = BackgroundTimer.setTimeout(() => {
                that.countRetry++;
                if (that.self.noConnection) {
                    // Mostrar toast somente se o usuário estiver com o celular ativo
                    if (AppState.currentState == "active") {
                        ToastAndroid.show("Reconectando"+(that.countRetry > 1 ? " ( "+ that.countRetry +" tentativas )" : '')+"\nVerifique sua conexão com a internet", ToastAndroid.SHORT);
                    }
                } else {
                    // Mostrar toast somente se o usuário estiver com o celular ativo
                    if (AppState.currentState == "active") {
                        if (that.countRetry > 20) {
                            ToastAndroid.show("Reconectando ("+that.countRetry+" tentativas)\nSe a sua conexão com a Internet estiver boa, pode ser algum problema nos nossos servidores. Se for isso, aguarde mais um pouco ou tente novamente mais tarde. Desculpe! :(", ToastAndroid.SHORT);
                        } else {
                            ToastAndroid.show("Reconectando "+(that.countRetry > 1 ? "( "+ that.countRetry +" tentativas )" : ''), ToastAndroid.SHORT);
                        }
                    }
                }

				// Envia o evento de reconectando uma única vez na reconexão
				if (this.countRetry === 1) EventManager.trackEvent({ action: 'stream_reconnect', category: 'Player', params: { is_connected: that.self.noConnection } });

                let newRetry = that.instance.src;
                that.retryStation = true;
                that.instance.src = false;
                that.play(newRetry, this.type);
                that.idRetry = null;
            }, 1500);
        }
	};
}

/*
* ----------------------------
* Constantes existentes do player [ERROR_TYPES, STATE_TYPE, STREAM_TYPE, MEDIA_CONTROLS_EVENTS]
* ----------------------------
*/

export const ERROR_TYPES = {
    STREAMING_LIST: 99,
    STREAM_TYPE_NOT_RECOGNIZED: 98,
    CURRENT_TYPE_STREAMING: 97,
    STREAM_FAIL: 96,
    INVALID_STREAM: 95
}

export const STATE_TYPE = {
    IDLE: -1,
    STARTING: 1,
    RUNNING: 2,
    STOPPED: 3,
    ERROR: 4,
    ENDED: 6
}

export const STREAM_TYPE = {
    hls: 'hls',
	aac: 'aac',
	mp3: 'mp3'
}

export const MEDIA_CONTROLS_EVENTS = {
    PLAY: 1,
    PAUSE: 2,
    NEXT: 3,
    PREV: 4,
    TOGGLE: 5
}
