import React, { Component } from 'react';
import { Text, View, Animated, StyleSheet, Easing, TouchableOpacity } from 'react-native';
import EventManager from '../containers/EventManager';

class SearchCloud extends Component {
	constructor(props) {
		super(props);

		this._scale1 = new Animated.Value(1);
		this._scale2 = new Animated.Value(1);

		this._words = [
			[{ name: 'Rock', bold: true }],
			[{ name: 'POP', bold: true }, { name: 'Gospel' }],
			[{ name: 'Lançamentos' }, { name: 'R&B', bold: true }],
			[{ name: 'Eletrônica', bold: true }, { name: 'Jazz' }],
			[{ name: 'MPB' }, { name: 'Sertanejo', bold: true }],
			[{ name: 'Punk', bold: true }, { name: 'Flashback' }],
			[{ name: 'K-Pop', bold: true }],
		];
	}

	componentDidMount() {
		this.animateWords1();
		this.animateWords2();
	}

	animateWords1() {
		Animated.sequence([
			Animated.timing(this._scale1, {
				toValue: 1.1,
				easing: Easing.linear,
				duration: 2500
			}),
			Animated.timing(this._scale1, {
				toValue: 1,
				easing: Easing.linear,
				duration: 2500
			})
		]).start(() => {
			this.animateWords1();
		});
	}

	animateWords2() {
		Animated.sequence([
			Animated.timing(this._scale2, {
				toValue: 0.9,
				easing: Easing.linear,
				duration: 2500
			}),
			Animated.timing(this._scale2, {
				toValue: 1,
				easing: Easing.linear,
				duration: 2500
			})
		]).start(() => {
			this.animateWords2();
		});
	}

	renderWords(words) {
		return words.map((word, index) => {
			const fontFamily = word.bold ? 'rubik-medium' : 'rubik-light';

			return (
				<TouchableOpacity key={index} onPress={() => {
					EventManager.trackEvent({ action: 'search_suggest_clicked', params: { word: word.name } });
					this.props.search(word.name);
				}}>
					<Animated.Text style={{ marginTop: 4, marginLeft: 8, marginRight: 8, marginBottom: 4, fontSize: 28, color: '#FFF', fontFamily, transform: [{ scale: word.bold ? this._scale1 : this._scale2 }] }}>
						{word.name}
					</Animated.Text>
				</TouchableOpacity>
			);
		});
	}

	renderCloud() {
		return this._words.map((words, index) => {
			return (
				<View key={index} style={{ flexDirection: 'row' }}>
					{this.renderWords(words)}
				</View>
			);
		});
	}

	render() {
		return (
			<View style={{ alignItems: 'center', justifyContent: 'center' }}>
				{this.renderCloud()}
			</View>
		);
	}
}

const styles = StyleSheet.create({

});

export default SearchCloud;
