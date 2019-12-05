import axios from 'axios';
import { Platform } from 'react-native';

import Media from '../../../react-native-media-player';
import BackgroundTimer from 'react-native-background-timer';
import MediaControlsIOS from '../../../react-native-media-controls-ios';
import Toast from 'react-native-root-toast';
import AVPlayer from '../../../react-native-avplayer';

const RNFS = require('react-native-fs');

/*
* ----------------------------
* Instância principal do player offline [Player]
* ----------------------------
*/

export class PlayerOffline {

    constructor() {
        // PlayerManager é o controlador de todos os players
        this.instance = new PlayerManagerOffline();
    }

    prepare() {this.instance && this.instance.prepare()}

    stop() {this.instance && this.instance.stop()}

    play() {this.instance && this.instance.play()}

    destroy() {this.instance && this.instance.destroy()}

    onNext(cb) {this.instance && this.instance.onNext(cb)}

    onPrev(cb) {this.instance && this.instance.onPrev(cb)}

    getState() {return this.instance ? this.instance.getState() : false}

    setFileAudio(source) {this.instance && this.instance.setFileAudio(source)}

    setTrimAudio(value) {this.instance && this.instance.setTrimAudio(value)}

    onError(cb) {this.instance && this.instance.onError(cb)}

    onStateChanged(cb) {this.instance && this.instance.onStateChanged(cb)}

    setMetadata(data) {this.instance && this.instance.setMetadata(data)}

	setVolume(volume) {this.instance && this.instance.setVolume(volume)}

}

/*
* ----------------------------
* Controlador do player offline [PlayerManagerOffline]
* ----------------------------
*/

class PlayerManagerOffline {

    // Construtor para inicia as variáveis
    constructor(defaultType) {
        this.state = false;
        this.stateEmitter = false;
        this.currentSource = false;
        this.currentSeekTo = false;
        this.currentModule = false;
        this.cbState = false;
        this.cbError = false;
        this.cbNext = false;
        this.cbPrev = false;
        this.error   = false;
    }

    // Método para pausar o áudio
    stop() {
        this.currentModule && this.currentModule.stop();
    }

    // Método para tocar o áudio
    play() {
        if (this.currentModule) {
            this.currentModule.play(this.currentSource);
        } else {
            this.prepareAndPlay();
        }
    }

    // Método para destruir o player
    destroy() {
        this.currentModule && this.currentModule.destroy();
    }

    // Método que prepara o player
    prepare() {
        // Limpar os valores iniciais
        this.cleanValues();
        // Função para instanciar o modulo correto de acordo com o tipo da streaming
        this.setCurrentModuleByType();
        // Caso tenha error, envia um evento para o player
        if (this.error) {
            PlayerManagerOffline.triggerEvents(this.error, this.cbError);
            this.cleanValues();
        }
    }

    // Função para retornar a posição da música
    getPosition() {
        if (this.currentModule) {
            return this.currentModule.getPosition();
        }
    }

    // Função que prepara o player e toca
    prepareAndPlay() {
        this.prepare();
        if (!this.error) this.play();
    }

    // Função para limpar as variáveis
    cleanValues() {
        this.error = false;
        this.state = false;
        if (this.currentModule) this.currentModule.destroy();
        this.currentSource = false;
        this.currentSeekTo = false;
        this.currentModule = false;
    }

    // Função para enviar o source file
    setFileAudio(source) {
        if (source) {
            this.currentSource = source;
        } else {
            this.error = ERROR_TYPES.INVALID_SOURCE;
            PlayerManagerOffline.triggerEvents(this.error, this.cbError);
        }
    }

    // Função para enviar o source file
    setTrimAudio(value) {
        this.currentSeekTo = value;
    }

    // Função para colocar informações do que está tocando no celular
    setMetadata(data) {
        if (data && Object.keys(data)) {
            this.mediaControls && this.mediaControls.updateMetas(data);
        }
    }

