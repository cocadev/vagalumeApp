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
			const allStations = [ ...state.allStations ];

			if (insertIntoAllStations) {
				state.allStations.unshift(station);
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
