import React, { Component } from 'react';
import {
	Image,
	Text,
	TouchableWithoutFeedback,
	View,
	ScrollView,
	StyleSheet,
	Dimensions
} from 'react-native';
import { connect } from 'react-redux';
const { width, height } = Dimensions.get('window');
import Modal from './Modal';
import ScrollPicker from './ScrollPicker';
import Button from './Button';
import LocalNotification from './LocalNotification';
import Icon from './Icon';
import Toast from 'react-native-root-toast';
import EventManager from './EventManager';

class SleepModal extends Component {
	constructor(props) {
		super(props);
		this.state = {
			modalVisible: false,
			transparent: true,
			sleepTime: null
		}

		this.toggleModal = this.toggleModal.bind(this);

		this.hrs = [];  // Array com valores de horas a serem consumidos no scrollview
		this.minutes = []; // Array com valores de minutos a serem consumidos no scrollview

		this.createArray(0, this.minutes, true); // Cria a array com os valores dos minutos
		this.createArray(0, this.hrs, false); // Cria a array com os valores das horas

		this._currentTime = null; // Horario atual

		this._initialHrsPosition = 0; // Index inicial da hora (00 Hrs)
		this._initialMinPosition = 6; // Index inicial dos minutos (30 min)

		this._msHrs = null; // Horas convertido em ms
		this._msMinutes = null; // Minutos convertidos em ms

		this._minuteMillisecondsUnit = 60000; // Valor de 1 minuto em milisegundos
		this._minuteHoursUnit = 60 // Valor de 1 hora em minutos
	}

	componentWillReceiveProps(nextProps) {
		const { sleepTime } = nextProps;

		if (this.state.sleepTime !== sleepTime) this.setState({ sleepTime });
	}

	createArray(time, array, isMinute) {
		if (isMinute && time >= 0 && time <= 50 && array instanceof Array) {
			const min = time <= 9 ? `0${time} min` : `${time} min`;
			array.push(min);
			this.createArray(time + 5, array, isMinute);
		} else if (time >= 0 && time <= 24 && array instanceof Array) {
			const hrs = time <= 9 ? time <= 1 ? `0${time} Hr`
								: `0${time} Hrs` : `${time} Hrs`;
			array.push(hrs);
			this.createArray(time+1, array, isMinute);
		}
	}