    // Função para obter o source que deve ser tocado
    getCurrentSource() {
        let ret = false;
        if (this.currentSource) {
            ret = this.currentSource;
        } else {
            this.error = ERROR_TYPES.INVALID_SOURCE;
        }
        return ret;
    }

    // Função para obter os eventos do player
    onStateChanged(cb) {this.cbState = cb;}

    // Função para obter os eventos de error do player
    onError(cb) {this.cbError = cb;}

    onNext(cb) { this.cbNext = cb; }

    onPrev(cb) { this.cbPrev = cb; }

    // Função responsável por enviar os eventos
    static triggerEvents(data, cb) {
        cb && cb(data);
    }

    // Função para obter o status do player
    getState() { return this.state; }

    // Função que instância o módulo correto do player
    setCurrentModuleByType() {
        if (Platform.OS === "ios") {
            this.currentModule = new MediaPlayerIOSOfflineModule(this);
            this.mediaControls = new MediaControlsIOS(this.onMediaControlsEvent.bind(this));
        } else {
            this.currentModule = new MediaPlayerOfflineModule(this);
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
                PlayerManagerOffline.triggerEvents(false, this.cbNext);
            break;
            case MEDIA_CONTROLS_EVENTS.PREV:
                PlayerManagerOffline.triggerEvents(false, this.cbPrev);
            break;
        }
    }
}

/*
* ----------------------------
* Módulos existentes do player [AVPlayerOfflineModule, MediaPlayerOfflineModule]
* ----------------------------
*/


// Módulo para tocar arquivo no device IOS
class MediaPlayerIOSOfflineModule {

    constructor(PlayerManager) {
        this.self = PlayerManager;
        this.instance = false;
        this.source = false;
        this.type = false;
        this.retryStation = false;
        this.userPaused = false;
    }

    // Função rensponável por tocar o áudio
    play(source, type) {
        this.source = source;
        this.type = type;

        if (this.source) {
            if (this.instance && this.source != this.instance.src) {
                this.released = true;
                this.instance.release();
                this.instance = false;
            }
            if (!this.instance) {
                this.instance = new AVPlayer(this.source, this.onStateChanged.bind(this), this.onDelay.bind(this), this.onError.bind(this));
            }
        }
        this.instance.playOffline();
    }

    // Função rensponável por pausar o áudio
    stop() {
        this.userPaused = true;
        this.instance && this.instance.stop();
    }

    // Função rensponável por destruir o player
    destroy() {
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManagerOffline.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
        this.instance && this.instance.release();
    }

    // Função para retornar a posição da música
    getPosition() {
        if (this.instance) {
            return this.instance.getPosition();
        }
    }

    // Offline não precisa do delay
    onDelay() {}

    // Função para cuidar dos erros do player
    onError(status) {
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManagerOffline.triggerEvents(STATE_TYPE.STOPPED, this.self.cbError);
    }

    // Funçnao para escutar eventos do player
    onStateChanged(state) {
        state = Number(state);
        switch (state) {
            // Evento do buffer
            case STATE_TYPE.STARTING: {
                this.self.state = STATE_TYPE.STARTING;
                PlayerManagerOffline.triggerEvents(STATE_TYPE.STARTING, this.self.cbState);
            } break;
            // Evento que está pronto para tocar
            case STATE_TYPE.READY: {
                // Corte inicial
                if (this.self.currentSeekTo) {
                    this.instance.seekTo(this.self.currentSeekTo.toString());
                }
            } break;
            // Evento que começou a tocar
            case STATE_TYPE.RUNNING: {
                this.self.state = STATE_TYPE.RUNNING;
                PlayerManagerOffline.triggerEvents(STATE_TYPE.RUNNING, this.self.cbState);
                this.retryStation = false;
                this.userPaused = false;
            } break;
            // Evento que parou de tocar
            case STATE_TYPE.STOPPED: {
                this.self.state = STATE_TYPE.STOPPED;
                PlayerManagerOffline.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
            } break;
            // Evento que acabou a música
            case STATE_TYPE.ENDED: {
                this.self.state = STATE_TYPE.ENDED;
                PlayerManagerOffline.triggerEvents(STATE_TYPE.ENDED, this.self.cbState);
            } break;
            // Evento quando der algum problema
            case STATE_TYPE.ERROR: {
                this.onError();
            }
        }
    }
}

