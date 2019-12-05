import React, { Component } from 'react';
import { View, Animated, StyleSheet, TouchableWithoutFeedback, BackHandler } from 'react-native';

class Modal extends Component {
	constructor(props) {
		super(props);

		this.state = { opacity: new Animated.Value(0) };
		this._backHandler = () => {
			this.closeModal();
			setTimeout(() => {
				BackHandler.removeEventListener('hardwareBackPress', this._backHandler);
			}, 50);
			return true;
		}
		this.hide = this.closeModal.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		const { visible } = this.props;
		if (nextProps.visible !== visible) {
			this.toggleModal(nextProps.visible);
		}
	}

	componentDidMount() {
		BackHandler.addEventListener('hardwareBackPress', this._backHandler);
	}

	componentWillUnmount() {
		BackHandler.removeEventListener('hardwareBackPress', this._backHandler);
	}

	toggleModal(visible) {
		const { opacity } = this.state;

		if (visible) {
			BackHandler.addEventListener('hardwareBackPress', this._backHandler);
		} else {
			BackHandler.removeEventListener('hardwareBackPress', this._backHandler);
		}

		Animated.timing(opacity, {
			toValue: visible ? 1 : 0,
			duration: 200
		}).start();
	}

	closeModal(cb) {
		this.toggleModal(false);
		setTimeout(() => {
			this.props.onRequestClose();
			if (cb) cb();
		}, 200);
	}

	render() {
		const { opacity } = this.state;
		return this.props.visible ? (
			<Animated.View style={[{ opacity }, styles.body]}>
				<TouchableWithoutFeedback onPress={this.closeModal.bind(this, null)}>
					<View style={[styles.backdrop]} />
				</TouchableWithoutFeedback>
				{this.props.children}
			</Animated.View>
		) : (<View />);
	}
}

const styles = StyleSheet.create({
	body: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		top: 0,
		zIndex: 99999,
		elevation: 9,
		flexDirection: 'column',
		justifyContent: 'center',
		alignItems: 'center'
	},
	backdrop: {
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		top: 0,
	}
});

export default Modal;
