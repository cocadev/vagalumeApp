import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
	Modal,
	Platform,
	Text,
	TextInput,
	TouchableWithoutFeedback,
	View,
	StyleSheet
} from 'react-native';

class Prompt extends Component {
	static propTypes = {
		title: PropTypes.string.isRequired,
		visible: PropTypes.bool,
		defaultValue: PropTypes.string,
		placeholder: PropTypes.string,
		onCancel: PropTypes.func.isRequired,
		cancelText: PropTypes.string,
		onSubmit: PropTypes.func.isRequired,
		submitText: PropTypes.string,
		onChangeText: PropTypes.func.isRequired,
		borderColor: PropTypes.string,
		promptStyle: PropTypes.object,
		titleStyle: PropTypes.object,
		buttonStyle: PropTypes.object,
		buttonTextStyle: PropTypes.object,
		submitButtonStyle: PropTypes.object,
		submitButtonTextStyle: PropTypes.object,
		cancelButtonStyle: PropTypes.object,
		cancelButtonTextStyle: PropTypes.object,
		inputStyle: PropTypes.object,
		textInputProps: PropTypes.object,
	};

	static defaultProps = {
		visible: false,
		defaultValue: '',
		cancelText: 'Cancel',
		submitText: 'OK',
		borderColor:'#ccc',
		promptStyle: {},
		titleStyle: {},
		buttonStyle: {},
		buttonTextStyle: {},
		submitButtonStyle: {},
		submitButtonTextStyle: {},
		cancelButtonStyle: {},
		cancelButtonTextStyle: {},
		inputStyle: {},
		onChangeText: () => {},
	};

	state = {
		value: '',
		visible: false,
	};

	componentDidMount() {
		this.setState({value: this.props.defaultValue});
	}

	componentWillReceiveProps(nextProps) {
		const { visible, defaultValue } = nextProps;
		this.setState({ visible, value:defaultValue });
	}

	_onChangeText = (value) => {
		this.setState({ value });
		this.props.onChangeText(value);
	};

	_onSubmitPress = () => {
		const { value } = this.state;
		this.props.onSubmit(value);
	};

	_onCancelPress = () => {
		this.props.onCancel();
	};

	close = () => {
		this.setState({visible: false});
	};

	_renderDialog = () => {
		const {
			title,
			placeholder,
			defaultValue,
			cancelText,
			submitText,
			borderColor,
			promptStyle,
			titleStyle,
			buttonStyle,
			buttonTextStyle,
			submitButtonStyle,
			submitButtonTextStyle,
			cancelButtonStyle,
			cancelButtonTextStyle,
			inputStyle
		} = this.props;
		return (
			<View style={styles.dialog} key="prompt">
			<View style={styles.dialogOverlay}/>
			<View style={[styles.dialogContent, { borderColor }, promptStyle]}>
			<View style={[styles.dialogTitle, { borderColor }]}>
			<Text style={[styles.dialogTitleText, titleStyle]}>
			{ title }
			</Text>
			</View>
			<View style={styles.dialogBody}>
			<TextInput
			style={[styles.dialogInput, inputStyle]}
			defaultValue={defaultValue}
			onChangeText={this._onChangeText}
			placeholder={placeholder}
			autoFocus={true}
			underlineColorAndroid="white"
			{...this.props.textInputProps} />
			</View>
			<View style={[styles.dialogFooter, { borderColor }]}>
			<TouchableWithoutFeedback onPress={this._onCancelPress}>
			<View style={[styles.dialogAction, buttonStyle, cancelButtonStyle]}>
			<Text style={[styles.dialogActionText, buttonTextStyle, cancelButtonTextStyle]}>
			{cancelText}
			</Text>
			</View>
			</TouchableWithoutFeedback>
			<TouchableWithoutFeedback onPress={this._onSubmitPress}>
			<View style={[styles.dialogAction, buttonStyle, submitButtonStyle]}>
			<Text style={[styles.dialogActionText, buttonTextStyle, submitButtonTextStyle]}>
			{submitText}
			</Text>
			</View>
			</TouchableWithoutFeedback>
			</View>
			</View>
			</View>
		);
	};

	render() {
		return (
			<Modal onRequestClose={() => this.close()} transparent={true} visible={this.props.visible}>
			{this._renderDialog()}
			</Modal>
		);
	}
};

const styles = StyleSheet.create({
	dialog: {
		flex: 1,
		alignItems: 'center'
	},
	dialogOverlay: {
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		right: 0
	},
	dialogContent: {
		elevation: 5,
		marginTop: 150,
		width: 300,
		backgroundColor: 'white',
		borderRadius: 5,
		borderWidth: 1,
		overflow: 'hidden'
	},
	dialogTitle: {
		borderBottomWidth: 1,
		paddingVertical: 10,
		paddingHorizontal: 15
	},
	dialogTitleText: {
		fontSize: 18,
		fontWeight: '600'
	},
	dialogBody: {
		paddingHorizontal: 10
	},
	dialogInput: {
		height: 50,
		fontSize: 18
	},
	dialogFooter: {
		borderTopWidth: 1,
		flexDirection: 'row',
	},
	dialogAction: {
		flex: 1,
		padding: 15
	},
	dialogActionText: {
		fontSize: 18,
		textAlign: 'center',
		color: '#006dbf'
	}
});

export default Prompt;
