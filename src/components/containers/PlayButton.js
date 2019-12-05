import React, { Component } from 'react';
import { View, Image, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import { STATE_TYPE } from '../containers/Player';
import Loader from '../containers/Loader';
import Icon from '../containers/Icon';

class PlayButton extends Component {
	constructor(props) {
		super(props);

		this.state = { isPressed: false, loadingOpacity: new Animated.Value(1) };

		this._isLoading = false;
	}

	componentWillReceiveProps(nextProps) {
		const { playerStatus } = nextProps;

		if (playerStatus !== this.props.playerStatus && playerStatus === STATE_TYPE.STARTING) {
			this.startLoading();
		} else if (playerStatus !== this.props.playerStatus) {
			this.stopLoading();
		}
	}

	startLoading() {
		this._isLoading = true;
		this.loading();
	}

	stopLoading() {
		this._isLoading = false;
		this.state.loadingOpacity.stopAnimation();
		this.state.loadingOpacity.setValue(1);
	}

	loading() {
		Animated.sequence([
			Animated.timing(this.state.loadingOpacity,
				{
					toValue: 0.2,
					duration: 500
				}
			),
			Animated.timing(this.state.loadingOpacity,
				{
					toValue: 1,
					duration: 500
				}
			)
		]).start(() => {
			if (!this._isLoading) return;
			this.loading();
		});
	}

	getIconInfo() {
		const { playerStatus, green, size, isDifferent } = this.props;
		const info = {
			color: green ? '#2D2D2D' : '#FFF',
			size: green ? (size * 0.6) : size
		};

		if (playerStatus === STATE_TYPE.RUNNING || playerStatus === STATE_TYPE.STARTING) {
			if (isDifferent && playerStatus !== STATE_TYPE.STARTING) {
				info.name = "play";
			} else {
				info.name = "pause";
			}
		} else {
			info.name = "play";
		}

		return info;
	}

	onPress() {
		const { player, playerStatus, onPress } = this.props;

		if (onPress) {
			onPress();
			return;
		}

		if (!player) return;

		if (playerStatus === STATE_TYPE.RUNNING) {
			player.stop();
		} else if (playerStatus === STATE_TYPE.STOPPED) {
			player.play();
		}
	}

	renderButtonStyle() {
		const { green, size, playerStatus } = this.props;
		const iconInfo = this.getIconInfo();
		const headImage = this.state.isPressed ? require('../../img/play_bg_pressed.png') : require('../../img/play_bg.png');
		const containerStyle = { height: size, width: size, justifyContent: 'center', alignItems: 'center', elevation: 5 };
		const color = green ? '#CF0' : 'rgba(255, 255, 255, 0.2)';

		return (
			<View>
				<Animated.View style={{ elevation: 3, opacity: this.state.loadingOpacity, position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
					<Icon name="vagaHead" size={size * 0.9} color={color}  />
					{ green && <Icon name="vagaHead" size={size * 0.9} color="rgba(0, 0, 0, 0.2)" style={{ position: 'absolute', bottom: -0.2, left: -0.2, zIndex: -1 }}  />}
				</Animated.View>
				<View style={containerStyle}>
					<Icon name={iconInfo.name} size={size * 0.55} color={iconInfo.color} style={{ top: size * 0.04, left: size * 0.04 }} />
				</View>
			</View>
		);
	}

	render() {
		const { playerStatus } = this.props;
		const accessibilityText = (playerStatus === STATE_TYPE.RUNNING || playerStatus === STATE_TYPE.STARTING) ? 'Pausar estação.' : 'Tocar estação.';

		return (
			<View>
				<TouchableOpacity
				hitSlop={{ top: 10, left: 10, right: 10, bottom: 0 }}
				onPress={this.onPress.bind(this)}
				accessible={true}
				accessibilityLabel={accessibilityText}
				accessibilityTraits={'startsMedia'}
				accessibilityComponentType={'button'}>
					{this.renderButtonStyle()}
				</TouchableOpacity>
			</View>
		)
	}
}

export default PlayButton;
