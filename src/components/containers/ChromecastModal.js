import React, { Component } from 'react';
import { Modal, Image, Text, TouchableOpacity, View, FlatList, Dimensions, TouchableWithoutFeedback } from 'react-native';
import Chromecast from '../../../react-native-chromecast';
import { STATE_TYPE } from './Player';
import Icon from './Icon';
import RadioButton from './RadioButton';
const { width } = Dimensions.get('window');
let castPlayingMedia = false; // Verifica se a estação estava tocando antes de iniciar a sessão com o Chromecast

class ChromecastModal extends Component {
	constructor(props) {
		super(props);
		this.state = {
			modalVisible: false,
			animationType: 'fade',
			transparent: true,
			deviceInfo: '',
			deviceName: '',
			session: ''
		}

		this.toggleModal = this.toggleModal.bind(this);
		this.searchDevices = this.searchDevices.bind(this);
	}

	componentWillReceiveProps(nextProps) {
		if(this.state.session != nextProps.cast.session){
			const session = nextProps.cast.session != null ? nextProps.cast.session : this.state.session;
			this.setState({ session });
		}
	}


	/** Troca automaticamente o estado de visualização do modal **/
	toggleModal() {
		this.setState({ modalVisible: !this.state.modalVisible });
	}

	/** Troca manualmente o estado de visualização do modal **/
	setModalVisible(visible) {
		this.setState({ modalVisible: visible });
	}

	/** Procura por chromecasts na rede **/
	searchDevices() {
		Chromecast.isConnected((isConnected) => {
			Chromecast.getAvailableDevices((devices) => {
				this.setState({ deviceInfo: JSON.parse(devices) });
			});
		});
	}


	/**
	 * Desconecta do device
	 * Não ẽ necessario passar o id do device pois ao desconectar, automaticamente é selecionado a rota 'Telefone'
	 **/
	disconnectToDevice() {
		Chromecast.disconnectToDevice();
        this.setState({ modalVisible: false });
	}

	/**
	 * Conecta no device
	 * @params deviceID
	 **/
	connectToDevice(deviceId) {
	 	Chromecast.connectToDevice({ id: deviceId });
		this.setState({ modalVisible: false });
	}

	/** Retorna o device que estou conectado no momento **/
	selectedDevice() {
		Chromecast.getSelectedDevice((deviceName) => {
			if(this.state.deviceName != deviceName) {
				this.setState({ deviceName });
			}
		});
	}

	/**
	 * Inicia o cast
	 * @params stationId, isPlaying
     **/
	castToDevice(stationId, isPlaying) {
		Chromecast.sendMedia({
			stationId,
			isPlaying
		});
	}

	renderItem(item, key) {
		const sourceImage = item.name == 'Telefone' ?
				'device' :
				'screen';

		const isSelected = item.name == this.state.deviceName ? true : false;

		const description = item.description != 'Chromecast' &&
							item.description
							? <Text style={styles.listSubtitle}>{item.description}</Text> :
						  	(this.state.session === 'onSessionStarting' ||
                			this.state.session === 'onSessionResuming' ||
                			this.state.session === 'CONNECTING') && isSelected
                			? <Text style={styles.listSubtitle}>Conectando-se a {item.name}</Text> :
            			 	(this.state.session === 'onSessionStarted' ||
                			this.state.session === 'onSessionResumed' ||
                			this.state.session === 'CONNECTED') && isSelected
                			? <Text style={styles.listSubtitle}>Conectado a {item.name}</Text> :
                			<View/>

		return(
			<TouchableOpacity
				key={key}
				onPress = {this.connectToDevice.bind(this, item.id)}>

				<View style={styles.listContent}>
				<View style={{ alignItems: 'flex-start'}}>
						<RadioButton isSelected={isSelected} />
					</View>
					<Icon name={sourceImage} size={20} color="#333" style={{ marginRight: 4 }} />
                    <View style={styles.listTextContent}>
						<Text style={styles.listTitle}>{item.name}</Text>
						{description}
					</View>
				</View>

			</TouchableOpacity>
			);
	}

	renderContent() {
		this.selectedDevice();

		return(
			<View>
				<Text style={styles.title}>
					TRANSMITIR PARA
				</Text>
				{
					this.state.deviceInfo ?
					this.state.deviceInfo.map((map, key) => {
						return (this.renderItem(map, key))
					}) : <View/>
				}
				<View style={styles.buttonContent}>
				<TouchableOpacity
						onPress = {this.disconnectToDevice.bind(this)}>
						{
							this.state.deviceName != 'Telefone' ?
							<View hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} >
							<Text style={styles.button.negative}>DESCONECTAR</Text>
							</View>
							: null
						}
					</TouchableOpacity>
					<TouchableOpacity
						onPress = {this.setModalVisible.bind(this, false)}>
						<View hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} >
							<Text style={styles.button.confirm}>FECHAR</Text>
						</View>
				</TouchableOpacity>
				</View>
			</View>
		);

	}

	render() {
		return(

			<Modal
				animationType={this.state.animationType}
				transparent={this.state.transparent}
				visible={this.state.modalVisible}
				onRequestClose={this.setModalVisible.bind(this, false)}>

				<TouchableWithoutFeedback
					onPress={this.setModalVisible.bind(this, false)}>
					<View style={styles.background}>

						<TouchableWithoutFeedback>
							<View style={styles.content}>

								{this.renderContent()}

							</View>
						</TouchableWithoutFeedback>

					</View>
				</TouchableWithoutFeedback>

			</Modal>

		);
	}
}

const styles = {
	background: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: 'rgba(0, 0, 0, 0.6)'
	},
	content: {
		justifyContent: 'center',
		flexDirection: 'column',
		width: width / 1.4,
		backgroundColor: '#fff',
		borderRadius: 5,
	 	padding: 16
	},
	title: {
		fontFamily: 'rubik_bold',
		color: '#333',
	 	fontSize: 15
	},
	subtitle: {
		fontFamily: 'rubik_light',
	 	fontSize: 13,
	 	marginTop: 12
	},
	buttonContent: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		marginTop: 5
	},
	button: {
		confirm: {
			fontFamily: 'rubik_medium',
			color: '#009588',
 			fontSize: 15,
 			padding: 10
 		},
 		negative: {
 			fontFamily: 'rubik_medium',
 			color: '#009588',
 			fontSize: 15,
 			padding: 10
 		}
	},
	list: {
		justifyContent: 'center'

	},
	listContent: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
		padding: 10
	},
	listTextContent: {
		flexDirection: 'column'
	},
	listTitle: {
		color: '#333',
	 	fontSize: 15,
	 	marginLeft: 3,
		fontFamily: 'rubik'
	},
	listSubtitle: {
		fontFamily: 'rubik_medium',
	 	fontSize: 10,
	 	marginLeft: 3
	}

}

export default ChromecastModal;
