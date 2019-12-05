import React, { Component } from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { PLAYER_TYPES } from './PlayerController';
import NavigateStation from './NavigateStation';
import EventManager from '../containers/EventManager';
import ImageCache from '../containers/ImageCache';

const { height, width } = Dimensions.get('window');

const cSize = height > 550 ? width * 0.75 : width * 0.6;

let nextPreviousTimeOut = null;

class StationImage extends Component {
	shouldComponentUpdate(nextProps) {
		const { song, station } = this.props;
		if (nextProps.song !== song || nextProps.station.id !== station.id) {
			return true;
		}

		return false;
	}

	renderIcon() {
		const { song, station } = this.props;
		if (station.id && song.title && song.title.id) {
			return (
				<View style={[styles.iconContent, styles.imageIcon]}>
					<ImageCache source={{ uri: station.img.icon }} style={styles.imageIcon} />
				</View>
			);
		}
	}

	render() {
		const { station, song, navigateStation, playerType, isRecording, stopRecording } = this.props;
		const SIZE = cSize * 0.6;
		let image;
		let navigate;

		if (song && song.title && song.title.id) {
			image = (
				<ImageCache source={{ uri: song.img.medium }} style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2 }} />
			);
		} else if (station && station.img && station.img.default) {
			image = (
				<ImageCache source={{ uri: station.img.default }} style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2 }} />
			);
		}

		if (playerType !== PLAYER_TYPES.OFFLINE) {
			navigate = (
				<View style={[StyleSheet.absoluteFill, styles.navigateContainer]}>
					<NavigateStation
					onPress={() => {
						const { isRecording } = this.props;
						EventManager.trackEvent({ action: 'clicked_previous_button', category: 'Player' });

						if (isRecording) {
							stopRecording();
							clearTimeout(nextPreviousTimeOut);
							nextPreviousTimeOut = setTimeout(() => {
								navigateStation({ nextPrevious: 'previous' });
							}, 400);
						} else {
							navigateStation({ nextPrevious: 'previous' });
						}
					}}
					/>
					<NavigateStation
					onPress={() => {
						const { isRecording } = this.props;
						EventManager.trackEvent({ action: 'clicked_next_button', category: 'Player' });

						if (isRecording) {
							stopRecording();
							clearTimeout(nextPreviousTimeOut);
							nextPreviousTimeOut = setTimeout(() => {
								navigateStation({ nextPrevious: 'next' });
							}, 400);
						} else {
							navigateStation({ nextPrevious: 'next' });
						}
					}}
					isNext
					/>
				</View>
			);
		}

		return (
			<View style={{ width, maxHeight: cSize, alignItems: 'center' }}>
				<Image resizeMode="contain" source={require('../../img/waves.png')} style={styles.waves} />
				<View style={styles.imageBody}>
					<View style={{ width: SIZE, height: SIZE, borderRadius: SIZE / 2 }}>
						{image}
						{this.renderIcon()}
					</View>
				</View>
				{navigate}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	waves: {
		maxWidth: cSize,
		maxHeight: cSize
	},
	imageBody: {
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		right: 0,
		justifyContent: 'center',
		alignItems: 'center'
	},
	imageIcon: {
		width: 60,
		height: 60,
		borderRadius: 30,
	},
	iconContent: {
		position: 'absolute',
		right: 0,
		bottom: 0
	},
	navigateContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center'
	}
});

export default StationImage;
