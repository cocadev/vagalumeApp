import React, { Component } from 'react';
import { Image, View, Platform, Animated, StyleSheet } from 'react-native';
import IconButton from '../containers/IconButton';
import Icon from '../containers/Icon';
import ChromecastButton from '../containers/ChromecastButton'
import StatusBarHeight from '../containers/StatusBarHeight';
import EventManager from '../containers/EventManager';

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = { heartSize: new Animated.Value(26) };
    }

	renderBackButton() {
		const { backPage } = this.props;
		const accessibilityText = `Voltar.`;

		return (
			<View>
				<IconButton
				hitSlop={{ top: 30, left: 20, right: 30, bottom: 30 }}
				size={56}
				onPress={backPage}
				color="rgba(255, 255, 255, 0.2)"
				accessible={true} 
                accessibilityLabel={accessibilityText}>
					<Icon name="chevron_left" size={16} color="#FFF" />
				</IconButton>
				<View style={[{ position: 'absolute', left: 48, top: 0, height: 56, justifyContent: 'center', alignItems: 'center' }]}>
					<ChromecastButton onPress={() => {
						EventManager.trackEvent({ action: 'chromecast', category: 'Chromecast', params: { event_type: 'connect', from: 'station' } });
					}} />
				</View>
			</View>
		);
	}

	renderTitle() {
		const { stationName, showBarStationName } = this.props;
		return (
			<Animated.Text
			style={[styles.title, { opacity: showBarStationName }]}
			>
				{stationName}
			</Animated.Text>
		);
	}

	renderShareButton() {
		const { shareStation } = this.props;
		const accessibilityText = `Compartilhar.`;

		return (
			<IconButton
			hitSlop={{top: 30, left: 20, right: 30, bottom: 30}}
			size={48}
			onPressIn={shareStation}
			color="rgba(255, 255, 255, 0.2)"
			accessible={true} 
            accessibilityLabel={accessibilityText}
			>
				<Icon name={`share_${Platform.OS}`} size={20} color="#FFF" />
			</IconButton>
		);
	}

    render() {
        return (
	        <Animated.View
	        style={[styles.body, {
	          backgroundColor: this.props.barOpacity,
	          transform: [{ translateY: this.props.translateY }],
	          elevation: this.props.barElevation }]}
	        >
	            <View style={styles.container}>
					{this.renderBackButton()}
					{this.renderTitle()}
					{this.renderShareButton()}
            	</View>
        	</Animated.View>
        );
    }
}

const styles = StyleSheet.create({
	body: {
		height: 56 + StatusBarHeight,
		position: 'absolute',
		left: 0,
		top: -StatusBarHeight,
		paddingTop: StatusBarHeight,
		right: 0,
		zIndex: 1,
		marginTop: StatusBarHeight === 0 ? 0 : 24
	},
	container: {
		flexDirection: 'row',
		flex: 1,
		justifyContent: 'space-between',
		alignItems: 'center'
	},
	title: {
		color: '#CF0',
		fontSize: 18,
		fontFamily: 'rubik'
	},
	backButton: {
		margin: 5,
		width: 27,
		height: 27
	},
	shareButton: {
		margin: 5,
		width: 21,
		height: 21
	}
});

export default Header;
