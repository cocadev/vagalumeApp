import React, { Component } from 'react';
import { Animated, View, Image, Easing } from 'react-native';
import Icon from '../containers/Icon';

class Loader extends Component {
	componentWillMount() {
		this._animatedValue = new Animated.Value(0);
	}

	componentDidMount() {
		this.spin();
	}

	spin() {
		Animated.sequence([
			Animated.timing(this._animatedValue, {
				toValue: 1,
				duration: 700,
				easing: Easing.linear
			}),
			Animated.timing(this._animatedValue, {
				toValue: 2,
				duration: 700,
				easing: Easing.linear
			}),
			Animated.timing(this._animatedValue, {
				toValue: 0,
				duration: 0,
				easing: Easing.linear
			})
		]).start(() => {
			this.spin();
		});
	}

	render() {
		const { size } = this.props;
		const interpolatedRotateAnimation = this._animatedValue.interpolate({
			inputRange: [ 0, 1 ],
			outputRange: [ '0deg', '360deg' ]
		});

		return (
			<View
				style={{
					width: size,
					height: size,
					borderColor: '#444',
					borderWidth: 2,
					borderRadius: size / 2,
					justifyContent: 'center',
					alignItems: 'center'
				}}
			>
				{interpolatedRotateAnimation != null && (
					<Animated.Image
						source={require('../../img/spinner_big.png')}
						style={{
							width: size,
							height: size,
							transform: [ { rotate: interpolatedRotateAnimation } ]
						}}
					/>
				)}
				<View
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						right: 0,
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<Icon name="vagalume_fm" size={size / 2} color="#CF0" />
				</View>
			</View>
		);
	}
}

export default Loader;
