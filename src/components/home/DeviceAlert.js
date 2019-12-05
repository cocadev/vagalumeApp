import React, { Component } from 'react';
import { View, StyleSheet, Text, Animated, Dimensions, Platform, TouchableWithoutFeedback, Image, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import RNFS from 'react-native-fs';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

class DeviceAlert extends Component {
	constructor(props) {
		super(props);

		this.state = { isShowing: false, badgeX: new Animated.Value(0), containerHeight: new Animated.Value(0) };
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
		});
	}

	componentDidMount() {
		const model = DeviceInfo.getModel().toUpperCase();
		const androidVersion = DeviceInfo.getSystemVersion();

		RNFS.getFSInfo().then(storage => {
			const { totalSpace, freeSpace } = storage;
			const percent = (freeSpace/totalSpace) * 100;

			// Por enquanto a mensagem só irá aparecer nos celulares modelo LG K10 com storage abaixo de 25% e Android 6.0
			if (Platform.OS == 'android' && model.indexOf('K10') > -1 && androidVersion.indexOf('6.0') > -1 && percent <= 25) {
				this.open();
			}
		});
	}

	goSlaask() {
		Linking.openURL('https://vagalume-fm.slaask.help/general/por-que-o-vagalume-fm-nao-funciona-corretamente-no-meu-celular');
		this.close();
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
							<TouchableWithoutFeedback onPress={this.goSlaask.bind(this)}>
								<View style={[styles.textContainer, { paddingLeft: 10, paddingRight: 10 }]}>
									<Image source={require('../../img/broom.png')} style={{ width: 26, height: 26, marginRight: 10 }} />
									<Text style={styles.text}>
										 Notamos que você está com pouco espaço disponível. Saiba mais >
									</Text>
								</View>
							</TouchableWithoutFeedback>
						</View>
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
	textContainer: {
		flex: 1,
		alignItems: 'center',
		flexDirection: 'row'
	},
	text: {
		color: '#FFF',
		fontFamily: 'rubik-medium',
		fontSize: 13,
		backgroundColor: 'transparent'
	}
});

export default DeviceAlert;
