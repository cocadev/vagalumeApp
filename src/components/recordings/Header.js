import React, { Component } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import StatusBarHeight from '../containers/StatusBarHeight';
import IconButton from '../containers/IconButton';
import Icon from '../containers/Icon';

class Header extends Component {
	pressEdit() {
		const { editMode, recordings, enableEdit, disableEdit } = this.props;

		if (!recordings || !recordings.length) return;

		if (!editMode) {
			enableEdit();
		} else {
			disableEdit();
		}
	}

	renderBackButton() {
		const accessibilityText = `Voltar.`;

		return (
			<IconButton
				hitSlop={{ top: 30, left: 30, right: 30, bottom: 30 }}
				size={56}
				onPress={this.props.handleBackButton}
				color="rgba(255, 255, 255, 0.2)"
				accessible={true}
				accessibilityLabel={accessibilityText}
			>
				<Icon name="chevron_left" size={20} color="#FFF" />
			</IconButton>
		);
	}

	renderDeleteButton() {
		const { selectedRecordings, deleteRecordings } = this.props;
		if (selectedRecordings instanceof Array && selectedRecordings && selectedRecordings.length) {
			return (
				<TouchableOpacity
					hitSlop={{ top: 16, left: 16, right: 16, bottom: 16 }}
					onPress={deleteRecordings}
					accessible={true}
				>
					<View style={{ marginRight: 16 }}>
						<Text style={styles.deleteText}>Apagar</Text>
					</View>
				</TouchableOpacity>
			);
		}
	}

	renderRenameButton() {
		const { selectedRecordings, deleteRecordings } = this.props;
		if (selectedRecordings instanceof Array && selectedRecordings && selectedRecordings.length == 1) {
			return (
				<TouchableOpacity
					hitSlop={{ top: 16, left: 16, right: 16, bottom: 16 }}
					onPress={this.props.renameRecording}
					accessible={true}
					accessibilityComponentType={'button'}
					accessibilityTraits={'button'}
				>
					<View style={{ marginRight: 16 }}>
						<Text style={styles.editText}>Renomear</Text>
					</View>
				</TouchableOpacity>
			);
		}
	}

	renderEditButton() {
		const { recordings, editMode } = this.props;
		return (
			<TouchableOpacity
				hitSlop={{ top: 16, left: 16, right: 16, bottom: 16 }}
				onPress={this.pressEdit.bind(this)}
				accessible={true}
				accessibilityComponentType={'button'}
				accessibilityTraits={'button'}
			>
				<View style={{ marginRight: 16 }}>
					<Text style={styles.editText}>
						{recordings instanceof Array &&
							recordings &&
							recordings.length > 0 &&
							(editMode ? 'Cancelar' : 'Editar')}
					</Text>
				</View>
			</TouchableOpacity>
		);
	}

	render() {
		const { selectedRecordings, editMode } = this.props;
		return (
			<View style={styles.body}>
				{this.renderBackButton()}
				<Text style={styles.title}>
					{selectedRecordings.length || (editMode ? 'Selecionar...' : 'Gravações')}
				</Text>
				<View style={styles.editContainer}>
					{this.renderDeleteButton()}
					{this.renderRenameButton()}
					{this.renderEditButton()}
				</View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		elevation: 2,
		backgroundColor: '#333',
		paddingTop: StatusBarHeight,
		height: 56 + StatusBarHeight,
		alignItems: 'center',
		flexDirection: 'row',
		zIndex: 9
	},
	title: {
		color: '#CF0',
		fontSize: 18,
		fontFamily: 'rubik'
	},
	editContainer: {
		position: 'absolute',
		right: 0,
		top: StatusBarHeight,
		bottom: 0,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	deleteText: {
		color: '#e23d3d',
		fontFamily: 'rubik'
	},
	editText: {
		color: '#FFF',
		fontFamily: 'rubik'
	}
});

export default Header;
