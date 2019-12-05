import React, { Component } from 'react';
import { View, Dimensions, Animated, AppState, AsyncStorage, StyleSheet, Text, Image, TouchableOpacity, Platform, Linking, TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import EventManager from '../containers/EventManager';
import Icon from '../containers/Icon';
import Toast from 'react-native-root-toast';

const DeviceInfo = require('react-native-device-info');
const { width } = Dimensions.get('window');

class VersionChecker extends Component {

	state = { isShowing: false, containerHeight: new Animated.Value(0), badgeX: new Animated.Value(-width) };

	componentDidMount() {
		this.checkVersion();
	}

	checkVersion() {
		AsyncStorage.getItem('checkVersionExpire', (err, result) => {
			if (!result || result < Date.now())  {
				axios.get('https://vagalume.fm/version.json')
		        .then(response => {
					if (response && response.data && response.data instanceof Object) {
						const lastVersion = response.data[Platform.OS];
						const currentVersion = DeviceInfo.getVersion();

						if (currentVersion && lastVersion && this._compare(currentVersion, lastVersion) === -1) {
							AsyncStorage.removeItem('checkVersionExpire');
							this.open();
						} else {
							AsyncStorage.setItem('checkVersionExpire', JSON.stringify(Date.now() + (1000 * 60 * 60 * 24 * 7))).catch((err) => {
						        // TODO: Enviar evento para o firebase
						        if (AppState.currentState == "active") {
						            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
						        }
						    }); // Uma semana de cache
						}
					}
		        })
		        .catch((error) => {
		        });
			}
		});
	}

	// Retorna 1 se a > b
	// Retorna -1 se a < b
	// Retorna 0 se a == b
	_compare(a, b) {
		if (a === b) {
			return 0;
		}

		const a_components = a.split(".");
		const b_components = b.split(".");

		const len = Math.min(a_components.length, b_components.length);

		// loop enquanto o components são iguais
		for (let i = 0; i < len; i++) {
			// A maior que B
			if (parseInt(a_components[i]) > parseInt(b_components[i])) {
				return 1;
			}

			// B maior que A
			if (parseInt(a_components[i]) < parseInt(b_components[i])) {
				return -1;
			}
		}

		if (a_components.length > b_components.length) {
			return 1;
		}

		if (a_components.length < b_components.length) {
			return -1;
		}

		// São iguais
		return 0;
	}

	goStore() {
		let URL;
		if (Platform.OS === 'android') {
			URL = 'https://play.google.com/store/apps/details?id=br.com.vagalume.fm&hl=pt_BR';
		} else {
			URL = 'itms-apps://itunes.apple.com/app/id1154246231';
		}
		Linking.openURL(URL);
		EventManager.trackEvent({ action: 'badge_version_clicked', category: 'Version Checker' });
	}

	open() {
		this.setState({ isShowing: true });
		Animated.sequence([
			Animated.timing(this.state.containerHeight, {
	            toValue: 61,
	            duration: 200
	        }),
			Animated.timing(this.state.badgeX, {
	            toValue: 0,
	            duration: 200
	        })
		]).start();
	}

	close() {
		Animated.sequence([
			Animated.timing(this.state.badgeX, {
	            toValue: width,
	            duration: 200
	        }),
			Animated.timing(this.state.containerHeight, {
	            toValue: 0,
	            duration: 200
	        })
		]).start(() => {
			this.setState({ isShowing: false });
			AsyncStorage.setItem('checkVersionExpire', JSON.stringify(Date.now() + (1000 * 60 * 60 * 24 * 7))).catch((err) => {
		        // TODO: Enviar evento para o firebase
		        if (AppState.currentState == "active") {
		            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
		        }
		    }); // Uma semana de cache
		    
			EventManager.trackEvent({ action: 'badge_version_closed', category: 'Version Checker' });
		});
	}

	render() {
		if (!this.state.isShowing) return <View />;

		return (
			<Animated.View style={{ height: this.state.containerHeight }}>
				<Animated.View style={[styles.body, { transform: [{ translateX: this.state.badgeX }] }]}>
					<LinearGradient
					start={{ x: 0.0, y: 0.0 }} end={{ x: 0.8, y: 0.0 }}
					locations={[0, 1]}
					colors={['#00aacd', '#78dc55']}
					style={styles.linearGradient}>
						<View style={styles.textContainer}>
							<TouchableWithoutFeedback onPress={this.goStore.bind(this)}>
								<View style={styles.textContainer}>
									<Icon name="update" color="#FFF" size={30} />
									<Text style={styles.text}>
										Atualize para a versão mais recente
									</Text>
								</View>
							</TouchableWithoutFeedback>
						</View>
						<TouchableOpacity onPress={this.close.bind(this)}>
							<View style={styles.closeContainer}>
								<Icon name="close" color="#FFF" size={20} />
							</View>
						</TouchableOpacity>
					</LinearGradient>
				</Animated.View>
			</Animated.View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		flex: 1,
		height: 45,
		width: null,
		borderRadius: 4,
		marginTop: 16,
		marginBottom: 6,
		backgroundColor: '#0AC'
	},
	linearGradient: {
		flex: 1,
		borderRadius: 4,
		flexDirection: 'row'
	},
	closeContainer: {
		height: 39,
		width: 40,
		justifyContent: 'center',
		alignItems: 'center',
		borderBottomRightRadius: 4,
		borderTopRightRadius: 4,
		backgroundColor: 'rgba(0, 0, 0, 0.3)'
	},
	closeIcon: {
		width: 20,
		height: 20
	},
	text: {
		color: '#FFF',
		fontFamily: 'rubik-medium',
		fontSize: 13,
		backgroundColor: 'transparent'
	},
	textContainer: {
		flex: 1,
		alignItems: 'center',
		flexDirection: 'row'
	}
});

export default VersionChecker;