	convertToMs(time, isMinute) {
		if (typeof time === 'number') {

			const ms = isMinute ?
				time * this._minuteMillisecondsUnit :
				(time * this._minuteHoursUnit) * this._minuteMillisecondsUnit;
			return ms;
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

	renderTitle() {
		let { sleepTime } = this.state;
        const date = sleepTime && sleepTime.dateTime ? new Date(sleepTime.dateTime) : null;
        const time = date ? this.toStringTime(date) : null;

		return (
			<View>
				<Text style={ styles.title }>Modo Soneca</Text>
				<Text style={{ marginTop: 5, fontFamily: 'rubik-light' }}>Defina um tempo, nós iremos parar a música para você.</Text>
				{time && <Text style={{ fontFamily: 'rubik-bold', marginTop: 5 }}>
                        Definido para às {time}
                    </Text>}
				{!time && <Text style={{ fontFamily: 'rubik-light', marginTop: 5 }}>Parar de tocar daqui há:</Text>}
			</View>
		)
	}

	renderItem(data, isSelected) {
		const textColor = isSelected ? (this.state.sleepTime ? '#AAA' : '#333') : '#d8d8d8'
		return (
			<View style={{ width:90 , alignItems: 'center', justifyContent: 'center' }}>
				<Text style={[styles.timePickerText, {color: textColor}]}>{data}</Text>
			</View>)
	}

	renderTime() {
		this._currentTime = new Date();
		const { sleepTime } = this.state;
		const scrollGesture = sleepTime ? false : true;
		this._initialHrsPosition = sleepTime && sleepTime.hourIndex ? sleepTime.hourIndex : this._initialHrsPosition;
		this._initialMinPosition = sleepTime && sleepTime.minuteIndex ? sleepTime.minuteIndex : this._initialMinPosition;

		if (!sleepTime) {
			return (
				<View style={ styles.timePickerContent }>
					<ScrollPicker
						ref={(hr) => {this.hr = hr}}
						dataSource={this.hrs}
						selectedIndex={this._initialHrsPosition}
						itemHeight={50}
						wrapperHeight={150}
						highlightColor={'#d8d8d8'}
						scrollEnabled={scrollGesture}
						renderItem={(data, index, isSelected) => {
							return this.renderItem(data, isSelected);
						}}
						onValueChange={(data, selectedIndex) => {
							this._msHrs = this.convertToMs(selectedIndex, false);
						}}/>
					<Text style={styles.timePickerText}>:</Text>
					<ScrollPicker
						ref={(min) => {this.min = min}}
						dataSource={this.minutes}
						selectedIndex={this._initialMinPosition}
						scrollEnabled={scrollGesture}
						itemHeight={50}
						wrapperHeight={150}
						highlightColor={'#d8d8d8'}
						renderItem={(data, index, isSelected) => {
							return this.renderItem(data, isSelected);
						}}
						onValueChange={(data, selectedIndex) => {
							// Soma-se mais um devido a array de minutos não ter o minuto 0
							this._msMinutes = this.convertToMs(selectedIndex * 5, true);
						}}/>
				</View>)
		}
	}

	renderBottom() {
		const { sleepTime } = this.state;

		return sleepTime ? (
				<View style={{ marginTop: 20  }}>
					<Button style={{ backgroundColor: '#0AC', paddingTop: 10, paddingBottom: 10 }} onPress={() => {
						this.modal.hide(() => {
							this.cancelSleepTime();
						});
					}}>
						<Text style={{ fontFamily: 'rubik-bold', color: '#FFF' }}>DESATIVAR</Text>
					</Button>
				</View>
		) : (
			<View style={{ marginTop: 20  }}>
				<Button style={{ backgroundColor: '#0AC', paddingTop: 10, paddingBottom: 10 }} onPress={this.startTimeoutToSleep.bind(this)}>
					<Text style={{ fontFamily: 'rubik-bold', color: '#FFF' }}>DEFINIR</Text>
				</Button>
			</View>
		)
	}

	startTimeoutToSleep() {
		const minuteValue = this.min.getSelectedIndex() * 5;

		if (this._msHrs === null) this._msHrs = this.convertToMs(this.hr.getSelectedIndex(), false);
		if (this._msMinutes === null) this._msMinutes = this.convertToMs(minuteValue, true);


		const timeout = this._msHrs != null && this._msMinutes != null ?
						this._msHrs + this._msMinutes :
						this._msMinutes != null ? this._msMinutes : 0;

		this._currentTime = new Date();
		const diffCurrentTime = new Date(this._currentTime);

		diffCurrentTime.setHours(this.hr.getSelectedIndex() + this._currentTime.getHours());
		diffCurrentTime.setMinutes(minuteValue + this._currentTime.getMinutes());

		const dateTime = Date.parse(diffCurrentTime);

		const sleepTime = {
			dateTime,
			hourIndex: this.hr.getSelectedIndex(),
			minuteIndex: this.min.getSelectedIndex(),
			milliseconds: timeout
		};

		if (timeout === 0) return;

		this.props.setSleepTime(sleepTime);
		this.toggleModal();
		Toast.show(`Definido o modo soneca para às ${(this.toStringTime(diffCurrentTime))}`);
		this.showNotification(diffCurrentTime);
		EventManager.trackEvent({ action: 'sleep_init', category: 'Player' });
	}

	showNotification(date) {
		const diffDate = new Date(date.getTime());
		const dateNow = new Date();
		diffDate.setMinutes(diffDate.getMinutes() - 5);
		const mnDiff = (( date.getTime() - dateNow.getTime()) / this._minuteMillisecondsUnit);
		if(mnDiff > 5) {
			LocalNotification.create({ title: 'Modo Soneca', message: `A estação será pausada às ${(this.toStringTime(date))}`, isSilent: true, date: diffDate });
		}
	}

	cancelSleepTime() {
		this.props.cancelSleepTime();
		this._currentTime = null;
		this._initialHrsPosition = 0;
		this._initialMinPosition = 6;
		this._msHrs = null;
		this._msMinutes = null;
		LocalNotification.cancel();
	}

	toStringTime(time) {
		let h = time.getHours();
		let m = time.getMinutes();

		h = h < 10 ? `0${h}` : h;
		m = m < 10 ? `0${m}` : m;

		return `${h}:${m}`;
	}

	render() {
		return (
			<Modal
			ref={modal => this.modal = modal}
			onRequestClose={() => {
				this.setState({ modalVisible: false });
			}}
			visible={this.state.modalVisible}>
					<View style={styles.content}>
						{this.renderTitle()}
						{this.renderTime()}
						{this.renderBottom()}
					</View>
			</Modal>
		)
	}

}

const styles = StyleSheet.create({
	background: {
		flex: 1,
		top: 0,
		bottom: 0,
		right: 0,
		left: 0,
		alignItems: 'center',
		justifyContent: 'center',
		position: 'absolute',
		backgroundColor: 'rgba(0, 0, 0, 0.6)'
	},
	content: {
		justifyContent: 'center',
		alignSelf: 'center',
		alignContent: 'center',
		flexDirection: 'column',
		width: width / 1.4,
		backgroundColor: '#fff',
		borderRadius: 5,
		padding: 16,
	},
	title: {
		fontFamily: 'rubik-bold',
		color: '#333',
		fontSize: 15,
		alignItems: 'center'
	},
	timePickerContent: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center'
	},
	timePickerText: {
		fontFamily: 'rubik',
		color: '#333',
		fontSize: 25
	},
    tag: {
        color: '#2d2d2d',
        fontFamily: 'rubik-bold',
        fontSize: 12
    },
    tagContainer: {
        padding: 3,
        borderRadius: 3,
        backgroundColor: '#CF0',
        justifyContent: 'center',
        alignItems: 'center'
    },
});


export default SleepModal;
