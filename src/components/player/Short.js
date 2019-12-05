import React, { Component } from 'react';
import { View, StyleSheet, Dimensions, Image, Text, TouchableWithoutFeedback, Animated, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import EventManager from '../containers/EventManager';
import { STATE_TYPE } from '../containers/Player';
import { PLAYER_TYPES } from '../player/PlayerController';
import PlayButton from '../containers/PlayButton';
import Icon from '../containers/Icon';
import ProgressBar from './ProgressBar';
import IconButton from '../containers/IconButton';
import ImageCache from '../containers/ImageCache';

const { width } = Dimensions.get('window');

const backgroundBlur = Platform.OS === 'android' ? 2 : 5;

class Short extends Component {
	constructor(props) {
		super(props);

		this.state = { translateY: new Animated.Value(0), sleepTime: false };
		this.isOpened = false;
	}

	componentWillReceiveProps(nextProps) {
		const { playerInfo } = nextProps;

		if (!this.props.playerInfo.id && playerInfo.id && !this.isOpened) this.openPlayer();
	}

	openPlayer() {
		const { translateY } = this.state;
		const { playerHeight } = this.props;

		this.isOpened = true;

		Animated.timing(translateY, {
			toValue: -playerHeight,
			duration: 500
		}).start();
	}

	renderStationImage() {
		const { playerInfo } = this.props;
		let image;

		if (playerInfo && playerInfo.img && playerInfo.img.default) {
			image = (
				<ImageCache source={{ uri: playerInfo.img.default }} style={styles.image} />
			);
		}

		return (
			<View pointerEvents="none" style={styles.imageContainer}>
				{image}
			</View>
		);
	}

	renderPlayerInfo() {
		const { playerInfo, playingSong, playerStatus } = this.props;
		let songInfo = '';

		if (playingSong && playingSong.title.id) {
			songInfo = `${playingSong.title.name} - ${playingSong.artist.name}`;
		} else if (playerStatus === STATE_TYPE.STARTING) {
			songInfo = 'Carregando...';
		} else if (playerStatus === STATE_TYPE.RUNNING) {
			songInfo = 'Você está ouvindo';
		} else {
			songInfo = 'Estação';
		}

		if (playerStatus === STATE_TYPE.STOPPED || playerStatus === STATE_TYPE.IDLE) {
			songInfo = 'Estação';
		}

		return (
			<View pointerEvents="none" style={styles.infoContainer} accessible={true} accessibilityTraits={'button'} accessibilityComponentType={'button'}>
				<Text numberOfLines={1} style={[styles.infoText]}>{songInfo}</Text>
				<Text numberOfLines={1} style={[styles.infoText, styles.infoStationName]}>{playerInfo.name}</Text>
			</View>
		)
	}

	renderControlButton() {
		const { playerInstance, playerStatus } = this.props;
		return (
			<View style={{ marginLeft: 5 }}>
				<PlayButton
				player={playerInstance}
				playerStatus={playerStatus}
				size={30}
				/>
			</View>
		)
	}

	renderBackground() {
		const { playerInfo, playerHeight } = this.props;

		let image = (
			<View style={[styles.background, { height: playerHeight }]} />
		);

		if (playerInfo && playerInfo.img && playerInfo.img.default) {
			image = (
				<Image
				blurRadius={backgroundBlur}
				source={{ uri: playerInfo.img.default, cache: 'force-cache' }}
				style={[styles.background, { height: playerHeight }]}
				/>
			);
		}

		return (
			<TouchableWithoutFeedback onPress={() => {
				this.props.openPlayer();
				EventManager.trackEvent({ action: 'opened_player', category: 'Player' });
			}}>
				{image}
			</TouchableWithoutFeedback>
		);
	}


	renderOpenButton() {
		const accessibilityText = `Abrir player.`;
		return (
			<View pointerEvents="none" accessible={true} accessibilityComponentType={'button'} accessibilityComponentType={'button'} accessibilityLabel={accessibilityText}>
				<Icon name="chevron_up" size={18} color="#FFF" style={styles.openButton} />
			</View>
		)
	}

	renderProgressBar() {
		const { playingSong, playerStatus, playerInfo } = this.props;
		return (
			<View style={styles.progressContainer}>
				<ProgressBar
				playingSong={playingSong}
				status={playerStatus}
				playerInfo={playerInfo}
				size={width}
				/>
			</View>
		);
	}

	renderSleepButton() {
		const { sleepTime } = this.props;
		const accessibilityText = 'Modo Soneca.';
		if (sleepTime) {
			return (
				<IconButton
					accessible={true}
	                accessibilityLabel={accessibilityText}
					onPress={this.props.toggleSleepModal.bind(this)}
					hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
					color="#555"
					size={30}>
					<View style={{ marginRight: 5 }}><Icon name="sleep_on" size={23} color="#FFF" /></View>
				</IconButton>
			)
		}
	}

	renderRecordButton() {
		const { playerType } = this.props;

		if (playerType === PLAYER_TYPES.STREAM) {
			return this.props.renderRecordButton(18, 5);
		}
	}

	render() {
		const { translateY } = this.state;
		const { playerHeight, shadowHeight } = this.props;

		return (
			<View style={[styles.body, { height: playerHeight + shadowHeight }]}>
				<LinearGradient
				colors={['rgba(10, 10, 10, 0)', 'rgba(10, 10, 10, 0.4)']}
				style={{
					height: shadowHeight,
					backgroundColor: 'transparent',
					width
				}}
				/>
				<View style={[styles.container, { height: playerHeight }]}>
					{this.renderProgressBar()}
					{this.renderOpenButton()}
					{this.renderBackground()}
					{this.renderStationImage()}
					{this.renderPlayerInfo()}
					{this.renderSleepButton()}
					{this.renderRecordButton()}
					{this.renderControlButton()}
				</View>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	body: {
		bottom: 0,
		width,
		zIndex: -1
	},
	background: {
		zIndex: -1,
		width,
		position: 'absolute',
		left: 0,
		top: 0,
		opacity: 0.2
	},
	container: {
		width,
		backgroundColor: '#1d1d1d',
		flexDirection: 'row',
		alignItems: 'center',
		paddingRight: 10,
		paddingLeft: 10
	},
	imageContainer: {
		width: 30,
		height: 30,
		borderRadius: 15,
		marginRight: 10,
		backgroundColor: '#2d2d2d'
	},
	image: {
		width: 30,
		height: 30,
		borderRadius: 15
	},
	infoText: {
		fontSize: 12,
		marginRight: 10,
		color: '#FFF',
		fontFamily: 'rubik',
		backgroundColor: 'transparent'
	},
	infoContainer: {
		justifyContent: 'space-around',
		flex: 1
	},
	infoStationName: {
		color: '#CF0'
	},
	progressContainer: {
		height: 1.5,
		width,
		position: 'absolute',
		top: 0
	},
	openButton: {
		backgroundColor: 'transparent',
		marginRight: 10
	}
});

export default Short;
