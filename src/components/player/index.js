import React, { Component } from 'react';
import { AppState, Text, AsyncStorage, Alert, PermissionsAndroid, Share, Easing, View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated, PanResponder, Image, TouchableWithoutFeedback, Platform, BackHandler} from 'react-native';
import { connect } from 'react-redux';
import Toast from 'react-native-root-toast';
import axios from 'axios';
import EventManager from '../containers/EventManager';
import BackgroundTimer from 'react-native-background-timer';
import Chromecast from '../../../react-native-chromecast';
import PlayerHandler from '../../../react-native-player-handler';
import Widget from '../../../react-native-widget';
import { toggleRecording, setPlayerStatus, setPlayingSong, setNextSongList, followStation, unfollowStation, initPlayer, setCastSession } from '../../actions';
import PlayButton from '../containers/PlayButton';
import { RecordingManager } from '../containers/StreamRecorder';
import StatusBarHeight from '../containers/StatusBarHeight';
import { StreamRecorder } from '../containers/StreamRecorder';
import Subtitles from '../containers/Subtitles';
import BottomSheet from '../containers/BottomSheet';
import Tabs from '../containers/Tabs';
import { StationTile } from '../containers/StationTile';
import Loader from '../containers/Loader';
import Icon from '../containers/Icon';
import IconButton from '../containers/IconButton';
import { STATE_TYPE } from '../containers/Player';
import { PLAYER_TYPES } from './PlayerController';
import PlayingSong from './PlayingSong';
import NextSong from './NextSong';
import Short from './Short';
import Header from './Header';
import StationImage from './StationImage';
import StationName from './StationName';
import StationSong from './StationSong';
import ProgressContainer from './ProgressContainer';
import InfoTabs from './InfoTabs';
import Lyrics from './Lyrics';
import LastPlayedSong from'./LastPlayedSong';
import SleepModal from '../containers/SleepModal';
import LocalNotification from '../containers/LocalNotification';


const stationPlaceholder = require('../../img/station_placeholder.png');

const { width, height } = Dimensions.get('screen');

const SHORT_PLAYER_SHADOW = 10;
const SHORT_PLAYER_HEIGHT = 45;
const SHORT_PLAYER_SIZE = SHORT_PLAYER_HEIGHT + SHORT_PLAYER_SHADOW;
const TABS_HEIGHT = 45;

const REPEAT_STATE = {
	'ALL': 2,
	'ONE': 3
};

const Sound = require('react-native-sound');
const nextSound = new Sound('next.mp3', Sound.MAIN_BUNDLE, (error) => {
	if (Platform.OS === 'android' && error) {
		EventManager.trackEvent({ action: 'sound_effect_error', category: 'Player' });
		return;
	}
});

const backgroundBlur = Platform.OS === 'android' ? 2 : 5;
let WAS_PLAYING = false;
let NOTIFICATION_STATE = '';

class Player extends Component {
	constructor(props) {
		super(props);

		this.state = {
			relatedRendered: false,
			lastPlayed: [],
			likeAction: false,
			lockDrag: false,
			repeat: REPEAT_STATE.ALL,
            bodyTranslate: new Animated.Value(height + SHORT_PLAYER_SIZE),
			pan: new Animated.ValueXY(),
			tabsTranslate: new Animated.Value(0),
      		likeAnimation: new Animated.Value(0),
			sleepTime: null,
			showLyrics: false,
			lyrics: {},
			subtitles: [],
			appState: AppState.currentState
        };

        // Variavel que controla o retorno da navegação
        this._navigatorPop = this.navigatorPop.bind(this);
        this._openPlayer = this.openPlayer.bind(this);

		// Variável que controla animação do botão de gravar
        this._recordingOpacity = new Animated.Value(1);
		this._isPulsing = false;

		// Variável que controla a animação de mostrar a letra da música
		this._lyricsAnimation = {
			scale: new Animated.Value(1),
			opacity: new Animated.Value(1),
			rotation: new Animated.Value(0)
		};
		this._lyricsAnimation.spin = this._lyricsAnimation.rotation.interpolate({
			inputRange: [0, 1],
			outputRange: ['0deg', '90deg']
		})

		// Variável que controla o tempo da música do offline
		this.currentTimeOffline = false;
		this.intervalCurrentTimeOffline = false;
		this.notificationTimeout = false;

		this.openedLastStation = false;

		//Variavel que controla a atualização da estação vinda do chromecast
		this.chromecastStationTimeout = false;

		this._isShortOpened = false;
		this._gotLastPlayed = false;

		// Guarda o último metadata que veio do streaming
		this._lastMetadata = false;

		this._listenTimeout;
		this._listenTime;
		this._playingSong;
		this._playerIndex = 0;
		this._state = STATE_TYPE.STOPPED;
		this._nextPreviousIndex = 0;
		this._nextPreviousList = [];
		this._notificationTimeout = null;
		this._mediaButtonCount = 0;
		this._playAndRec = false;
		this._recGranted = false;

		this._recBackgroundTimer = null;

		this._sleepTime = null; // Objeto com as informações do modo soneca

		if (Platform.OS === 'android') this.setAndroidNotificationEvents();
	}

	componentWillMount() {
		const { bodyTranslate } = this.state;

		// Seta a animação da opacidade do player baseada no "translate"
		this.setState({
            tabsTranslate: bodyTranslate.interpolate({
                inputRange: [0, height - TABS_HEIGHT - SHORT_PLAYER_SIZE],
                outputRange: [SHORT_PLAYER_HEIGHT + 5, 0],
                extrapolate: 'clamp',
            })
        });

		this.setPanResponder();
		if(Platform.OS === 'android') this.setChromecastEvents();
	}

	componentWillUnmount() {
		AppState.removeEventListener('change', this._handleAppStateChange);
		BackHandler.removeEventListener('hardwareBackPress', this._closePlayer);
	}

