import React, { Component } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import Icon from '../containers/Icon';
import ImageCache from '../containers/ImageCache';

const { width } = Dimensions.get('window');
const placeholderImage = require('../../img/station_placeholder.png');

class LastPlayedSong extends Component {
	relativeTime(value, isNext) {
        function checkTime(i) {
            return (i <= 9) ? `0${i}` : i;
        }

        value = new Date(value);

        const now = new Date();
        const secondsPast = (now.getTime() - value.getTime()) / 1000;

        const h = checkTime(value.getHours());
        const m = checkTime(value.getMinutes());

        if (secondsPast < 60) {
			const relative = isNext ? '' : `- TOCANDO AGORA`;
			const label = isNext ? 'TOCARÁ ÀS' : '';
            return `${label} ${h}:${m} ${relative}`;
        }

        if (secondsPast < 3600) {
			const relative = isNext ? '' : `- HÁ ${parseInt(secondsPast / 60, 10)} MIN`;
			const label = isNext ? 'TOCARÁ ÀS' : '';
            return `${label} ${h}:${m} ${relative}`;
        }

        if (secondsPast <= 86400) {
			const relative = isNext ? '' : `- HÁ ${parseInt(secondsPast / 3600, 10)} HR`;
			const label = isNext ? 'TOCARÁ ÀS' : '';
            return `${label} ${h}:${m} ${relative}`;
        }
    }

	render() {
		const { song } = this.props;
		const lastPlayedImage = song && song.img && song.img.medium ?
								{ uri: song.img.medium } :
								placeholderImage;

		return (
			<View style={styles.body} accessible={true}>
                <View>
                    <View style={styles.imageContainer}>
						<View style={{ width: 55, height: 55, backgroundColor: 'transparent' }}>
							<ImageCache source={placeholderImage} borderRadius={27.5} style={{ borderRadius: 27.5, width: 55, height: 55, position: 'absolute' }} />
							<ImageCache source={lastPlayedImage} borderRadius={27.5} style={styles.image}/>
						</View>

                    </View>
                </View>
                <View style={styles.textContainer}>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={styles.text}>{song.artist.name.toUpperCase()}</Text>
                    <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.text, { color: '#FFF' }]}>{song.title.name}</Text>
                    <View style={styles.timeContainer}>
						<Icon name="songtime" size={16} color="#7A7A7A" />
                        <Text style={styles.timeText}>{this.relativeTime(song.tsStart, this.props.isNext)}</Text>
                    </View>
                </View>
            </View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		flexDirection: 'row',
		marginTop: 10,
		marginLeft: 16,
		marginRight: 16,
		paddingBottom: 10,
		borderBottomColor: '#3d3d3d',
		borderBottomWidth: 1
	},
	imageContainer: {
		width: 55,
		height: 55,
		borderRadius: 27.5,
		backgroundColor: '#2d2d2d'
	},
	image: {
		width: 55,
		height: 55,
		borderRadius: 27.5,
		backgroundColor: 'transparent'
	},
	textContainer: {
		justifyContent: 'center',
		marginLeft: 10
	},
	text: {
		width: width - 100,
		paddingRight: 16,
		color: '#CF0',
		fontSize: 14,
		fontFamily: 'rubik'
	},
	timeContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	timeText: {
		color: '#7A7A7A',
		fontSize: 14,
		marginLeft: 4,
		fontFamily: 'rubik'
	}
});

export default LastPlayedSong;
