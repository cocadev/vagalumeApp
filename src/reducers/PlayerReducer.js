import { STATE_TYPE } from '../components/containers/Player';
import { PLAYER_TYPES } from '../components/player/PlayerController';
import {
	PLAYER_INITIATED,
	TOGGLE_RECORDING,
	PLAYER_INFO_LOADED,
	PLAYER_STARTED,
	PLAYER_STATUS_CHANGED,
	PLAYER_TYPE_CHANGED,
	PLAYING_SONG_LOADED,
	CAST_SESSION_CHANGED,
	CAST_DEVICE_ID_CHANGED,
	NEXT_SONG_LIST_LOADED,
    SET_SLEEP_TIME
} from '../actions/types';

const INITIAL_STATE = {
	playerInfo: { img: {}, related: [] }, // Informação da estação que está sendo tocada
	playerType: PLAYER_TYPES.STREAM, // Tipo to player (STREAM, OFFLINE, CHROMECAST)
	status: STATE_TYPE.IDLE, // Status atual do player
	recordingFile: null, // Arquivo da gravação que está tocando
	instance: null, // Instância do player
	autoplay: false, // Verificação se o player irá iniciar tocando
	playingSong: { artist: { name: '' }, title: { name: '' } }, // Música que está tocando no momento
	nextSongList: [], // Lista de músicas que serão tocadas
	isRecording: false, // Variável que verifica se está gravando uma estação no momento, caso esteja gravando armazena o timestamp
    cast: { session: '', deviceId: '' }
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
		case PLAYER_INITIATED:
			const { instance, playerInfo, playerType, recordingFile, autoplay } = action.payload;
			return { ...state, instance, playingSong: INITIAL_STATE.playingSong, nextSongList: INITIAL_STATE.nextSongList, playerType, playerInfo, recordingFile, autoplay, status: autoplay ? STATE_TYPE.STARTING : STATE_TYPE.STOPPED };
		case TOGGLE_RECORDING:
			const { isRecording } = action.payload;
			return { ...state, isRecording };
		case PLAYER_TYPE_CHANGED:
            return { ...state, playerType: action.payload };
        case PLAYER_INFO_LOADED:
            return { ...state, playerInfo: action.payload };
        case PLAYER_STARTED:
            return { ...state, instance: action.payload };
        case PLAYER_STATUS_CHANGED:
            return { ...state, status: action.payload };
		case NEXT_SONG_LIST_LOADED:
			return { ...state, nextSongList: action.payload };
        case PLAYING_SONG_LOADED:
            return { ...state, playingSong: action.payload };
        case CAST_SESSION_CHANGED:
            return {
                ...state,
                cast: {
                    session: action.payload,
                    deviceId: state.cast.deviceId
                }
            };
         case CAST_DEVICE_ID_CHANGED:
            return {
                ...state,
                cast: {
                    session: state.cast.session,
                    deviceId: action.payload
                }
            };
        default:
        return state;
    }
};