	_handleAppStateChange = (nextAppState) => {
		if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
			// App voltou para foreground
			const { playingSong } = this.props;
			if (playingSong && playingSong.title && playingSong.title.id && (!this.state.lyrics || !this.state.lyrics.text || this.state.lyrics.id !== playingSong.title.id)) {
				this.getLyricsAndSubtitle(playingSong);
			}
		}
		this.setState({ appState: nextAppState });
	}

	componentWillReceiveProps(nextProps) {
		const { isRecording, instance, lastStation, sleepTime, cast, playerInfo, playingSong, status, playerType, recordingFile } = nextProps;
		const player = this.props.instance;


		if (!this.props.playerInfo.id && playerInfo.id && !this._isShortOpened) this.openShortPlayer();

		if (this.props.playerInfo.id !== playerInfo.id) {
			// Animação do short player quando troca de estação
			if (this.state.bodyTranslate._value === height) {
				setTimeout(() => {
					this.animateShortPlayer();
				}, 200);
			}

			if (playerType === PLAYER_TYPES.OFFLINE && playerType !== this.props.playerType) {
				// Caso trocou de estação mas o tipo estava diferente, cria a nova lista de navegação
				this.buildNavigateList({ playerInfo, playerType, recordingFile });
			} else if (playerType !== PLAYER_TYPES.OFFLINE) {
				// Timeout apenas para ter tempo de ter todas as estações carregadas no primeiro carregamento
				setTimeout(() => {
					this.buildNavigateList({ playerInfo, playerType });
				}, 200);
			}

			this._gotLastPlayed = false;

			this.setState({ lastPlayed: [], lyrics: {}, subtitles: [], relatedRendered: false, likeAction: false });
			this.setRecorder({ playerInfo, playerType, player: instance });
		} else if (playerType !== this.props.playerType) {
			// Caso a estação não trocou mas trocou o tipo do player
			switch (playerType) {
				case PLAYER_TYPES.CHROMECAST:
				case PLAYER_TYPES.STREAM:
					this.setState({ lastPlayed: [], lyrics: {}, subtitles: [], relatedRendered: false, likeAction: false });
					this.setRecorder({ playerInfo, playerType, player: instance });
					this.buildNavigateList({ playerInfo, playerType });
					break;
				case PLAYER_TYPES.OFFLINE:
					this.buildNavigateList({ playerInfo, playerType, recordingFile });
					break;
				default:

			}
		}


		if ((this.props.isRecording !== isRecording) || (this.props.playerType !== playerType)) {

			this.updateNotification({ playerInfo, playingSong, playerState: status, isRecording, playerType });
		}

		if(status !== this.props.status && status !== -1){
			this.updateNotification({ playingSong, playerInfo, playerState: status, isRecording, playerType });
		}

		if (this.props.playingSong.title.id !== playingSong.title.id) {
			const player = this.props.instance;
			const lastPlayed = [...this.state.lastPlayed];
			// Atualiza a notificação com a música nova
			if (playingSong.title.id) {
				this.updateNotification({ playingSong, playerInfo, playerState: status, isRecording, playerType });
			}

			// Insere na lista de últimas tocadas
			if (playingSong.title.id) {
				if (lastPlayed.length && lastPlayed[0].title.id !== playingSong.title.id) {
					lastPlayed.unshift(playingSong);
				}
			}

			// Limpa a ação do like
			this.setState({ likeAction: false, lastPlayed, lyrics: {}, subtitles: [] });
			// Atualiza a música da gravação (caso esteja gravando)
			this.setRecorderSong(playingSong);
		}

		if (instance && instance !== this.props.instance) {
			this.setPlayerEvents(instance, playerType);
		}

		if (!this.openedLastStation && lastStation !== this.props.lastStation) {
			this.openedLastStation = true;
			setTimeout(() => {
				if (playerInfo && !playerInfo.id) {
					this.props.initPlayer({ playerInfo: lastStation, playerType: PLAYER_TYPES.STREAM, autoplay: false });
				}
			}, 200);
		}

		if (isRecording && !this._isPulsing) {
			this.pulseRecording();
		} else if (!isRecording && this._isPulsing) {
			this.stopPulseRecording();
		}
	}

	get playerIndex() {
        return this._playerIndex;
    }

	set playerIndex(index) {
		const { pan, lastPlayed } = this.state;
		const { playerType } = this.props;
        const newIndex = Math.min(Math.max(index, 0), 1);
		const { scrollPlayedSongsList, scrollRelatedList } = this.refs;

		switch (index) {
			case 0:
				this.setState({ lockDrag: false });
				if(this.infoTabs && scrollPlayedSongsList != null && scrollRelatedList != null) {
				  // Seta o select das tabs para 0 e reseta a posição do scrollview
					  this.infoTabs.onPageSelected(0);
					  this.infoTabs.setPos(0);

					  this.refs.scrollPlayedSongsList.scrollTo({ x: 0, y: 0 });
					  this.refs.scrollRelatedList.scrollTo({ x: 0, y: 0 });
				}
				break;
			case 1:
				this.setState({ lockDrag: true });
			default:

		}

        if (index === 1 && !this._gotLastPlayed && playerType === PLAYER_TYPES.STREAM) {
            this.getLastPlayed();
			this.getNextSongs();
        }

        this._playerIndex = newIndex;
        Animated.timing(pan, {
            toValue: { x: 0, y: -(newIndex * height) },
            duration: 200
        }).start();
    }

	updateNotification({ playingSong, playerInfo, playerState, isRecording, playerType }) {

		const player = this.props.instance;

		// Caso exista o player e a função para atualizar a notificação
		if (player && player.instance && player.updateNotification) {
			player.updateNotification({ playingSong, playerInfo, playerState, isRecording, playerType });
		}
	}

	setChromecastEvents() {

		// Fallback quando o @link (Chromecast.setSessionStatus()) não é iniciado por algum motivo desconhecido.
		Chromecast.connectionStatus((castStatus) => {
			const { cast, playerInfo, status } = this.props;
			if (cast.session === '') {
				this.props.setCastSession(castStatus);
				switch(castStatus) {
					case 'CONNECTED':
						if (playerInfo && playerInfo.id) {
							const autoplay = status === STATE_TYPE.RUNNING;
							this.props.initPlayer({ playerInfo, playerType: PLAYER_TYPES.CHROMECAST, autoplay });
						}
						break;
				}
			}
		});

		Chromecast.setSessionStatus((session) => {
			const { cast, status, playerInfo } = this.props;
			if (cast.session != session) {
				this.props.setCastSession(session);
				switch(session) {
					case 'onSessionStarted':
					case 'onSessionResumed':
						const autoplay = status === STATE_TYPE.RUNNING;
						// Caso tenha estação no player
						if (playerInfo && playerInfo.id) {
							this.props.initPlayer({ playerInfo, playerType: PLAYER_TYPES.CHROMECAST, autoplay });
						}
						break;
					case 'onSessionStartFailed':
						Toast.show("Não foi possivel realizar a conexão com o Chromecast");
						break;
					case 'onSessionResumeFailed':
						Toast.show("Não foi possivel retomar a conexão com o Chromecast");
						break;
					case 'onSessionEnded':
						if (playerInfo && playerInfo.id) {
							this.props.initPlayer({ playerInfo, playerType: PLAYER_TYPES.STREAM, autoplay: false });
						}
						break;
				}
			}
		});

		Chromecast.getMusic((res) => {
			const music = JSON.parse(res);
			const { playingSong, playerInfo, status } = this.props;

			const durationChanged = playingSong.duration !== music.duration;
			const positionChanged = playingSong.position !== music.position;
			const songChanged = playingSong.title.id !== music.title.id;

			if (music && songChanged || durationChanged || positionChanged) {
				this.props.setPlayingSong(music);
			}
		});

		Chromecast.getStation((res) => {
			const { playerInfo, status } = this.props;
			const station = JSON.parse(res);
			const autoplay = status === STATE_TYPE.RUNNING;

			BackgroundTimer.clearTimeout(this.chromecastStationTimeout);
			this.chromecastStationTimeout = BackgroundTimer.setTimeout(() => {
				if (station && playerInfo.id !== station.id) {
					this.props.initPlayer({ playerInfo: station, playerType: PLAYER_TYPES.CHROMECAST, autoplay });
				}
			}, 300);
		});
	}

	openShortPlayer() {
		const { bodyTranslate } = this.state;
		this._isShortOpened = true;

		Animated.timing(bodyTranslate, {
			toValue: height,
			duration: 500
		}).start();
	}

	setAndroidNotificationEvents() {
		PlayerHandler.subscribe((e) => {
			const { status, playerType, isRecording } = this.props;
			const player = this.props.instance;

			if (!player) return;

			NOTIFICATION_STATE = e;
			BackgroundTimer.clearTimeout(this._notificationTimeout);
			switch (e) {
				case 'NOTIFICATION_REC':
					if (playerType !== PLAYER_TYPES.STREAM) break;
					this.toggleRecording();
					break;
				case 'MEDIA_BUTTON':
					if (playerType === PLAYER_TYPES.CHROMECAST) break;
					this._mediaButtonCount++;

					this._notificationTimeout = BackgroundTimer.setTimeout(() => {
						if (this._mediaButtonCount >= 2) {
							BackgroundTimer.setTimeout(() => {
								nextSound.play();
							}, 50);

							if (this.props.isRecording) this.stopRecording();
							this.navigateStation({ nextPrevious: 'next' });
						} else if (status !== STATE_TYPE.STOPPED) {
							player.stop();

						} else {
							player.play();
						}
						this._mediaButtonCount = 0;
					}, 300);
					break;

				case 'NOTIFICATION_PLAY':
					player.play();
					break;

				case 'AUDIOFOCUS_LOSS':
					if (playerType === PLAYER_TYPES.CHROMECAST) break;
					player.stop();
					break;

				case 'NOTIFICATION_STOP':
				case 'NOTIFICATION_PAUSE':
					if (playerType === PLAYER_TYPES.STREAM && isRecording) this.toggleRecording();
					player.stop();
					break;

				case 'NOTIFICATION_NEXT':
					if (this.props.isRecording) this.stopRecording();
					this._notificationTimeout = BackgroundTimer.setTimeout(() => {
						this.navigateStation({ nextPrevious: 'next' });
					}, 200);
					break;

				case 'NOTIFICATION_PREVIOUS':
					if (this.props.isRecording) this.stopRecording();
					this._notificationTimeout = BackgroundTimer.setTimeout(() => {
						this.navigateStation({ nextPrevious: 'previous' });
					}, 200);
					break;

				default:
				case 'AUDIOFOCUS_GAIN':
				case 'CALL_STATE_OFF':
					if (playerType === PLAYER_TYPES.CHROMECAST) break;

					if ((status !== STATE_TYPE.RUNNING || status !== STATE_TYPE.STARTING) && (WAS_PLAYING)) {
						player.play();
						WAS_PLAYING = false;
					}
					break;

				case 'AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK': // ENVIADO QUANDO OUVE ALGUMA COISA (EX AUDIO DO WHATSAPP, AUDIO DE NOTIFICAÇÃO)
				case 'BECOMING_NOISY':
				case 'CALL_STATE_ON':
					if (playerType === PLAYER_TYPES.CHROMECAST) break;

					if((status === STATE_TYPE.RUNNING || status === STATE_TYPE.STARTING)) {
						player.stop();
						WAS_PLAYING = true;
					}
					break;
				case 'SERVICE_DESTROY':
					player.destroy();
				break;
			}
		});

		Widget.subscribe((e) => {
			const player = this.props.instance;
			if (!player) return;

			switch(e) {
				case 'WIDGET_PLAY_MUSIC':
					player.play();
					break;
				case 'WIDGET_PAUSE_MUSIC':
				case 'WIDGET_STOP_MUSIC':
					player.stop()
					break;
				case 'WIDGET_PREVIOUS_MUSIC':
					this.navigateStation({ nextPrevious: 'next' });
					break;
				case 'WIDGET_NEXT_MUSIC':
					this.navigateStation({ nextPrevious: 'previous' });
					break;
				default:
			}
		});
	}

	buildNavigateList({ playerInfo, recordingFile, playerType }) {
		const { allStations, followingStations } = this.props;
		// Monta a lista de estações que o usuário vai navegar
		switch (playerType) {
			case PLAYER_TYPES.STREAM:
			case PLAYER_TYPES.CHROMECAST:
				if (playerInfo && playerInfo.id) {
					if (followingStations instanceof Array && followingStations.length &&
							followingStations.length >= 2 &&
							followingStations.findIndex((station) => station.id === playerInfo.id) !== -1) {
						// Navega pela estações que o usuário segue
						this._nextPreviousList = followingStations;
						this._nextPreviousIndex = followingStations.findIndex((station) => station.id === playerInfo.id);
					} else {
						// Navega por todas as estações
						this._nextPreviousList = allStations;
						if (this._nextPreviousList instanceof Array) {
							this._nextPreviousIndex = this._nextPreviousList.findIndex((station) => station.id === playerInfo.id);
						}
					}
				}
				break;
			case PLAYER_TYPES.OFFLINE:
				RecordingManager.listRecordingsComplete(allStations)
				.then(recordings => {
					if (recordings) {
						this._nextPreviousList = recordings;
						this._nextPreviousIndex = recordings.findIndex((recording) => recording.id === recordingFile.id);
					} else {
						this._nextPreviousList = [];
						this._nextPreviousIndex = 0;
					}
				})
				.catch(err => {
					this._nextPreviousList = [];
					this._nextPreviousIndex = 0;
				});
				break;
			default:

		}
	}

	navigateStation({ nextPrevious, endedSong }) {
		const { playerType, playingSong, playerInfo } = this.props;
		switch (playerType) {
			case PLAYER_TYPES.STREAM:
			case PLAYER_TYPES.CHROMECAST:
				if (!this._nextPreviousList) this._nextPreviousList = [];

				if (nextPrevious === 'next') {
					this._nextPreviousIndex++;
					if (this._nextPreviousList && this._nextPreviousIndex >= this._nextPreviousList.length) this._nextPreviousIndex = 0;
				} else if (nextPrevious === 'previous') {
					this._nextPreviousIndex--;
					if (this._nextPreviousList && this._nextPreviousIndex < 0) this._nextPreviousIndex = this._nextPreviousList.length - 1;
				}

				if (playingSong && playingSong.title && playingSong.title.id) {
					// Pegando o current time da música
			        const duration = new Date(playingSong.tsEnd - playingSong.tsStart);
			        let time = new Date(duration - (playingSong.tsEnd - Date.now()));
			        time = time.getTime() / 1000;

			        const obj = { type: 'skip', ts: time };

					// Enviar o evento de skip da música
					axios
	                .post(`https://api.vagalume.fm/v2/${playerInfo.id}/${playingSong.title.id}/rate`, obj)
	                .catch(() => {
	                    // Erro de requisição
	                });
				}

				const station = this._nextPreviousList[this._nextPreviousIndex];
				if (station) this.props.initPlayer({ playerInfo: station, playerType: playerType, autoplay: true });
				break;
			case PLAYER_TYPES.OFFLINE:
				const { repeat } = this.state;
				if (!this._nextPreviousList) this._nextPreviousList = [];

				if (nextPrevious === 'next') {
					if (endedSong) {
						// Passa para o próximo index se não repetir a mesma música
						if (repeat !== REPEAT_STATE.ONE) this._nextPreviousIndex++;


						if (this._nextPreviousList && this._nextPreviousIndex >= this._nextPreviousList.length) {
							if (repeat === REPEAT_STATE.ALL) {
								// Volta para o início da lista
								this._nextPreviousIndex = 0;
							}
						}
					} else {
						// Verifica se estava ligado o repeat para desativar
						if (repeat === REPEAT_STATE.ONE) this.setState({ repeat: REPEAT_STATE.ALL });
						this._nextPreviousIndex++;
						if (this._nextPreviousList && this._nextPreviousIndex >= this._nextPreviousList.length) this._nextPreviousIndex = 0;
					}
				} else if (nextPrevious === 'previous') {
					this._nextPreviousIndex--;
					if (this._nextPreviousIndex < 0) this._nextPreviousIndex = this._nextPreviousList.length - 1;
				}

				const recording = (this._nextPreviousList && this._nextPreviousList.length) ? this._nextPreviousList[this._nextPreviousIndex] : null;
				if (recording && recording.station) this.props.initPlayer({ playerInfo: recording.station, playerType: PLAYER_TYPES.OFFLINE, autoplay: true, recordingFile: recording });
				break;
			default:
		}
	}

	pulseRecording() {
		this._isPulsing = true;
		this.pulse();
	}

	stopPulseRecording() {
		this._isPulsing = false;
		this._recordingOpacity.stopAnimation();
		this._recordingOpacity.setValue(1);
	}

	pulse() {
		Animated.sequence([
			Animated.timing(this._recordingOpacity,
				{
					toValue: 0.2,
					duration: 1000
				}
			),
			Animated.timing(this._recordingOpacity,
				{
					toValue: 1,
					duration: 1000
				}
			)
		]).start(() => {
			if (!this._isPulsing) return;
			this.pulse();
		});
	}

	recorderCallback(status, error) {

		switch (status) {
			case 'RECORDING_START':
				this.props.toggleRecording(Date.now());
				break;
			case 'RECORDING_STOP':
				this.props.toggleRecording(false);
				break;
			case 'RECORDING_ERROR':
				this.stopRecording();
				this.props.toggleRecording(false);
				if (error) {
					// Mostrar mensagem somente se o usuário estiver com o celular ativo
					if (AppState.currentState == "active") {
						Toast.show(error);
					}
				}
				break;
			case 'RECORDING_SUCCESS':
				// Mostrar mensagem somente se o usuário estiver com o celular ativo
				if (AppState.currentState == "active") {
					Toast.show("Gravação concluída com sucesso!");
				}
			default:
		}
	}

	setRecorderSong(song) {
		if (!this._recorder || !this._recorder._enabled) return;
		this._recorder.setSong(song);
	}

	setRecorder({ playerInfo, playerType, player }) {
		// Caso não seja player do tipo streaming ou não venha nenhum player, retorna
		if (playerType !== PLAYER_TYPES.STREAM || !player || !playerInfo || !playerInfo.id) return;
		// Verifica se já existe um recorder
		if (this._recorder) {
			const { instance } = player;
			if (instance) {
				const promise =  instance.getPosition();
				if (promise) {
					promise.then(position => {
						this._recorder.stop(position);
						this._recorder = null;
						this._recorder = new StreamRecorder(playerInfo, this.recorderCallback.bind(this));
					})
					.catch(err => {
						this._recorder = null;
						this._recorder = new StreamRecorder(playerInfo, this.recorderCallback.bind(this));
					});
				} else {
					this._recorder = null;
					this._recorder = new StreamRecorder(playerInfo, this.recorderCallback.bind(this));
				}
			}
		} else {
			this._recorder = null;
			this._recorder = new StreamRecorder(playerInfo, this.recorderCallback.bind(this));
		}
	}

	requestRecPermission(callback) {
		// TODO: Depois remover timeout de teste de permissão
		BackgroundTimer.setTimeout(async () => {
			if (!this._recGranted && Platform.OS === 'android' && Platform.Version >= 23) {
				try {
					const granted = await PermissionsAndroid.requestMultiple(
						[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE],
						{
							'title': 'Acesso à memória do celular',
							'message': 'Para melhor experiência, o Vagalume.FM precisa ' +
								'acessar a memória interna do celular'
						}
					)

					if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
						&& granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED) {
						this._recGranted = true;
						if (callback) callback();

					} else if (granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
						&& granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
						Alert.alert(
							'Acesso a mémoria interna',
							'Ative a permissão de armazenamento (memória) para realizar gravações e ter uma melhor experiência.',
							[
								{
									text: 'Abrir configurações',
									onPress: () => {
										PlayerHandler.openSettings();
									},
									style: 'default'
								}
							]
						);
						this._recGranted = false;
						EventManager.trackEvent({ action: 'request_rec_permission', category: 'Player', params: { type: 'never_ask' } });
					} else {
						Toast.show("O Vagalume.FM precisa de permissão para realizar gravações e rodar em segundo plano.");
						this._recGranted = false;
						EventManager.trackEvent({ action: 'request_rec_permission', category: 'Player', params: { type: 'denied' } });
					}
				} catch (err) {
					Toast.show("Erro ao permitir permissão de acesso à memória.");
					this._recGranted = false;
					EventManager.trackEvent({ action: 'request_rec_permission', category: 'Player', params: { type: 'error', error: err } });
				}
			}
		}, 50);
	}

	startRecording() {
		if (!this._recorder) return;

		// Platform Version 23 = Android 6.0
		if (!this._recGranted && Platform.OS === 'android' && Platform.Version >= 23) {
			this.requestRecPermission(() => {
				this.startRecording();
			});
			return;
		}

		const { status, playerType, playerInfo } = this.props;
		// intace PlayerControllerStream > Player > PlayerManager
		const player = this.props.instance;

		if (player && playerType === PLAYER_TYPES.STREAM && status === STATE_TYPE.RUNNING) {
			const { instance } = player;
			try {
				if (instance) {
					const promise = instance.getPosition();
					if (promise) {
						promise.then(position => {
							if (playerInfo.stream && playerInfo.stream.master && this._lastMetadata) {
								const now = Date.now();
								position = (now - this._lastMetadata.tsStart) / 1000;
							}
							const { playingSong } = this.props;
							const playerManager = instance.instance;
							const { segment } = playerManager;
							this._recorder.start(position, playingSong, segment);
						});
					}
				}
			} catch(e) {
				// TODO: Colocar evento de erro para o Facebook
			}
		} else {
			if (player && playerType === PLAYER_TYPES.STREAM) {
				player.play();
				this.props.toggleRecording(Date.now());
				this._playAndRec = true;
			} else {
				Toast.show("Primeiro coloque para tocar para iniciar sua gravação.");
			}
		}
	}

	stopRecording() {
		if (!this._recorder) return;

		const { status, playerType, playingSong } = this.props;
		const player = this.props.instance;

		if (player && playerType === PLAYER_TYPES.STREAM) {
			const { instance } = player;
			try {
				if (instance) {
					const promise = instance.getPosition();
					if (promise) {
						promise.then(position => {
							this.props.toggleRecording(false);
							this._recorder.stop(position);
						});
					}
				}
			} catch(e) {
				// TODO: Colocar evento de erro para o Facebook
			}
		}
	}

	getNextSongs(playerInfo) {
		playerInfo = playerInfo || this.props.playerInfo;
		const { nextSongList } = this.props;
		const player = this.props.instance;

		if (!playerInfo.id || (nextSongList && nextSongList.length)) return;

        let delay = 0;

		if (player && player.instance) {
			try {
				delay = player.instance.getDelay();
			} catch(e) {
				delay = 0;
			}
		}

		axios.get(`https://api.vagalume.fm/v2/${playerInfo.id}/next?delay=${delay}&count=20`)
        .then(response => {
			const { data } = response;

            if (data && data.content && data.content instanceof Array && data.content.length) {
				let nextSongList = data.content.splice(1, 20);
				nextSongList = nextSongList.map((song) => { return {...song, tsStart: song.tsStart * 1000, tsEnd: song.tsEnd * 1000} });
                this.props.setNextSongList(nextSongList);
            }
        }).catch(error => {
        });
	}

	getLastPlayed(playerInfo) {
		playerInfo = playerInfo || this.props.playerInfo;
		const player = this.props.instance;

		if (!playerInfo.id) return;

        let delay = 0;

		if (player && player.instance) {
			try {
				delay = player.instance.getDelay();
			} catch(e) {
				delay = 0;
			}
		}

		let url = '';
		if (playerInfo.stream && playerInfo.stream.master && this.props.playingSong.title.id) {
			url = `https://api.vagalume.fm/v2/${playerInfo.id}/playing-history?pointerID=${this.props.playingSong.title.id}`;
		} else {
			url = `https://api.vagalume.fm/v2/${playerInfo.id}/playing-history?delay=${delay}`;
		}

        axios.get(url)
        .then(response => {
			const { data } = response;

            if (data && data.history && data.history instanceof Array && data.history.length) {
				this._gotLastPlayed = true;
				let lastPlayed = data.history.splice(0, 20);
				lastPlayed = lastPlayed.map((song) => { return {...song, tsStart: song.tsStart * 1000, tsEnd: song.tsEnd * 1000} });

                this.setState({ lastPlayed });
            }
        }).catch(error => {
        });
    }

	tenMinutesEvent() {
		if (!this._listenTimeout) {
			// Iniciar o timeout
			let time = 600000; // 10 minutos

			if (this._listenTime) {
				const diff = Math.abs(new Date(this._listenTime) - new Date());
				const minutes = Math.floor((diff / 1000) / 60);

				const add = minutes * 60 * 1000;
				if (minutes >= 10) {
					time = 10;
				} else {
					time -= add;
				}
			} else {
				this._listenTime = Date.now();
			}

			this._listenTimeout = BackgroundTimer.setTimeout(() => {
				const { playerType, playerInfo } = this.props;
				let type;

				switch (playerType) {
					case PLAYER_TYPES.STREAM:
						type = 'stream';
						break;
					case PLAYER_TYPES.OFFLINE:
						type = 'recordings';
						break;
					case PLAYER_TYPES.CHROMECAST:
						type = 'chromecast';
						break;
					default:
				}

				if (playerInfo.id) {
					EventManager.trackEvent({ action: 'ten_minute_listen', category: 'Player', params: { station_id: playerInfo.id, event_type: type } });
				}

				BackgroundTimer.clearTimeout(this._listenTimeout);
				this._listenTime = null;
			}, time);
		}
	}

	streamPlayerEvents(state, instance) {
		const { playerInfo, playingSong, playerType } = this.props;
		switch (state) {
			case STATE_TYPE.RUNNING:
				if (this._playingSong) {
					this._playingSong.stop();
					this._playingSong.set({
						player: instance,
						status: state,
						playerInfo,
						setPlayingSong: this.props.setPlayingSong,
						playerType
					});
				}

				// Verifica se é para reproduzir e sair tocando
				if (this._playAndRec) {
					this.startRecording();
					this._playAndRec = false;
				}

				this.tenMinutesEvent();
				break;
			case STATE_TYPE.STOPPED:
			case STATE_TYPE.STARTING:
				// Limpa o timeout do evento de escuta da estação
				BackgroundTimer.clearTimeout(this._listenTimeout);
				this._listenTimeout = null;
				this._lastMetadata = false;

				// Para de fazer a gravação
				if (this.props.isRecording && !this._playAndRec && NOTIFICATION_STATE !== 'AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK' && NOTIFICATION_STATE !== 'AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK') {
					this.stopRecording();
				}

				if (this._playingSong) {
					this._playingSong.stop();
					this._playingSong.set({
						player: instance,
						status: state,
						playerInfo,
						setPlayingSong: this.props.setPlayingSong,
						playerType
					});
				}
				break;
			default:
		}

		if (state === STATE_TYPE.STOPPED) this._playAndRec = false;
	}

	startCurrentTime() {
		BackgroundTimer.clearInterval(this.intervalCurrentTimeOffline);
		let last = Date.now();
		this.intervalCurrentTimeOffline = BackgroundTimer.setInterval(() => {
			const now = Date.now();
			const diff = now - last;
			const { recordingFile } = this.props;

			this.currentTimeOffline += diff / 1000;
			// Controller para trocar o áudio
			if (recordingFile && recordingFile.time && this.currentTimeOffline >= recordingFile.time) {
				this.pauseCurrentTime();
				this.navigateStation({ nextPrevious: 'next', endedSong: true });
			}

			last = now;
		}, 1000);
	}

	pauseCurrentTime() {
		BackgroundTimer.clearInterval(this.intervalCurrentTimeOffline);
	}

	offlinePlayerEvents(state, instance) {
		const { playerInfo, playingSong, playerType, recordingFile } = this.props;
		switch (state) {
			case STATE_TYPE.STOPPED:
			case STATE_TYPE.ENDED:
				this.pauseCurrentTime();
				// Caso não esteja reproduzindo, para o timeout de buscar a música
				if (this._playingSong) {
					this._playingSong.stop();
					this._playingSong.set({
						player: instance,
						status: state,
						playerInfo,
						playerType,
						setPlayingSong: this.props.setPlayingSong,
						currentTimeOffline: this.currentTimeOffline
					});
				}
				break;
			case STATE_TYPE.STARTING:
				this.currentTimeOffline = 1;
				this.pauseCurrentTime();
				break;
			case STATE_TYPE.RUNNING:
				if (this._playingSong) {
					this._playingSong.stop();
				} else {
					this._playingSong = new PlayingSong(instance, state, playerInfo, this.props.setPlayingSong, this.props.playerType);
				}

				this._playingSong.set({
					player: instance,
					status: state,
					playerInfo,
					setPlayingSong: this.props.setPlayingSong,
					playerType,
					currentTimeOffline: this.currentTimeOffline
				});
				this.startCurrentTime();
				this._playingSong.startOffline(recordingFile);

				this.tenMinutesEvent();
				break;
			default:
		}

		if (state === STATE_TYPE.ENDED) {
			this.currentTimeOffline = 1;
			this.navigateStation({ nextPrevious: 'next', endedSong: true });
		}
	}

	setPlayerEvents(player, playerType) {
		const { instance } = player;

		// Caso não exista instância
		if (!instance) {
			// TODO: Colocar evento de instância inexistente
			return;
		}

		instance.onStateChanged((state) => {
			let { playerInfo, playingSong, playerType } = this.props;
			if (state && state !== this._state) {
				this.props.setPlayerStatus(state);
				this._state = state;
				switch (playerType) {
					case PLAYER_TYPES.STREAM:
						this.streamPlayerEvents(state, instance);
						break;
					case PLAYER_TYPES.OFFLINE:
						this.offlinePlayerEvents(state, instance);
						break;
					default:
				}
				NOTIFICATION_STATE = false;

			}
		});

		if (playerType === PLAYER_TYPES.STREAM) {
			instance.onDelay(() => {
				const { status, playerInfo, setPlayingSong, playerType } = this.props;

				// Instancia uma novo timeout de música com o novo delay
				if (this._playingSong) {
					this._playingSong.stop();
				} else {
					this._playingSong = new PlayingSong(instance, this._state, playerInfo, this.props.setPlayingSong, playerType);
				}

				this._playingSong.set({
					player: instance,
					status: STATE_TYPE.RUNNING,
					playerInfo,
					setPlayingSong: this.props.setPlayingSong,
					playerType
				});

				this._playingSong.start();
			});

			instance.onId3Metadata((id3Metadata) => {
				id3Metadata.tsStart = Date.now();

				if (!this._lastMetadata || this.props.nextSongList.length < 2) {
					// Pega a informação da lista de músicas (atual e próximas)
					NextSong.get(this.props.playerInfo.id, id3Metadata)
					.then((songs) => {
						const playingSongIndex = songs.findIndex((song) => song.title.id === id3Metadata.extra.pointerID);
						if (playingSongIndex > -1) {
							songs.splice(playingSongIndex, 1)[0];
						}
						this.props.setNextSongList(songs);
					});
					this.setMetadataInfo(id3Metadata);
				} else if (id3Metadata.extra.pointerID !== this._lastMetadata.extra.pointerID) {
					const songs = [...this.props.nextSongList];
					const playingSongIndex = songs.findIndex((song) => song.title.id === id3Metadata.extra.pointerID);
					if (playingSongIndex > -1) {
						songs.splice(playingSongIndex, 1)[0];
						this.props.setNextSongList(songs);
					}
					this.setMetadataInfo(id3Metadata);
				} else if (id3Metadata.segment !== this._lastMetadata.segment) {
					// Apenas troca o segmento para poder usar na gravação
					this.setMetadataInfo(id3Metadata, true);
				}

				this._lastMetadata = id3Metadata;
			});
		}

		if (Platform.OS === 'ios') {
			instance.onNext(() => {
	            this.navigateStation({ nextPrevious: 'next' });
	        });

	        instance.onPrev(() => {
	            this.navigateStation({ nextPrevious: 'previous' });
	        });
		}
	}

	setMetadataInfo(id3Metadata, isSegmentChange) {
		const playingSong = {};

		playingSong.artist = {
			id: id3Metadata.extra.bandID,
			name: id3Metadata.band,
			url: `https://www.vagalume.com.br/${id3Metadata.band_url}/`,
			slug: id3Metadata.band_url
		};

		playingSong.title = {
			id: id3Metadata.extra.pointerID,
			name: id3Metadata.song,
			url: `https://www.vagalume.com.br/${id3Metadata.band_url}/${id3Metadata.song_url}.html`
		};

		playingSong.img = {
			small: `https://s2.vagalume.com/${id3Metadata.band_url}/images/profile.jpg`,
			medium: `https://s2.vagalume.com/${id3Metadata.band_url}/images/${id3Metadata.band_url}.jpg`
		};

		playingSong.duration = id3Metadata.duration,
		playingSong.duration = id3Metadata.duration * 1000;
		playingSong.position = id3Metadata.time.tsStart * 1000;
		playingSong.tsStart = id3Metadata.tsStart;
		playingSong.tsEnd = id3Metadata.tsStart + (id3Metadata.duration * 1000);
		playingSong.segment = `${id3Metadata.extra.fileID}-${id3Metadata.segment}`;

		if (AppState && AppState.currentState == 'active' && !isSegmentChange) {
			this.getLyricsAndSubtitle(playingSong);
		}

		this.props.setPlayingSong(playingSong);
	}

	getLyricsAndSubtitle(playingSong) {
		if (playingSong && playingSong.title && playingSong.title.id) {
			axios.all([
				axios.get(`https://www.vagalume.com.br/ajax/subtitle-get.php?action=getBestSubtitle&pointerID=${playingSong.title.id}&duration=${playingSong.duration / 1000}`),
				axios.get(`https://api.vagalume.com.br/search.php?musid=${playingSong.title.id}`)
			])
			.then(axios.spread((subtitleRes, lyricsRes) => {
				if (subtitleRes && subtitleRes.data && lyricsRes && lyricsRes.data) {
					const { data } = subtitleRes;
					const lyrics = lyricsRes.data;
					const diff = (data && data.subtitles && data.subtitles.length) ? Math.abs((playingSong.duration / 1000) - data.subtitles[0].len_secs) : 0;

					if (diff <= 5 && data.subtitles && this.props.playerType === PLAYER_TYPES.STREAM) {
						playingSong.subtitles = data.subtitles;
					} else {
						playingSong.subtitles = [];
					}

					if (lyrics && lyrics.mus && lyrics.mus.length) {
						this.setState({ lyrics: lyrics.mus[0], subtitles: playingSong.subtitles });
					} else {
						this.setState({ lyrics: {}, subtitles: [] });
					}
				} else {
					this.setState({ lyrics: {}, subtitles: [] });
				}
			}))
			.catch(err => {
				this.setState({ lyrics: {}, subtitles: [] });
			});
		} else {
			this.setState({ lyrics: {}, subtitles: [] });
		}
	}

	setPanResponder() {
		const TOP = -height;
        const DOWN = 0;
        const PLAYER_LIMIT = height * 0.1;

        let ELEM_POS = null;

		const { playerType } = this.props;
		const { pan } = this.state;
		const moveEvent = Animated.event([
            null, { dx: 0, dy: pan.y },
        ]);

		this.panResponder = PanResponder.create({
			onMoveShouldSetResponderCapture: () => true,
			onMoveShouldSetPanResponderCapture: (e, gestureState) => {
				if (playerType !== PLAYER_TYPES.STREAM) return;
				const sensibility = (Math.abs(gestureState.dy) > 10);
				if (sensibility) return true;
				return false;
			},
			onPanResponderGrant: () => {
				ELEM_POS = this.state.pan.y._value;
			},
			onPanResponderMove: (e, gestureState) => {
				if (this.state.lockDrag || playerType !== PLAYER_TYPES.STREAM) return;
				const dy = Math.max(TOP, Math.min(DOWN, (gestureState.dy + ELEM_POS)));
				const gesture = { dx: 0, dy };
				return moveEvent(e, gesture);
			},
			onPanResponderRelease: (e, gesture) => {
				if (this.state.lockDrag || playerType !== PLAYER_TYPES.STREAM) return;
				if (Math.abs(gesture.dy) > PLAYER_LIMIT) {
					if (gesture.vy > 0) {
						this.playerIndex--;
					} else {
						this.playerIndex++;

						// Enviar evento de abertura
						if (this.playerIndex === 1) EventManager.trackEvent({ action: 'open_player_info', category: 'Player' });
					}
				} else {
					this.playerIndex = this._playerIndex;
				}
			}
		});
	}

	goToRecordings() {
        const { nav } = this.props.navigation.state;
        const currentRoute = nav.routes[nav.index];
        if (currentRoute && currentRoute.routeName !== 'Recordings' && this.props.navigation && this.props.navigation.dispatch) {
            this.props.navigation.dispatch({ type: 'Navigation/NAVIGATE', routeName: 'Recordings' });
        }
        this._closePlayer();
    }

	goStation(stationData) {
		const { navigation, playerInfo } = this.props;
		const { nav } = navigation.state;
		const currentRoute = nav.routes[nav.index];
		let openStation = true;

		if (currentRoute) {
			// Caso já esteja na rota da estação
			if (currentRoute.params && currentRoute.params.stationData && currentRoute.params.stationData.id === stationData.id) {
				openStation = false;
			}
		}

		this.playerIndex = 0;

		setTimeout(() => {
			this._closePlayer();
			setTimeout(() => {
				if (openStation && this.props.navigation && this.props.navigation.dispatch) navigation.dispatch({ type: 'Navigation/NAVIGATE', routeName: 'Station', params: { stationData } });
			}, 200);
		}, 200);
	}

	camelize(str) {
		if (str && typeof str == "string") {
			str = str
			.trim()
			.toLowerCase()
			.replace(/([^A-Za-z\u00C0-\u017F0-9]+)(.)/ig, function () {
				return arguments[2].toUpperCase();
			});
			return str.charAt(0).toUpperCase() + str.slice(1);
		} else {
			return "";
		}
    }

	shareStation() {
		const { playingSong, playerInfo } = this.props;
        const log = { station_id: playerInfo.id, 'From': 'player' };
		const url = `https://vagalume.fm/${playerInfo.slug}/`;

        let content = {};

        if (playingSong.title.id) {
            const { title, artist } = playingSong;

            content = {
                title: 'Vagalume.FM',
                message: `Escutando ${title.name} - ${artist.name} na estação #${this.camelize(playerInfo.name)} no @VagalumeFM ${url}`
            };

            log.song_id = playingSong.title.id;
        } else {
            content = {
                title: 'Vagalume.FM',
                message: `Escutando a estação #${this.camelize(playerInfo.name)} no @VagalumeFM ${url}`
            };
        }

		EventManager.trackEvent({ action: 'share', category: 'Player', params: log });
        Share.share(content, { dialogTitle: 'Compartilhar' });
	}

	toggleRecording() {
		const { isRecording, playingSong } = this.props;
        if (isRecording) {
            this.stopRecording();
        } else {
            this.startRecording(playingSong);
        }
    }

	animateShortPlayer() {
		const initialPos = height;

		Animated.sequence([
			Animated.timing(this.state.bodyTranslate, {
	            toValue: initialPos - 10,
	            duration: 200
	        }),
			Animated.timing(this.state.bodyTranslate, {
	            toValue: initialPos,
	            duration: 200
	        }),
			Animated.timing(this.state.bodyTranslate, {
	            toValue: initialPos - 10,
	            duration: 200
	        }),
			Animated.timing(this.state.bodyTranslate, {
	            toValue: initialPos,
	            duration: 200
	        })
		]).start();
	}

	openPlayer() {
		const { playingSong } = this.props;
		if (playingSong && playingSong.title && playingSong.title.id && (!this.state.lyrics || !this.state.lyrics.text)) {
			this.getLyricsAndSubtitle(playingSong);
		}

		Animated.timing(this.state.bodyTranslate, {
            toValue: SHORT_PLAYER_SIZE - 10,
            duration: 200
        }).start(() => {
			BackHandler.addEventListener('hardwareBackPress', this._closePlayer);
			AppState.addEventListener('change', this._handleAppStateChange);
		});
	}

	toggleFollow() {
		const { playerInfo } = this.props;

        if (!this.props.playerInfo) return;

        if (this.isFollowing()) {
            this.props.unfollowStation(playerInfo);
        } else {
            this.props.followStation(playerInfo);
        }
    }

    isFollowing() {
		const { followingStations, playerInfo } = this.props;
        const stationIndex = followingStations.findIndex(
            (obj) => obj.id === playerInfo.id
        );

        return stationIndex !== -1;
    }

    toggleLike(type) {
        const { playerInfo, playingSong } = this.props;

        // Pegando o current time da música
        const duration = new Date(this.props.playingSong.tsEnd - this.props.playingSong.tsStart);
        let time = new Date(duration - (this.props.playingSong.tsEnd - Date.now()));
        time = time.getTime() / 1000;

        const obj = { type, ts: time };

        if (!this.state.likeAction) {
            if (playingSong && playingSong.title && playingSong.title.id) {
                this.setState({ likeAction: type });

				const action = type === 'like' ? 'rate_song_up' : 'rate_song_down';
				EventManager.trackEvent({ action, category: 'Player', params: { station_id: playerInfo.id, song_id: playingSong.title.id } });

                axios
                .post(`https://api.vagalume.fm/v2/${playerInfo.id}/${playingSong.title.id}/rate`, obj)
                .catch(() => {
                    // Erro de requisição
                });
            } else {
				Toast.show('Primeiro coloque para tocar para votar nas músicas.');
            }
        }
    }

	_closePlayer = () => {
		if (this.state.showLyrics) {
			this.hideLyrics();
			return true;
		} else {
			if (this.playerIndex === 1) {
				this.playerIndex = 0;
				setTimeout(() => {
					Animated.timing(this.state.bodyTranslate, {
						toValue: height,
						duration: 200
					}).start();
				}, 200)
			} else {
				Animated.timing(this.state.bodyTranslate, {
		            toValue: height,
		            duration: 200
		        }).start(() => {
					AppState.removeEventListener('change', this._handleAppStateChange);
					BackHandler.removeEventListener('hardwareBackPress', this._closePlayer);
				});
			}
			return true;
		}
	}

	navigatorPop() {
		if (this.props.navigation && this.props.navigation.dispatch) {
			this.props.navigation.dispatch({ type: 'Navigation/BACK' });
		}
		return true;
    }


	goLiveStation() {
		const { playerInfo, playerType } = this.props;
		if (playerType === PLAYER_TYPES.OFFLINE && playerInfo.id) {
			EventManager.trackEvent({ action: 'offline_to_live', category: 'Player', params: { station_id: playerInfo.id } });

			this.props.initPlayer({ playerInfo, playerType: PLAYER_TYPES.STREAM, autoplay: true });
		}
	}

	toggleSleepModal() {
		if (this.sleepModal) {
			this.sleepModal.toggleModal();
		}
	}

	setSleepTime(sleepTime) {
		if (sleepTime.milliseconds === null || typeof sleepTime.milliseconds !== 'number') return;

		BackgroundTimer.clearTimeout(this._sleepTime);
		this._sleepTime = BackgroundTimer.setTimeout(() => {
			const { status } = this.props;
			const player = this.props.instance;
			if (status !== STATE_TYPE.STOPPED && player) {
				player.stop();
				LocalNotification.create({ title: 'Modo Soneca', message: `A estação foi pausada`, isSilent: true, date: new Date(Date.now()) });
				EventManager.trackEvent({ action: 'sleep_done', category: 'Player' });
			}
			this.setState({ sleepTime: null });
		}, sleepTime.milliseconds);
		this.setState({ sleepTime });
	}

	cancelSleepTime() {
		BackgroundTimer.clearTimeout(this._sleepTime);
		this.setState({ sleepTime: null });
	}

	showLyrics() {
		Animated.parallel([
			Animated.timing(this._lyricsAnimation.opacity,
				{
					toValue: 0,
					duration: 200
				}
			),
			Animated.timing(this._lyricsAnimation.scale,
				{
					toValue: 1.2,
					duration: 200
				}
			),
			Animated.timing(this._lyricsAnimation.rotation,
				{
					toValue: 1,
					duration: 200
				}
			)
		]).start(() => {
			this.setState({ showLyrics: true, lockDrag: true });
		});
	}

	hideLyrics() {
		this.setState({ showLyrics: false, lockDrag: false });
		setTimeout(() => {
			Animated.parallel([
				Animated.timing(this._lyricsAnimation.opacity,
					{
						toValue: 1,
						duration: 200
					}
				),
				Animated.timing(this._lyricsAnimation.scale,
					{
						toValue: 1,
						duration: 200
					}
				),
				Animated.timing(this._lyricsAnimation.rotation,
					{
						toValue: 0,
						duration: 200
					}
				)
			]).start();
		}, 200);
	}

	repeat() {
		let { repeat } = this.state;
		repeat++;
		if (repeat > REPEAT_STATE.ONE) repeat = REPEAT_STATE.ALL;
		this.setState({ repeat });
	}

	renderSleepModal() {
		return <SleepModal setSleepTime={this.setSleepTime.bind(this)} cancelSleepTime={this.cancelSleepTime.bind(this)} sleepTime={this.state.sleepTime} ref={modal => this.sleepModal = modal}/>;
	}

	renderTop() {
		const { playerInfo, playingSong, playerType } = this.props;
		return (
			<View style={styles.top}>
				<StationImage
				station={playerInfo}
				playerType={playerType}
				song={playingSong}
				navigateStation={this.navigateStation.bind(this)}
				/>
				<StationName
				sleepTime={this.state.sleepTime}
				station={playerInfo}
				goStation={this.goStation.bind(this)}
				/>
			</View>
		);
	}

	renderLikeButton() {
		const accessibilityText = `Gostei.`;

		return (
			<View style={{ flex: 1, alignItems: 'center'}}>
				<IconButton
				onPress={this.toggleLike.bind(this, 'like')}
				hitSlop={{ top: 20, left: 10, right: 20, bottom: 20 }}
				color="#555"
				size={40}
				accessible={true}
            	accessibilityLabel={accessibilityText}>
					<Icon name={this.state.likeAction === 'like' ? 'like_on' : 'like_off'} size={30} color="#FFF" />
				</IconButton>
			</View>
  		);
	}

	renderDislikeButton() {
		const accessibilityText = `Não Gostei.`;

		return (
			<View style={{ flex: 1, alignItems: 'center'}}>
				<IconButton
				onPress={this.toggleLike.bind(this, 'dislike')}
				hitSlop={{ top: 20, left: 10, right: 20, bottom: 20 }}
				color="#555"
				size={40}
				accessible={true}
            	accessibilityLabel={accessibilityText}
				>
					<Icon name={this.state.likeAction === 'dislike' ? 'dislike_on' : 'dislike_off'} size={30} color="#FFF" />
				</IconButton>
			</View>
  		);
	}

	renderRecordingsButton() {
		const accessibilityText = `Gravações.`;

		return (
			<IconButton
				onPressIn={this.goToRecordings.bind(this)}
				hitSlop={{ top: 30, left: 30, right: 10, bottom: 30 }}
				color="#555"
				size={40}
				accessible={true}
            	accessibilityLabel={accessibilityText}
			>
				<Icon name="recording" size={30} color="#FFF" />
			</IconButton>
		);
	}

	renderLiveButton() {
		const accessibilityText = `Ir para o ao vivo.`;

		return (
			<IconButton
				onPressIn={this.goLiveStation.bind(this)}
				hitSlop={{ top: 30, left: 30, right: 10, bottom: 30 }}
				color="#555"
				size={40}
				accessible={true}
            	accessibilityLabel={accessibilityText}
			>
				<Icon name="stream_live" size={30} color="#FFF" />
			</IconButton>
		);
	}

	renderPreviousButton() {
		const accessibilityText = `Gravação anterior.`;

		return (
			<IconButton
			onPress={this.navigateStation.bind(this, { nextPrevious: 'previous' })}
			hitSlop={{ top: 20, left: 10, right: 20, bottom: 20 }}
			color="#555"
			size={40}
			accessible={true}
        	accessibilityLabel={accessibilityText}
			>
				<Icon name="previous" size={30} color="#FFF" />
			</IconButton>
		);
	}

	renderLeftControls() {
		const { playerType } = this.props;
		if (playerType === PLAYER_TYPES.OFFLINE) {
			return (
				<View style={styles.controlsContainer}>
					{this.renderLiveButton()}
					{this.renderPreviousButton()}
				</View>
			)
		} else {
			return (
				<View style={styles.controlsContainer}>
					{this.renderRecordingsButton()}
					{this.renderLikeButton()}
				</View>
			)
		}
	}

	renderRecordButton(size, margin) {
		const { isRecording, cast, status } = this.props;
		const isCasting = cast.session === 'CONNECTED' || cast.session === 'onSessionStarted' || cast.session === 'onSessionResumed';
		const isRunning = status === STATE_TYPE.RUNNING ? 1 : 0.4;
		margin = margin || 10;
		size = size ? size : 25;
		const accessibilityText = isRecording ? `Gravação. Parar de gravar.` : `Gravação. Iniciar gravação da estação.`;


		return (
			<IconButton
				accessible={true}
	            accessibilityLabel={accessibilityText}
				onPress={this.toggleRecording.bind(this)}
				hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
				color="#555"
				size={size + margin}
			>
				<Animated.View
				style={{
					opacity: this._recordingOpacity
				}}
				>
					<View
					style={{
						borderColor: '#FFF',
						borderWidth: isRecording ? 0 : 1,
						backgroundColor: isRecording ? '#E24F27' : 'transparent',
						height: size,
						width: size,
						borderRadius: size / 2,
						alignItems: 'center',
						justifyContent: 'center',
						opacity: isCasting ? 0.4 : isRunning
					}}
					>
						<Icon name="rec" size={size - margin} color="#FFF" />
					</View>
				</Animated.View>
			</IconButton>
		);
	}

	renderNextButton() {
		const accessibilityText = 'Próxima gravação.';
		return (
			<IconButton
			onPress={this.navigateStation.bind(this, { nextPrevious: 'next' })}
			hitSlop={{ top: 20, left: 10, right: 20, bottom: 20 }}
			color="#555"
			size={40}
			accessible={true}
	        accessibilityLabel={accessibilityText}
			>
				<Icon name="next" size={30} color="#FFF" />
			</IconButton>
		);
	}

	renderRepeatButton() {
		const { repeat } = this.state;
		let repeatIcon;
		let accessibilityText

		if (repeat === REPEAT_STATE.ALL) {
			repeatIcon = 'repeat';
			accessibilityText = 'Repetir gravação.';
		} else if (repeat === REPEAT_STATE.ONE) {
			repeatIcon = 'repeat_one';
			accessibilityText = 'Repetir uma vez.';
		}


		return (
			<IconButton
				onPress={this.repeat.bind(this)}
				hitSlop={{ top: 30, left: 10, right: 30, bottom: 30 }}
				color="#555"
				size={40}
				accessible={true}
	       		accessibilityLabel={accessibilityText}
			>
				<Icon name={repeatIcon} size={30} color="#CF0" />
			</IconButton>
		);
	}

	renderRightControls() {
		const { playerType } = this.props;
		if (playerType === PLAYER_TYPES.OFFLINE) {
			return (
				<View style={styles.controlsContainer}>
					{this.renderNextButton()}
					{this.renderRepeatButton()}
				</View>
			)
		} else {
			return (
				<View style={styles.controlsContainer}>
					{this.renderDislikeButton()}
					{this.renderRecordButton()}
				</View>
			)
		}
	}

	renderControls() {
		const { status, instance, playerType } = this.props;
		return (
			<View style={[styles.controlsBody, { paddingBottom: playerType !== PLAYER_TYPES.STREAM ? 34 : 0 }]}>
				{this.renderLeftControls()}
					<PlayButton
					playerStatus={status}
					player={instance}
					size={60}
					/>
				{this.renderRightControls()}
			</View>
		)
	}

	renderOpenInfo() {
		const { playerType } = this.props;
		const accessibilityText = 'Mostrar informações.';

		if (playerType === PLAYER_TYPES.STREAM) {
			return (
				<TouchableOpacity
					accessible={true}
					accessibilityLabel={accessibilityText}
					accessibilityTraits ={'button'}
					accessibilityComponentType={'button'}
					onPress={() => {
					this.playerIndex = 1
						EventManager.trackEvent({ action: 'open_player_info', category: 'Player' });
					}}>
					<View style={[styles.infoButtonContainer, { marginBottom: 8 }]}>
						<Icon name="chevron_up" size={20} color="#FFF" />
					</View>
				</TouchableOpacity>
			);
		}
	}

	renderBottom() {
		const { playerType, paddingBottom, nextSongList, playingSong, isRecording, recordingFile, status, playerInfo } = this.props;

		return (
			<View style={[styles.bottom]}>
				<ProgressContainer
				song={playingSong}
				nextSongList={nextSongList}
				playerType={playerType}
				status={status}
				isRecording={isRecording}
				recordingFile={recordingFile}
				station={playerInfo}
				/>
				{this.renderControls()}
				{this.renderOpenInfo()}
			</View>
		);
	}

	renderPlayer() {
		const { playerInfo, playingSong, status } = this.props;

		return (
			<View style={styles.playerBody}>
				<Header
				shareStation={this.shareStation.bind(this)}
				hidePlayer={this._closePlayer.bind(this)}
				hideLyrics={this.hideLyrics.bind(this)}
				isShowingLyrics={this.state.showLyrics}
				openBottomSheet={() => {
					EventManager.trackEvent({ action: 'opened_bottom_sheet', category: 'Player' });
					this.bottomSheet.openBottomSheet();
				}}
				playingSong={playingSong}
				headerOpacity={this._lyricsAnimation.opacity}
				lyricsNameOpacity={this._lyricsAnimation.rotation}
				backButtonRotation={this._lyricsAnimation.spin}
				/>
				<Background station={playerInfo} />
				<Lyrics isShowingLyrics={this.state.showLyrics} data={this.state.lyrics} />
				<Animated.View style={{ flex: 1, justifyContent: 'space-between', opacity: this._lyricsAnimation.opacity, transform: [{ scale: this._lyricsAnimation.scale }] }}>
					{this.renderTop()}
					<View>
						<StationSong station={playerInfo} song={playingSong} />
						<Subtitles
						playingSong={playingSong}
						subtitles={this.state.subtitles}
						lyrics={this.state.lyrics}
						playerInfo={playerInfo}
						status={status}
						showLyrics={this.showLyrics.bind(this)}
						/>
					</View>
					{this.renderBottom()}
				</Animated.View>
			</View>
		);
	}

	renderCloseInfo() {
		const accessibilityText = 'Fechar informações e voltar ao player.';

		return (
			<TouchableOpacity
			accessible={true}
			accessibilityLabel={accessibilityText}
			accessibilityTraits ={'button'}
			accessibilityComponentType={'button'}
			onPress={() => {this.playerIndex = 0}}>
				<View
				hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
				style={[styles.infoButtonContainer, { paddingTop: StatusBarHeight + 16, height: 53 }]}
				>
					<Icon name="chevron_down" size={20} color="#FFF" />
				</View>
			</TouchableOpacity>
		);
	}

	renderNextSongsList() {
		const { navigation, nextSongList, playerType, playingSong } = this.props;

		let lastDiff = playingSong.title.id ? (playingSong.duration - playingSong.position) : 0;
		const now = Date.now();
		if (nextSongList && nextSongList instanceof Array && nextSongList.length) {
			return nextSongList.map((song, index) => {
				if (!song.tsStart) {
					song.tsStart = now + lastDiff;
					song.tsEnd = song.tsStart + (song.duration * 1000);
					lastDiff += (song.duration * 1000);
				}

				return <LastPlayedSong
				isNext={true}
				song={song}
				key={index}
				navigation={navigation}
				closePlayer={this._closePlayer.bind(this)}
				/>
			});
		}
	}

	renderPlayedSongsList() {
		const { navigation, playingSong } = this.props;

		let lastDiff = (playingSong && playingSong.duration) ? playingSong.duration : 0;
		const now = Date.now();
		if (this.state.lastPlayed && this.state.lastPlayed instanceof Array && this.state.lastPlayed.length) {
			return this.state.lastPlayed.map((song, index) => {
				if (!song.tsStart) {
					song.tsStart = now - lastDiff;
					song.tsEnd = song.tsStart - (song.duration * 1000);
					lastDiff += (song.duration * 1000);
				}

				return <LastPlayedSong
				song={song}
				key={index}
				navigation={navigation}
				closePlayer={this._closePlayer.bind(this)}
				/>
			});
		}
	}

	renderLastPlayedSongs() {
		let content;

		if (this.state.lastPlayed && this.state.lastPlayed instanceof Array && this.state.lastPlayed.length) {
			content = (
				<ScrollView
				ref="scrollPlayedSongsList"
				>
					{this.renderPlayedSongsList()}
				</ScrollView>
			);
		} else {
			content = (
				<View style={styles.loaderContainer}>
					<Loader size={55} />
				</View>
			);
		}

		return (
			<View style={{ flex: 1 }}>
				{content}
			</View>
		);
	}

	renderNextSongs() {
		const { nextSongList, playerType } = this.props;
		let content;

		if (playerType !== PLAYER_TYPES.STREAM) return;

		if (nextSongList && nextSongList instanceof Array && nextSongList.length) {
			content = (
				<ScrollView>
					{this.renderNextSongsList()}
				</ScrollView>
			);
		} else {
			content = (
				<View style={styles.loaderContainer}>
					<Loader size={55} />
				</View>
			);
		}

		return (
			<View style={{ flex: 1 }}>
				{content}
			</View>
		);
	}

	renderRelatedList() {
		const { playerInfo, navigation } = this.props;
		const { relatedRendered } = this.state;

		if (relatedRendered && playerInfo.related && playerInfo.related instanceof Array && playerInfo.related.length) {
			const TILE_SIZE = width > 560 ? (width - 4) / 4 : (width - 2) / 2;
			return playerInfo.related.map((station, key) => {
				if (station.img && station.img.default) {
					return (
						<StationTile
						onPress={this.goStation.bind(this, station)}
						key={station.id}
						navigation={this.props.navigation}
						station={station}
						customPress
						/>
					);
				}
			});
		}
	}

	renderRelatedStations() {
		const { playerInfo } = this.props;
		const { relatedRendered } = this.state;
		let content;

		if (relatedRendered && playerInfo.related && playerInfo.related instanceof Array && playerInfo.related.length) {
			content = (
				<ScrollView
				ref="scrollRelatedList"
				>
					<View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
						{this.renderRelatedList()}
					</View>
				</ScrollView>
			);
		} else {
			content = (
				<View style={styles.loaderContainer}>
					<Loader size={55} />
				</View>
			)
		}

		return (
			<View style={{ flex: 1 }}>
				{content}
			</View>
		);
	}

	renderInfoSlider() {
		const height = height - (StatusBarHeight + 53 + 60);
		return (
			<ScrollView
			ref={infoSlider => { this.infoSlider = infoSlider; }}
			onMomentumScrollEnd={(e) => {
				const offset = e.nativeEvent.contentOffset.x;
				const page = offset ? (offset / width) : 0;
				this.infoTabs.onPageSelected(page);
				this.infoTabs.setPos(page);
			}}
			pagingEnabled
			horizontal
			>
				<View
				style={{ width: width * 3, height, flexDirection: 'row' }}
				>
					{this.renderNextSongs()}
					{this.renderLastPlayedSongs()}
					{this.renderRelatedStations()}
				</View>
			</ScrollView>
		);
	}

	renderInfo() {
		return (
			<View style={[styles.infoBody, { paddingTop: this.props.paddingBottom }]}>
				{this.renderCloseInfo()}
				<InfoTabs
				ref={infoTabs => { this.infoTabs = infoTabs; }}
				onTabSelected={(index) => {
					this.infoSlider.scrollTo({ x: index * width, y: 0, animated: true });
					if (!this.state.relatedRendered) {
						setTimeout(() => {
							this.setState({ relatedRendered: true });
						}, 1000);
					}
				}}
				/>
				{this.renderInfoSlider()}
			</View>
		)
	}

	render() {
		const { playingSong, paddingBottom, playerInfo, playerType, instance, status, navigation, currentScreen } = this.props;
		const { bodyTranslate, pan, lockDrag, tabsTranslate, sleepTime } = this.state;
        const [ translateX, translateY ] = [ pan.x, pan.y ];
		const PLAYER_CONTAINER_HEIGHT = height * 2;
		const panHandlers = lockDrag || playerType !== PLAYER_TYPES.STREAM ? {} : this.panResponder.panHandlers;

		return (
			<View pointerEvents="box-none" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, right: 0, zIndex: 9 }}>

						{this.renderSleepModal()}
				<Tabs
				navigation={navigation}
				currentScreen={currentScreen}
				tabsTranslate={tabsTranslate}
				tabsHeight={TABS_HEIGHT}
				/>
				<Animated.View style={[styles.body, { transform: [{ translateY: bodyTranslate }] }]}>
					<BottomSheet
					paddingBottom={paddingBottom}
					playingSong={playingSong}
					playerInfo={playerInfo}
					sleepTime={sleepTime}
					showLyrics={this.showLyrics.bind(this)}
					toggleSleepModal={this.toggleSleepModal.bind(this)}
					ref={bottomSheet => { this.bottomSheet = bottomSheet; }}
					toggleFollow={this.toggleFollow.bind(this)}
					isFollowing={this.isFollowing.bind(this)()}
					/>
					<Short
					playingSong={playingSong}
					playerType={playerType}
					playerInfo={playerInfo}
					playerStatus={status}
					sleepTime={sleepTime}
					playerInstance={instance}
					toggleSleepModal={this.toggleSleepModal.bind(this)}
					shadowHeight={SHORT_PLAYER_SHADOW}
					playerHeight={SHORT_PLAYER_HEIGHT}
					renderRecordButton={this.renderRecordButton.bind(this)}
					openPlayer={this._openPlayer}
					/>
					<Animated.View
	                {...panHandlers}
	                 style={[styles.playerContainer, { paddingTop: paddingBottom, height: PLAYER_CONTAINER_HEIGHT, bottom: -height, transform: [{ translateX }, { translateY }] }]}
	                >
						{this.renderPlayer()}
						{this.renderInfo()}
					</Animated.View>
				</Animated.View>
			</View>
		)
	}
}

