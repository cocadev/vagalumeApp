import React, { Component } from 'react';
import {
	View,
	Text,
	TextInput,
	Keyboard,
	Animated,
	AsyncStorage,
	StyleSheet,
	Image,
	TouchableOpacity
} from 'react-native';
import StatusBarHeight from '../containers/StatusBarHeight';
import Icon from '../containers/Icon';
import Loader from './Loader';

class Input extends Component {
	constructor(props) {
		super(props);

		this.state = {
			text: '',
			blurPlaceholder: new Animated.Value(0.5),
			searchInputMargin: new Animated.Value(7),
			blurButtonOpacity: new Animated.Value(0)
		};

		this.blur = this.blurSearchInput.bind(this);
		this.setText = this.onSetText.bind(this);
	}

	onSetText(text) {
		this.focusSearchInput();
		setTimeout(() => {
			this.onChangeText(text);
		}, 300);
	}

	backPage() {
		if (this.state.text) {
			this.blurSearchInput();
			return false;
		} else {
			this.props.navigation.goBack();
			return true;
		}
	}

	focusSearchInput() {
		Animated.parallel([
			Animated.timing(this.state.searchInputMargin, {
				toValue: 0,
				duration: 300
			}),
			Animated.timing(this.state.blurButtonOpacity, {
				toValue: 1,
				duration: 200,
				delay: 300
			}),
			Animated.timing(this.state.blurPlaceholder, {
				toValue: 0,
				duration: 200
			})
		]).start();
	}

	blurSearchInput(saveInstanceState) {
		if (saveInstanceState && this.state.text.length > 0) {
			Keyboard.dismiss();
			return;
		}

		if (this.input) this.input.blur();

		this.onChangeText('');

		setTimeout(() => {
			Animated.parallel([
				Animated.timing(this.state.searchInputMargin, {
					toValue: 7,
					duration: 300
				}),
				Animated.timing(this.state.blurButtonOpacity, {
					toValue: 0,
					duration: 200
				}),
				Animated.timing(this.state.blurPlaceholder, {
					toValue: 0.5,
					duration: 200
				})
			]).start(() => {
				AsyncStorage.getItem('recentSearch', (err, result) => {
					if (result != null) {
						const recentList = JSON.parse(result);
						this.setState({ recentList });
					}
				});
			});
		}, 100);
	}

	onChangeText(text) {
		this.setState({ text });
		this.props.search(text);
	}

	clearSearch() {
		this.setState({ text: '' });

		setTimeout(() => {
			this.blurSearchInput();
		}, 10);
	}

	renderBackButton() {
		const accessibilityText = `Voltar.`;

		return (
			<TouchableOpacity
				hitSlop={{ top: 30, left: 30, bottom: 30, right: 0 }}
				onPress={this.backPage.bind(this)}
				style={styles.backButton}
				accessible={true}
				accessibilityLabel={accessibilityText}
				accessibilityTraits={'button'}
				accessibilityComponentType={'button'}
			>
				<Icon name="chevron_left" size={16} color="#FFF" />
			</TouchableOpacity>
		);
	}

	renderPlaceholder() {
		return (
			<Animated.View
				pointerEvents="none"
				style={[
					styles.placeholderContainer,
					{ opacity: this.state.blurPlaceholder, transform: [ { translateX: 20 } ] }
				]}
			>
				<Text pointerEvents="none" style={styles.placeholder}>
					O que você deseja ouvir?
				</Text>
			</Animated.View>
		);
	}

	renderInput() {
		return (
			<Animated.View style={{ margin: this.state.searchInputMargin, flex: 1 }}>
				<TextInput
					ref={(input) => {
						this.input = input;
					}}
					onFocus={this.focusSearchInput.bind(this)}
					returnKeyType="search"
					underlineColorAndroid="transparent"
					style={styles.input}
					onChangeText={this.onChangeText.bind(this)}
					value={this.state.text}
				/>
			</Animated.View>
		);
	}

	renderClearButton() {
		if (this.state.text) {
			return (
				<TouchableOpacity
					hitSlop={{ top: 30, left: 20, right: 30, bottom: 30 }}
					onPress={this.clearSearch.bind(this)}
					style={styles.clearButton}
				>
					<Animated.View style={{ opacity: this.state.blurButtonOpacity }}>
						<Icon name="close" size={16} color="#FFF" />
					</Animated.View>
				</TouchableOpacity>
			);
		}
	}

	render() {
		return (
			<View style={styles.body}>
				<View style={styles.container}>
					{this.renderBackButton()}
					{this.renderPlaceholder()}
					{this.renderInput()}
					{this.renderClearButton()}
				</View>
				{this.props.loading && <Loader />}
			</View>
		);
	}
}

const barHeight = 56;

const styles = StyleSheet.create({
	body: {
		height: barHeight + 1 + StatusBarHeight,
		paddingTop: StatusBarHeight,
		backgroundColor: '#333'
	},
	container: {
		height: barHeight,
		backgroundColor: '#333',
		elevation: 2
	},
	backButton: {
		paddingLeft: 12,
		position: 'absolute',
		zIndex: 1,
		height: barHeight,
		justifyContent: 'center'
	},
	backImage: {
		width: 26,
		height: 26
	},
	placeholderContainer: {
		position: 'absolute',
		zIndex: 1,
		left: 20,
		height: barHeight,
		justifyContent: 'center'
	},
	placeholder: {
		fontFamily: 'rubik',
		color: '#FFF',
		fontSize: 14,
		backgroundColor: 'transparent'
	},
	input: {
		flex: 1,
		backgroundColor: '#3c3c3c',
		borderRadius: 5,
		color: '#FFF',
		paddingLeft: 43,
		paddingRight: 40,
		height: barHeight
	},
	clearButton: {
		position: 'absolute',
		zIndex: 1,
		height: barHeight,
		right: 6,
		alignItems: 'center',
		justifyContent: 'center',
		width: 30
	}
});

export default Input;
