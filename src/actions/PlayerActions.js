import { AsyncStorage, AppState } from 'react-native';
import { PlayerController, PLAYER_TYPES } from '../components/player/PlayerController'
import EventManager from '../components/containers/EventManager';
import {
	PLAYER_INITIATED,
	TOGGLE_RECORDING,
	PLAYER_INFO_LOADED,
	PLAYER_STARTED,
	PLAYER_TYPE_CHANGED,
	PLAYER_STATUS_CHANGED,
	PLAYING_SONG_LOADED,
	CAST_SESSION_CHANGED,
	CAST_DEVICE_ID_CHANGED,
	NEXT_SONG_LIST_LOADED
} from './types';
import { STATIONS_CACHE } from './JsonCache';
import Toast from 'react-native-root-toast';


const playerController = new PlayerController();

export const initPlayer = ({ playerInfo, playerType, recordingFile, autoplay }) => {

    AsyncStorage.setItem('lastStation', JSON.stringify(playerInfo)).catch((err) => {
        // TODO: Enviar evento para o firebase
        if (AppState.currentState == "active") {
            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
        }
    });

	const params = { playerInfo, playerType, autoplay };

	if (autoplay) {
		const type = (Object.keys(PLAYER_TYPES)[playerType - 1]).toLowerCase();  // ex: 'stream'
		EventManager.trackEvent({ action: 'play', category: 'Player', params: { station_id: playerInfo.id, player_type: type } });
	}

	// Caso seja gravação
	if (recordingFile) params['recordingFile'] = recordingFile;
	const instance = playerController.initPlayer(params);
	return {
		type: PLAYER_INITIATED,
		payload: { playerInfo, playerType, recordingFile, autoplay, instance }
	};
}

export const toggleRecording = (isRecording) => {
	return {
		type: TOGGLE_RECORDING,
		payload: { isRecording }
	};
}

export const setPlayerInfo = (station) => {
    AsyncStorage.setItem('lastStation', JSON.stringify(station)).catch((err) => {
        // TODO: Enviar evento para o firebase
        if (AppState.currentState == "active") {
            Toast.show("Desculpe, a ação não pode ser concluída por falta de espaço.");
        }
    });

    return {
        type: PLAYER_INFO_LOADED,
        payload: station
    };
};

export const setPlayerInstance = (player) => {
    return {
        type: PLAYER_STARTED,
        payload: player
    };
};

export const setPlayerType = (type) => {
    return {
        type: PLAYER_TYPE_CHANGED,
        payload: type
    };
};

export const setPlayerStatus = (status) => {
    return {
        type: PLAYER_STATUS_CHANGED,
        payload: status
    };
};

export const setPlayingSong = (playingSong) => {
    return {
        type: PLAYING_SONG_LOADED,
        payload: playingSong
    };
};

export const setNextSongList = (nextSongList) => {
	return {
        type: NEXT_SONG_LIST_LOADED,
        payload: nextSongList
    };
}

export const setCastSession = (session) => {
    return {
        type: CAST_SESSION_CHANGED,
        payload: session
    };
}

export const setCastId = (id) => {
    return {
        type: CAST_DEVICE_ID_CHANGED,
        payload: id
    };
}
