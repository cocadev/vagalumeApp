import React, { Component } from 'react';
import { AsyncStorage } from 'react-native';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import ReduxThunk from 'redux-thunk';
import reducers from './reducers';
import Router from './Router';
import Orientation from 'react-native-orientation';
import firebase from './lib/firebase';
import { STATIONS_CACHE } from './actions/JsonCache';

class App extends Component {

	store = createStore(reducers, {}, applyMiddleware(ReduxThunk));
	state = { lastStation: {} };

	componentWillMount() {
		Orientation.lockToPortrait();

		// firebase.config().enableDeveloperMode();

		AsyncStorage.getItem('lastStation', (err, result) => {
			const lastStation = JSON.parse(result);
			if (lastStation != null && lastStation.id) {
				this.setState({ lastStation });
			} else {
				// Coloca a Vibe como a primeira estação
				const stations = STATIONS_CACHE;
				this.setState({ lastStation: stations[0] });
			}
		});
	}

	render() {
		return (
			<Provider store={this.store}>
				<Router
				lastStation={this.state.lastStation}
				/>
			</Provider>
		);
	}
}

export default App;
