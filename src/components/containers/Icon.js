import React, { Component } from 'react';
import { Platform } from 'react-native';
import { createIconSet } from 'react-native-vector-icons';
const glyphMap = {
	'recording': '\uE900',
	'stream_live': '\uE901',
	'chevron_up': '\uE902',
	'chevron_down': '\uE903',
	'chevron_left': '\uE904',
	'chevron_right': '\uE905',
	'search': '\uE906',
	'full_checked': '\uE907',
	'checked': '\uE908',
	'like_off': '\uE909',
	'cast_available': '\uE90A',
	'cast_connected': '\uE90B',
	'close': '\uE90C',
	'dislike_off': '\uE90D',
	'like_on': '\uE90E',
	'dislike_on': '\uE90F',
	'play': '\uE910',
	'live': '\uE911',
	'heart_off': '\uE912',
	'heart_on': '\uE913',
	'home': '\uE914',
	'clock': '\uE915',
	'quote': '\uE916',
	'options': '\uE917',
	'rec': '\uE918',
	'pause': '\uE919',
	'previous': '\uE91A',
	'next': '\uE91B',
	'rec_on': '\uE91C',
	'rec_off': '\uE91D',
	'share_ios': '\uE91E',
	'songtime': '\uE91F',
	'repeat': '\uE920',
	'repeat_one': '\uE921',
	'share_android': '\uE922',
	'update': '\uE923',
	'sleep': '\uE924',
	'screen': '\uE925',
	'device': '\uE926',
	'listeners': '\uE927',
	'vagalume': '\uE928',
	'vagalume_fm': '\uE929',
	'vagalume_rec': '\uE92A',
	'sleep_on': '\uE92B',
	'song': '\uE92C',
	'vagaHead': '\uE92d'
};

const IconContent = createIconSet(glyphMap, 'vagalumeFM_icons');

class Icon extends Component {
	render() {
		const { style, name, color, size } = this.props;
		return (
			<IconContent name={name} color={color} style={[{ backgroundColor: 'transparent' }, style]} size={size + 3} />
		);
	}
}

export default Icon;
