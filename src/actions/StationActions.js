import { AsyncStorage, AppState } from 'react-native';
import axios from 'axios';
import {
    FEATURED_STATION_FETCH_SUCCESS,
    ALL_STATIONS_FETCH_SUCCESS,
    STATION_FETCH_SUCCESS,
    FOLLOWING_STATIONS_FETCH_SUCCESS,
    LISTENERS_FETCH_SUCCESS
} from './types';
import { STATIONS_CACHE } from './JsonCache';
import EventManager from '../components/containers/EventManager';
import Toast from 'react-native-root-toast';

export const getFeatured = () => (dispatch) => {
    const defaultFeatured = [{
        img: require('VagalumeFM/src/img/vagalume-vibe-slider.png'),
        offline: true,
        stationID: "14623883771774082279"
    }];

    AsyncStorage.getItem('featured', (err, result) => {
		result = JSON.parse(result);

        if (result != null && result.expire > Date.now()) {
            dispatch({ type: FEATURED_STATION_FETCH_SUCCESS, payload: { featured: result.data } });
        } else {
            let dispatched = false;
            // Caso tenha o resultado expirado retorna o antigo para buscar o novo depois
            if (result && result.data && result.data instanceof Array && result.data.length) {
                dispatched = true;
                dispatch({ type: FEATURED_STATION_FETCH_SUCCESS, payload: { featured: result.data } });
            } else {
                dispatch({ type: FEATURED_STATION_FETCH_SUCCESS, payload: { featured: defaultFeatured } });
            }

            axios.get('https://api.vagalume.fm/v2/static/hotspots.json?nocache')
            .then(response => {
                const expire = Date.now() + (1000 * 60 * 60 * 24 * 1); // Um dia de cache
                const { data } = response;
                if (data && data instanceof Array && data.length) {

					AsyncStorage.setItem('featured', JSON.stringify({ expire, data })).catch((err) => {
                        // TODO: Enviar evento para o firebase
                        if (AppState.currentState == "active") {
                            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                        }
                    });

                    if (!dispatched) dispatch({ type: FEATURED_STATION_FETCH_SUCCESS, payload: { featured: [...defaultFeatured, ...data] } });
                } else {
					// Estação da Vagalume Vibe padrão caso dê algum erro
					if (!dispatch) dispatch({ type: FEATURED_STATION_FETCH_SUCCESS, payload: { featured: defaultFeatured } });
				}
            })
            .catch(error => {
                // Estação da Vagalume Vibe padrão caso dê algum erro
                dispatch({ type: FEATURED_STATION_FETCH_SUCCESS, payload: { featured: defaultFeatured } });
            });
        }
    });
};

export const getFollowingStations = () => (dispatch) => {
    AsyncStorage.getItem('followingStations', (err, result) => {
        if (result != null) {
            dispatch({ type: FOLLOWING_STATIONS_FETCH_SUCCESS, payload: JSON.parse(result) });
        } else {
            AsyncStorage.setItem('followingStations', JSON.stringify([]), () => {
                dispatch({ type: FOLLOWING_STATIONS_FETCH_SUCCESS, payload: [] });
            }).catch((err) => {
                // TODO: Enviar evento para o firebase
                if (AppState.currentState == "active") {
                    Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                }
            });
        }
    });
};

export const getListeners = () => (dispatch) => {
    axios.get('https://api.vagalume.fm/v2/all/listeners?source=app')
    .then(response => {
		const { data } = response;
        if (data && data.stations) {
            const { stations } = data;
			if (stations && stations instanceof Object) {
				dispatch({
	                type: LISTENERS_FETCH_SUCCESS,
	                payload: stations
	            });
			}
        } else {
			dispatch({ type: LISTENERS_FETCH_SUCCESS, payload: {} });
		}
    })
    .catch(error => {
		dispatch({ type: LISTENERS_FETCH_SUCCESS, payload: {} });
    });
}

export const followStation = (station) => (dispatch) => {
    AsyncStorage.getItem('followingStations', (err, result) => {
        if (result != null) {
            const followingStations = JSON.parse(result);
            const isFollowing = followingStations.find((obj) => obj.id === station.id);

            if (!isFollowing) {
				EventManager.trackEvent({ action: 'follow_station', category: 'Station', params: { station_id: station.id } });

                followingStations.push(station);
                dispatch({
                    type: FOLLOWING_STATIONS_FETCH_SUCCESS,
                    payload: followingStations
                });

                AsyncStorage.setItem('followingStations', JSON.stringify(followingStations)).catch((err) => {
                    // TODO: Enviar evento para o firebase
                    if (AppState.currentState == "active") {
                        Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                    }
                });
            }
        }
    });
};

