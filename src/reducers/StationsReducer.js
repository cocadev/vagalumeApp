import {
    FEATURED_STATION_FETCH_SUCCESS,
    ALL_STATIONS_FETCH_SUCCESS,
    FOLLOWING_STATIONS_FETCH_SUCCESS,
    STATION_FETCH_SUCCESS,
    LISTENERS_FETCH_SUCCESS
} from '../actions/types';

const INITIAL_STATE = {
    followingStations: [],
    featured: [],
    allStations: [],
    station: {},
    listeners: []
};

const featuredImages = {
	'14619606471054026608': require('VagalumeFM/src/img/hotspot-14619606471054026608.png'),
	'1470154922349875': require('VagalumeFM/src/img/hotspot-1470154922349875.png'),
	'1470245767122628': require('VagalumeFM/src/img/hotspot-1470245767122628.png'),
	'14660050141766497579': require('VagalumeFM/src/img/hotspot-14660050141766497579.png'),
	'1464201608479108132': require('VagalumeFM/src/img/hotspot-1464201608479108132.png'),
	'147015499779090': require('VagalumeFM/src/img/hotspot-147015499779090.png'),
	'1470169276225492': require('VagalumeFM/src/img/hotspot-1470169276225492.png')
};

export default (state = INITIAL_STATE, action) => {
    switch (action.type) {
        case FEATURED_STATION_FETCH_SUCCESS:
			const { featured } = action.payload;
            return { ...state, featured };
        case ALL_STATIONS_FETCH_SUCCESS:
			const stations = action.payload.allStations;
            return { ...state, allStations: stations };
        case STATION_FETCH_SUCCESS:
			const { station, insertIntoAllStations } = action.payload;
			const allStations = [...state.allStations];

			if (insertIntoAllStations) {
				state.allStations.unshift(station)
				return { ...state, station, allStations };
			}

            return { ...state, station };
        case FOLLOWING_STATIONS_FETCH_SUCCESS:
            return { ...state, followingStations: action.payload };
        case LISTENERS_FETCH_SUCCESS:
            if (state.allStations instanceof Array && state.allStations.length) {
                for (let i = 0; i < state.allStations.length; i++) {
                    const station = state.allStations[i];
                    if (!action.payload[station.id]) action.payload[station.id] = 1;
                }
            }
            return { ...state, listeners: action.payload };
        default:
        return state;
    }
};