class MediaPlayerOfflineModule {

    constructor(PlayerManagerOffline) {
        this.self = PlayerManagerOffline;
        this.instance = false;
        this.source = false;
        this.userPaused = false;
		this.volumeFade = 0;
    }

	// Método controlador de volume
	setVolume(volume) {
		if (this.currentModule) {
            return this.currentModule.setVolume(volume);
        }
	}

    // Função rensponável por tocar o áudio
    play(source) {
        this.source = source;

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
		this.instance.setVolume(0);
    }

    // Função rensponável por pausar o áudio
    stop() {
        this.instance && this.instance.pause();
    }

    // Função rensponável por destruir o player
    destroy() {
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManagerOffline.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
		this.instance && this.instance.release();
    }

    // Função para cuidar dos erros do player
    onError() {
        this.self.state = STATE_TYPE.STOPPED;
        PlayerManagerOffline.triggerEvents(STATE_TYPE.STOPPED, this.self.cbError);
    }

	// Método responsavel por setar o volume
	volumeController() {
		if (this.volumeFade >= 0 && this.volumeFade < 0.99) {
			BackgroundTimer.setTimeout(() => {
				this.volumeFade += 0.02;
				this.instance.setVolume(this.volumeFade);
				this.volumeController();
			}, 15);
		}
	}

    // Funçnao para escutar eventos do player
    onStateChanged(state) {
        state = Number(state);
        switch (state) {
            // Evento do buffer
            case STATE_TYPE.STARTING: {
				// Seta o volume fade para 0
				this.volumeFade = 0;

                this.self.state = STATE_TYPE.STARTING;
                PlayerManagerOffline.triggerEvents(STATE_TYPE.STARTING, this.self.cbState);
            } break;
            // Evento que está pronto para tocar
            case STATE_TYPE.READY: {
                // Corte inicial
                if (this.self.currentSeekTo) {
					// TODO: SeekTo do Android desligado temporariamente até saber do problema que não funciona direito
                    // this.instance.seekTo(parseInt(this.self.currentSeekTo * 1000));
                }
            } break;
            // Evento que começou a tocar
            case STATE_TYPE.RUNNING: {
				// Seta o volume fade para 0
				this.volumeFade = 0;

                // Corte inicial
                this.self.state = STATE_TYPE.RUNNING;
                PlayerManagerOffline.triggerEvents(STATE_TYPE.RUNNING, this.self.cbState);

				// Chama o Método de fade do volume
				this.volumeController();
            } break;
            // Evento que parou de tocar
            case STATE_TYPE.STOPPED: {
                this.self.state = STATE_TYPE.STOPPED;
                PlayerManagerOffline.triggerEvents(STATE_TYPE.STOPPED, this.self.cbState);
            } break;
            // Evento que acabou a música
            case STATE_TYPE.ENDED: {
                this.self.state = STATE_TYPE.ENDED;
                PlayerManagerOffline.triggerEvents(STATE_TYPE.ENDED, this.self.cbState);
            } break;
            // Evento quando der algum problema
            case STATE_TYPE.ERROR: {
                this.onError();
            }
        }
    }
}

/*
* ----------------------------
* Constantes existentes do player [ERROR_TYPES, STATE_TYPE, MEDIA_CONTROLS_EVENTS]
* ----------------------------
*/

export const ERROR_TYPES = {
    INVALID_SOURCE: 99,
    ERROR_SOURCE: 98
}

export const STATE_TYPE = {
    STARTING: 1,
    RUNNING: 2,
    STOPPED: 3,
    ERROR: 4,
    ENDED: 6,
    READY: 7
}

export const MEDIA_CONTROLS_EVENTS = {
    PLAY: 1,
    PAUSE: 2,
    NEXT: 3,
    PREV: 4,
    TOGGLE: 5
}
