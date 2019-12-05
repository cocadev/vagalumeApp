import React, { Component } from 'react';
import { View, Image, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Icon from '../containers/Icon';

class StationName extends Component {
	renderSleepTime() {
		let { sleepTime } = this.props;
        const date = sleepTime && sleepTime.dateTime ? new Date(sleepTime.dateTime) : null;
        const time = date ? this.toStringTime(date) : null;

		if (sleepTime) {
			return (
				<View style={{ marginTop: 5, padding: 3, backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: 5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} accessible={true} accessibilityLiveRegion={'polite'} accessibilityTraits={'frequentUpdates'}>
					<Icon name="sleep_on" size={14} color="#FFF" style={{ marginRight: 3 }} />
					<Text style={[styles.text, { fontSize: 12, marginRight: 3 }]}>{time}</Text>
				</View>
			);
		}
	}

	toStringTime(time) {
		let h = time.getHours();
		let m = time.getMinutes();

		h = h < 10 ? `0${h}` : h;
		m = m < 10 ? `0${m}` : m;

		return `${h}:${m}`;
	}

	render() {
		const { station } = this.props;
		return (
			<TouchableWithoutFeedback onPress={this.props.goStation.bind(this, station)}>
				<View style={styles.body}>
					<View style={styles.name} accessible={true} accessibilityLiveRegion={'polite'} accessibilityTraits={'frequentUpdates'}>
						<Icon name="live" size={12} color="#CF0" style={{ marginRight: 5 }} />
						<Text style={styles.text}>{station.name && station.name.toUpperCase()}</Text>
					</View>
					{this.renderSleepTime()}
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: -30
	},
	name: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	text: {
		color: '#FFF',
		fontSize: 14,
		fontFamily: 'rubik-medium',
		backgroundColor: 'transparent'
	}
});

export default StationName;
