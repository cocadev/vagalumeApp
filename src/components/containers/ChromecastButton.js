import React, { Component } from 'react';
import { View, Image, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
import IconButton from './IconButton';
import ChromecastModal from './ChromecastModal';
import Icon from './Icon';
import Chromecast from '../../../react-native-chromecast';
import { setCastSession } from '../../actions';
import { connect } from 'react-redux';
const ToastAndroid = require('ToastAndroid');

class ChromecastButton extends Component {
	constructor(props) {
		super(props);

		this.state = {
			chromecastSession: '',
			chromecastAvailable: false
		};

		this.opacityValue = new Animated.Value(0);
		this._isPulsing = false;
	}

	componentDidMount() {
		this.getAvailableDevices();
	}

	componentWillReceiveProps(nextProps) {
		if (this.props != nextProps) {
			// Monitora a sessão, caso a sessão adicione ou remova rotas, é	solicitado a verificação da visibilidade do botão de cast.
			if (
				(nextProps.cast.session == 'onRouteAdded' && !this.state.chromecastAvailable) ||
				(nextProps.cast.session == 'onRouteRemoved' && this.state.chromecastAvailable)
			) {
				this.getAvailableDevices();
			} else if (
				nextProps.cast.session === 'onSessionStarting' ||
				nextProps.cast.session === 'onSessionResuming'
			) {
				this.opacity();
			} else if (
				nextProps.cast.session === 'onSessionEnded' ||
				nextProps.cast.session === 'onSessionResumeFailed' ||
				nextProps.cast.session === 'onSessionSuspended'
			) {
				this.resetOpacity();
			}

			this.setState({ chromecastSession: nextProps.cast.session });
		}
	}

	opacity() {
		this.opacityValue.setValue(0);
		Animated.timing(this.opacityValue, {
			toValue: 1,
			duration: 1000,
			easing: Easing.linear
		}).start(() => {
			if (
				this.state.chromecastSession === 'onSessionStarting' ||
				this.state.chromecastSession === 'onSessionResuming'
			) {
				this.opacity();
			}
		});
	}

	resetOpacity() {
		this.opacityValue.stopAnimation();
		this.opacityValue.setValue(1);
	}

	/** Função responsavel por ativar a visibilidade do botão de cast **/
	getAvailableDevices() {
		Chromecast.getAvailableDevices((devices) => {
			const devicesArray = JSON.parse(devices);
			// Verifica a quantidade de rotas disponiveis, caso retorno somente a rota 'Telefone' esconde o botão de cast.
			if (Object.keys(devicesArray) instanceof Array && Object.keys(devicesArray).length > 1) {
				Chromecast.connectionStatus((status) => {
					if (!this.state.chromecastSession) {
						this.setState({ chromecastAvailable: true, chromecastSession: status });
					} else {
						this.setState({ chromecastAvailable: true });
					}
				});
			} else {
				this.setState({ chromecastAvailable: false });
			}
		});
	}

	/** Abre o modal (@class ChromecastModal.js) **/
	searchChromecastDevices() {
		this.modal.searchDevices();
		this.modal.toggleModal();

		if (this.props.onPress) this.props.onPress();
	}

	/** Renderiza o modal (@class ChromecasModal.js) **/
	renderChromecastModal() {
		const { cast, status, playerInfo } = this.props;

		return (
			<ChromecastModal
				cast={cast}
				status={status}
				playerInfo={playerInfo}
				ref={(modal) => (this.modal = modal)}
			/>
		);
	}

	render() {
		if (this.state.chromecastAvailable) {
			const opacity = this.opacityValue.interpolate({
				inputRange: [ 0, 0.5, 1 ],
				outputRange: [ 1, 0, 1 ]
			});

			const castAndroid =
				this.state.chromecastSession === 'onSessionStarted' ||
				this.state.chromecastSession === 'onSessionResumed' ||
				this.state.chromecastSession === 'CONNECTED'
					? 'cast_connected'
					: 'cast_available';

			return (
				<Animated.View style={{ opacity }}>
					<IconButton
						onPress={this.searchChromecastDevices.bind(this)}
						size={40}
						color="rgba(255, 255, 255, 0.2)"
					>
						<View>
							<Icon name={castAndroid} size={25} color="#FFF" />
						</View>
					</IconButton>
					{this.renderChromecastModal()}
				</Animated.View>
			);
		} else {
			return <View />;
		}
	}
}

const mapStateToProps = ({ player }) => {
	const { cast, status, playerInfo } = player;
	return { cast, status, playerInfo };
};

export default connect(mapStateToProps, { setCastSession }, null, { withRef: true })(ChromecastButton);
