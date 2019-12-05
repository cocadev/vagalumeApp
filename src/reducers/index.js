import { combineReducers } from 'redux';
import StationsReducer from './StationsReducer';
import PlayerReducer from './PlayerReducer';
import { AppNavigator } from '../Router';

const initialState = AppNavigator.router.getStateForAction(AppNavigator.router.getActionForPathAndParams('Home'));

const navReducer = (state = initialState, action) => {
	const nextState = AppNavigator.router.getStateForAction(action, state);
	return nextState || state;
};

export default combineReducers({
  stations: StationsReducer,
  player: PlayerReducer,  
  nav: navReducer
});
