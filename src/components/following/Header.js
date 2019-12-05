import React, { Component } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import IconButton from '../containers/IconButton';
import Icon from '../containers/Icon';
import StatusBarHeight from '../containers/StatusBarHeight';

class Header extends Component {
	render() {
		const { navigatorPop } = this.props;
		const accessibilityText = `Voltar.`;
		
		return (
			<View style={styles.body}>
				<IconButton
				hitSlop={{ top: 30, left: 30, right: 30, bottom: 30 }}
				size={56}
				onPress={navigatorPop}
				color="rgba(255, 255, 255, 0.2)"
				accessible={true} 
            	accessibilityLabel={accessibilityText}
				>
					<Icon name="chevron_left" size={20} color="#FFF" />
				</IconButton>
				<Text style={styles.label}>Seguindo</Text>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		backgroundColor: '#333',
		height: 56 + StatusBarHeight,
		elevation: 2,
		alignItems: 'center',
		paddingTop: StatusBarHeight,
		flexDirection: 'row'
	},
	label: {
		color: '#CF0',
		fontSize: 18,
		fontFamily: 'rubik'
	}
});

export default Header;
