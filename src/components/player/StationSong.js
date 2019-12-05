import React, { Component } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MarqueeText from '../containers/MarqueeText';

const { width } = Dimensions.get('window');

class StationSong extends Component {
	renderArtistName() {
		const { song } = this.props;
		let text = 'VAGALUME.FM';

		if (song && song.artist && song.artist.id) text = song.artist.name.toUpperCase();

		return (
			<Text numberOfLines={1} style={styles.artist}>{text}</Text>
		)
	}

	renderSongName() {
		const { song, station } = this.props;
		let text = station && station.name;
		if (song && song.title && song.title.id) text = song.title.name;

		return (
			<MarqueeText width={width} style={styles.song} text={text} />
		)
	}

	render() {
		return (
			<View style={styles.body} accessible={true} accessibilityLiveRegion={'polite'} accessibilityTraits={'frequentUpdates'}>
				{this.renderArtistName()}
				{this.renderSongName()}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 12
	},
	artist: {
		fontFamily: 'rubik-bold',
		fontSize: width > 560 ? 22 : 16,
		color: '#CF0',
		textAlign: 'center',
		marginBottom: width > 560 ? 9 : 3,
		paddingLeft: 16,
		paddingRight: 16,
		backgroundColor: 'transparent'
	},
	song: {
		textAlign: 'center',
		fontSize: width > 560 ? 28 : 22,
		paddingTop: width > 560 ? 6 : 0,
		color: '#FFF',
		backgroundColor: 'transparent'
	}
})

export default StationSong;
