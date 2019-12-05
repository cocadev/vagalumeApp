import React, { Component } from 'react';
import { View, StyleSheet, Image, Platform, Text, Animated } from 'react-native';
import IconButton from '../containers/IconButton';
import Icon from '../containers/Icon';
import StatusBarHeight from '../containers/StatusBarHeight';
import ChromecastButton from '../containers/ChromecastButton';
import EventManager from '../containers/EventManager';

class Header extends Component {
	renderCloseButton() {
		const accessibilityText = `Voltar.`;

		return (
			<IconButton
				hitSlop={{ top: 30, left: 30, right: 30, bottom: 40 }}
				size={40}
				onPress={() => {
					if (this.props.isShowingLyrics) {
						this.props.hideLyrics();
					} else {
						this.props.hidePlayer();
					}
				}}
				color="rgba(255, 255, 255, 0.2)"
				accessible={true}
				accessibilityLabel={accessibilityText}
			>
				<Animated.View style={{ transform: [ { rotate: this.props.backButtonRotation } ] }}>
					<Icon name="chevron_down" size={20} color="#FFF" />
				</Animated.View>
			</IconButton>
		);
	}

	renderChromecastButton() {
		return (
			<ChromecastButton
				onPress={() => {
					EventManager.trackEvent({
						action: 'chromecast',
						category: 'Chromecast',
						params: { event_type: 'connect', from: 'player' }
					});
				}}
			/>
		);
	}

	renderShareButton() {
		const { shareStation } = this.props;
		const accessibilityText = `Compartilhar.`;

		return (
			<IconButton
				size={40}
				onPressIn={shareStation}
				color="rgba(255, 255, 255, 0.2)"
				accessible={true}
				accessibilityLabel={accessibilityText}
			>
				<Icon name={`share_${Platform.OS}`} size={25} color="#FFF" />
			</IconButton>
		);
	}

	renderOptionsButton() {
		const { openBottomSheet } = this.props;
		const accessibilityText = `Opções.`;

		return (
			<View>
				<IconButton
					accessible={true}
					accessibilityLabel={accessibilityText}
					onPress={() => {
						openBottomSheet();
						EventManager.trackEvent({ action: 'opened_player_options', category: 'Player' });
					}}
					size={40}
					color="rgba(255, 255, 255, 0.2)"
				>
					<Icon name="options" size={25} color="#FFF" />
				</IconButton>
			</View>
		);
	}

	renderLyricsTitle() {
		const { playingSong } = this.props;
		if (playingSong && playingSong.title && playingSong.title.name) {
			return playingSong.title.name;
		}
	}

	renderLyricsArtist() {
		const { playingSong } = this.props;
		if (playingSong && playingSong.artist && playingSong.artist.name) {
			return playingSong.artist.name;
		}
	}

	render() {
		const { playingSong } = this.props.playingSong;
		return (
			<View style={styles.body}>
				<View style={styles.hideButton}>
					{this.renderCloseButton()}
					{this.renderChromecastButton()}
				</View>
				<Animated.View style={{ opacity: this.props.headerOpacity, flex: 1 }}>
					<View style={styles.logoContainer}>
						<Image style={styles.logo} source={require('../../img/fm-logo.png')} />
					</View>
					<View style={styles.optionsContent}>
						{this.renderShareButton()}
						{this.renderOptionsButton()}
					</View>
				</Animated.View>
				<Animated.View
					pointerEvents="none"
					style={{
						opacity: this.props.lyricsNameOpacity,
						position: 'absolute',
						justifyContent: 'center',
						alignItems: 'center',
						left: 0,
						right: 0,
						paddingTop: 12
					}}
				>
					<Text
						numberOfLines={1}
						style={{
							textAlign: 'center',
							fontFamily: 'rubik-medium',
							color: '#CF0',
							fontSize: 14,
							paddingLeft: 66,
							paddingRight: 50
						}}
					>
						{this.renderLyricsArtist()}
					</Text>
					<Text
						numberOfLines={1}
						style={{
							textAlign: 'center',
							fontFamily: 'rubik',
							color: '#FFF',
							fontSize: 18,
							paddingLeft: 66,
							paddingRight: 50
						}}
					>
						{this.renderLyricsTitle()}
					</Text>
				</Animated.View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		backgroundColor: 'transparent',
		height: 56,
		elevation: 2,
		position: 'absolute',
		left: 0,
		top: 0,
		right: 0,
		flexDirection: 'row',
		zIndex: 3,
		marginTop: StatusBarHeight === 0 ? 0 : StatusBarHeight
	},
	hideImage: {
		top: -2,
		width: 30,
		height: 30
	},
	hideButton: {
		position: 'absolute',
		left: 0,
		height: 56,
		width: 112,
		justifyContent: 'flex-start',
		alignItems: 'center',
		flexDirection: 'row',
		paddingLeft: 10,
		zIndex: 1
	},
	logoContainer: {
		justifyContent: 'center',
		flex: 1
	},
	logo: {
		width: 135,
		height: 40,
		alignSelf: 'center'
	},
	optionsContent: {
		position: 'absolute',
		right: 0,
		height: 56,
		width: 112,
		justifyContent: 'flex-end',
		alignItems: 'center',
		flexDirection: 'row'
	},
	optionsImage: {
		width: 25,
		height: 25
	}
});

export default Header;
