import React, { Component } from 'react';
import { View, Dimensions, Linking, AsyncStorage, Platform } from 'react-native';
import { addNavigationHelpers, StackNavigator } from 'react-navigation';
import { connect } from 'react-redux';
import BackgroundTimer from 'react-native-background-timer';
import { getAllStations, getListeners, getFollowingStations, getFeatured } from './actions';
import firebase from './lib/firebase';

import HomePage from './components/home';
import SearchPage from './components/search';
import StationPage from './components/station';
import FollowingPage from './components/following';
import RecordingsPage from './components/recordings';
import Player from './components/player';
import LocalNotification from './components/containers/LocalNotification';

import DynamicLinks from '../react-native-firebase-dynamic-links';

export const AppNavigator = StackNavigator({
	Home: { screen: HomePage },
	Search: { screen: SearchPage },
	Station: { screen: StationPage },
	Following: { screen: FollowingPage },
	Recordings: { screen: RecordingsPage }
}, {
	headerMode: 'none',
	cardStyle: {
		backgroundColor: '#2d2d2d',
	},
	transitionConfig: () => ({
		transitionSpec: {
			duration: 150,
		}
	})
});

const { width, height } = Dimensions.get('window');
let initialNotification = false;

class Router extends Component {
	constructor(props) {
		super(props);

		this.state = {
			currentScreen: 'Home',
			paddingBottom: 0,
			navigator: undefined,
			playerPaddingBottom: 0
		};

		this._openedDeepLink = false;
	}

	componentWillMount() {
		this.props.getAllStations();
		this.props.getListeners();
		this.props.getFollowingStations();

		if (Platform.OS == 'android') {
			DynamicLinks.subscribe((url) => {
				if (url) {
					this.openDeepLink(url);
				}
			});
		}

		// TODO: Colocar um id para as notificações locais.
		LocalNotification.cancel();
	}

	componentDidMount() {
		if (!this.state.navigator) this.setState({ navigator: this.navigator });

		firebase.messaging().requestPermissions();

		Linking.getInitialURL().then((url) => {
			if (url) {
				this.openDeepLink(url);
			}
		});

		Linking.addEventListener('url', ({ url }) => {
			if (url) {
				this.openDeepLink(url);
			}
		});

		firebase.messaging().onMessage((notification) => {
			if (!initialNotification && notification && notification instanceof Object && notification.stationID) {
				let stationData = { id: notification.stationID };

				if (this.props.allStations && this.props.allStations.length) {
					stationData = this.props.allStations.find((obj) => obj.id === notification.stationID) || stationData;
				}

				if (stationData && this.navigator && this.navigator.dispatch) {
					this.navigator.dispatch({
						type: 'Navigation/NAVIGATE',
						routeName: 'Station',
						params: { stationData }
					});
				}
			}

			initialNotification = false;
		});


		firebase.messaging().getInitialNotification()
		.then((notification) => {
			if (notification && notification instanceof Object && notification.stationID) {
				let stationData = { id: notification.stationID };

				if (this.props.allStations && this.props.allStations.length) {
					stationData = this.props.allStations.find((obj) => obj.id === notification.stationID) || stationData;
				}

				if (stationData && this.navigator && this.navigator.dispatch) {
					this.navigator.dispatch({
						type: 'Navigation/NAVIGATE',
						routeName: 'Station',
						params: { stationData }
					});
				}

				initialNotification = true;
			}
		});
	}

	componentWillReceiveProps(nextProps) {
		const { player } = nextProps;

		if (player !== this.props.player && !this.state.paddingBottom) {
			// Tempo até a animação de abertura terminar
			setTimeout(() => {
				this.setState({ paddingBottom: 85 });
			}, 2000);
		}
	}

	openDeepLink(url) {
		if (url) {
			// Verifica se a url está com o link do Dynamic Links;
			const dynamic = url.match(/link=([^&]+)/);
			if (dynamic && dynamic.length && dynamic[1]) url = dynamic[1];

			// URL: https:vagalume.fm/slug/
			const matches = url.match(/[https|http]+\:\/\/vagalume.fm\/([\w-]+)/);
			if (matches && matches.length && matches[1]) {
				this._openedDeepLink = true;

				const slug = matches[1];
				let station = { slug };
				if (this.props.allStations) {
					station = this.props.allStations.find((obj) => obj.slug === slug) || station;
				}

				if (station && this.navigator && this.navigator.dispatch) {
					this.navigator.dispatch({
						type: 'Navigation/NAVIGATE',
						routeName: 'Station',
						params: { stationData: station }
					});
				}
			} else {
				// URL: vagalume.fm://station/slug/
				const newMatches = url.match(/^vagalumefm:\/\/([^./]+)\/([\w]+)/);
				if (newMatches && newMatches.length && newMatches[1] && newMatches[2]) {
					const type = newMatches[1];
					const value = newMatches[2];

					switch (type) {
						case 'station':
							this._openedDeepLink = true;

							if (this.navigator && this.navigator.dispatch) {
								this.navigator.dispatch({
									type: 'Navigation/NAVIGATE',
									routeName: 'Station',
									params: { stationData: { slug: value } }
								});
							}
							break;
						default:
					}
				}
			}
		}
	}

	getCurrentRouteName(navigationState) {
		if (!navigationState) return null;

		const route = navigationState.routes[navigationState.index];

		if (route.routes) return getCurrentRouteName(route);

		return route.routeName;
	}

	render() {
		const { paddingBottom } = this.state;
		return (
			<View onLayout={(e) => {
				const paddingBottom = (Dimensions.get('screen').height - e.nativeEvent.layout.height);
				if (paddingBottom !== this.state.playerPaddingBottom) this.setState({ playerPaddingBottom: paddingBottom });
			}} style={{ flex: 1, backgroundColor: '#2d2d2d' }}>
				<View style={{ flex: 1, paddingBottom }}>
					<AppNavigator
					ref={nav => { this.navigator = nav; }}
					onNavigationStateChange={(prevState, currentState) => {
						const currentScreen = this.getCurrentRouteName(currentState);
						const prevScreen = this.getCurrentRouteName(prevState);

						if (prevScreen !== currentScreen) {
							// the line below uses the Google Analytics tracker
							// change the tracker here to use other Mobile analytics SDK.
							this.setState({ currentScreen });
						}
					}}
					/>
				</View>
				<Player
				paddingBottom={this.state.playerPaddingBottom}
				lastStation={this.props.lastStation}
				navigation={this.state.navigator}
				currentScreen={this.state.currentScreen}
				/>
			</View>
		);
	}
}

const mapStateToProps = ({ nav, player, stations }) => {
	const { instance } = player;
	const { allStations } = stations;
	return { player: instance, allStations };
};

export default connect(mapStateToProps, { getAllStations, getFeatured, getListeners, getFollowingStations })(Router);