class Background extends Component {
	constructor(props) {
		super(props);

		this._fadeIn = new Animated.Value(0);
	}

	fadeIn() {
		this._fadeIn.setValue(0);
		Animated.timing(
			this._fadeIn,
			{
				toValue: 1,
				duration: 1200,
				easing: Easing.linear
			}
		).start();
	}

	shouldComponentUpdate(nextProps) {
		const station = this.props;
		if (nextProps && nextProps.station.id !== station.id) {
			return true;
		}

		return false;
	}

	componentWillReceiveProps(nextProps) {
		const { station } = this.props;
		if (nextProps && station && station instanceof Object && station.id !== nextProps.station.id) {
			this.fadeIn();
		}
	}

	render() {
		const { station } = this.props;
		if (station && station instanceof Object && station.id && station.img && station.img['bg-low']) {
			return (
				<Animated.View style={[ styles.backgroundFade, { opacity: this._fadeIn, backgroundColor: '#1d1d1d' } ]}>
					<Image
					 blurRadius={Platform.OS === 'android' ? 4 : 7}
					 source={{ uri: station.img['bg-low'] }}
					 style={styles.background}
					/>
				</Animated.View>
			);
		}
		return (
			<View />
		);
	}
}

const styles = StyleSheet.create({
	body: {
		width,
        height: height + SHORT_PLAYER_SIZE,
        position: 'absolute',
        left: 0,
        bottom: SHORT_PLAYER_HEIGHT,
        zIndex: 9,
        elevation: 3
	},
	playerBody: {
		justifyContent: 'space-between',
		flex: 1
	},
	infoBody: {
		backgroundColor: '#2d2d2d',
		flex: 1
	},
	playerContainer: {
        position: 'absolute',
        elevation: 1,
		width,
		top: SHORT_PLAYER_SIZE,
		backgroundColor: '#2d2d2d'
    },
	backgroundFade: {
		position: 'absolute',
		top: 0,
		zIndex: -1,
		left: 0
	},
	background: {
		height,
		width,
		opacity: 0.2
	},
	top: {
		alignItems: 'center',
		paddingTop: Dimensions.get('window').height < 595 ? 30 : 46
	},
	bottom : {
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	controlsBody: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: width - 64,
		alignItems: 'center',
		marginBottom: 5
	},
	controlsContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		flex: 1
	},
	infoButtonContainer: {
		width,
		height: 26,
		justifyContent: 'center',
		alignItems: 'center'
	},
	infoButton: {
		width: 35,
		height: 30
	},
	loaderContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	}
});

const mapStateToProps = ({ player, stations }) => {
    const { isRecording, recordingFile, playerInfo, instance, status, nextSongList, playingSong, playerType, cast } = player;
    const { followingStations, allStations } = stations;

    return { allStations, followingStations, playerInfo, instance, status, nextSongList, playingSong, playerType, cast, isRecording, recordingFile };
};

export default connect(mapStateToProps, { setCastSession, toggleRecording, initPlayer, followStation, unfollowStation, setPlayerStatus, setPlayingSong, setNextSongList })(Player);