export const unfollowStation = (station) => (dispatch) => {
    AsyncStorage.getItem('followingStations', (err, result) => {
        if (result != null) {
            const followingStations = JSON.parse(result);
            const stationIndex = followingStations.findIndex((obj) => obj.id === station.id);

            if (stationIndex !== -1) {
				EventManager.trackEvent({ action: 'unfollow_station', category: 'Station', params: { station_id: station.id } });

                followingStations.splice(stationIndex, 1);
                dispatch({
                    type: FOLLOWING_STATIONS_FETCH_SUCCESS,
                    payload: followingStations
                });
                AsyncStorage.setItem('followingStations', JSON.stringify(followingStations)).catch((err) => {
                    // TODO: Enviar evento para o firebase
                    if (AppState.currentState == "active") {
                        Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                    }
                });
            }
        }
    });
};

export const getAllStationsCache = () => (dispatch) => {
    AsyncStorage.getItem('allStations', (err, result) => {
        try {
            result = JSON.parse(result);
        } catch (e) {
            result = false;
        }
		if (!result) {
		    dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: STATIONS_CACHE });
		}
    });
};

export const getAllStations = () => (dispatch) => {
    AsyncStorage.getItem('allStations', (err, result) => {
		result = JSON.parse(result);

        if (result != null && result.data && result.expire > Date.now() && result.data instanceof Array && result.data.length > 6) {
            dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: { allStations: result.data } });
        } else {
            // JSON EM CACHE
            let cacheStations = STATIONS_CACHE;
            let cacheStationIDs = [];
            for (var x in cacheStations) {
                cacheStationIDs.push(cacheStations[x].id);
            }

            let dispatched = false;
            // Caso tenha o resultado expirado retorna o antigo para buscar o novo depois
            if (result && result.data && result.data instanceof Array && result.data.length > 6) {
                dispatched = true;
                dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: { allStations: result.data } });
            } else {
                dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: { allStations: cacheStations } });
            }

            axios.get('https://api.vagalume.fm/v2/static/all.json')
            .then(response => {
                const expire = Date.now() + (1000 * 60 * 10); // 10 minutos de cache
                const { data } = response;

				if (data && data instanceof Array && data.length) {
	                for (var key in data) {
	                    if (cacheStationIDs.indexOf(data[key].id) == -1) {
	                        cacheStations.push(data[key]);
	                    }
	                }

	                AsyncStorage.setItem('allStations', JSON.stringify({ expire, data })).catch((err) => {
                        // TODO: Enviar evento para o firebase
                        if (AppState.currentState == "active") {
                            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                        }
                    });

	                if (!dispatched) dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: { allStations: cacheStations } });
				} else {
					// Caso tenha dado algum erro de conexão verificar para enviar o cache antigo ao invés de limpar com o cache de 6 estações
					if (dispatched && result && result.data && result.data.length) {
						dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: { allStations: result.data } });
					} else {
						dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: { allStations: cacheStations } });
					}
				}
            })
            .catch(error => {
				// Caso tenha dado algum erro de conexão verificar para enviar o cache antigo ao invés de limpar com o cache de 6 estações
				if (dispatched && result && result.data && result.data.length) {
					dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: { allStations: result.data } });
				} else {
					dispatch({ type: ALL_STATIONS_FETCH_SUCCESS, payload: { allStations: [...cacheStations] } });
				}
            });
        }
    });
};

export const getStation = (info) => (dispatch) => {
    const URL = `https://api.vagalume.fm/v2/${info}/`;

    AsyncStorage.getItem('allStations', (err, result) => {
        result = JSON.parse(result);

        if (result && result.data && result.data instanceof Array && result.expire > Date.now()) {
            const stations = result.data;

            if (stations && stations instanceof Array){
                const station = stations.find((obj) => obj.id === info) || stations.find((obj) => obj.slug === info);

                if (station) {
                    dispatch({ type: STATION_FETCH_SUCCESS, payload: { station, insertIntoAllStations: false } });
                } else {
                    axios.get(URL)
                    .then(response => {
                        if (response && response.data.id) {
                            stations.unshift(response.data);
                            AsyncStorage.setItem('allStations', JSON.stringify({ data: stations, expire: result.expire })).catch((err) => {
                                // TODO: Enviar evento para o firebase
                                if (AppState.currentState == "active") {
                                    Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                                }
                            });
                            dispatch({ type: STATION_FETCH_SUCCESS, payload: { station: response.data, insertIntoAllStations: true } });
                        }
                    }).catch(error => {
                        // TODO: Esse catch fica sem dispatch?
                    });
                }
            }
        } else {
            axios.get(URL)
            .then(response => {
                if (response && response.data.id) {
					const expire = Date.now() + (1000 * 60 * 10); // 10 minutos de cache
					AsyncStorage.setItem('allStations', JSON.stringify({ data: [response.data], expire })).catch((err) => {
                        // TODO: Enviar evento para o firebase
                        if (AppState.currentState == "active") {
                            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                        }
                    });

					dispatch({ type: STATION_FETCH_SUCCESS, payload: { station: response.data, insertIntoAllStations: true } });
                }
            }).catch(error => {
                // TODO: Esse catch fica sem dispatch?
            });
        }
    });
};
