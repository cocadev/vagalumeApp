import React, { Component } from 'react';
import { Animated, View, Text, Image, Platform, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';
import IconButton from '../containers/IconButton';
import ChromecastButton from '../containers/ChromecastButton'
import StatusBarHeight from '../containers/StatusBarHeight';
import EventManager from '../containers/EventManager';

// Calcula o tamanho da barra inicial
const barHeight = Platform.OS === 'ios' ? 79 : 56 + StatusBarHeight;

// Imagens
const logo = require('../../img/fm-logo.png');

class Header extends Component {

    constructor(props) {
        super(props);

        this._translateY = props.barY.interpolate({
            inputRange: [0, barHeight],
            outputRange: [0, -barHeight],
            extrapolate: 'clamp',
        });

        this._backgroundColor = props.scrollY.interpolate({
            inputRange: [0, barHeight],
            outputRange: ['rgba(51, 51, 51, 0)', 'rgba(51, 51, 51, 1)'],
            extrapolate: 'clamp',
        });
    }

    openSearch() {
        this.props.navigation.navigate('Search');
    }

    render() {
        return (
            <Animated.View style={[styles.body, { transform: [{ translateY: this._translateY }], backgroundColor: this._backgroundColor, }]}>
                <View style={styles.flexCenter}>
                    <View style={styles.castButton}>
                        <ChromecastButton onPress={() => {
							EventManager.trackEvent({ action: 'chromecast', category: 'Chromecast', params: { event_type: 'connect', from: 'home' } });
                        }} />
                    </View>
                    <Image style={styles.logo} source={logo} />
					<View style={styles.helpButton}>
						<IconButton
							onPress={this.props.showSlaaskModal}
							size={40}
							color="rgba(255, 255, 255, 0.2)">
							<View style={{ height: 25, width: 25, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: 12.5, justifyContent: 'center', alignItems: 'center' }}>
								<Text style={{ fontSize: 20, color: '#FFF' }}>
									?
								</Text>
							</View>
						</IconButton>
                    </View>
                </View>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    body: {
        height: StatusBarHeight + 56,
        paddingTop: StatusBarHeight,
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,		
		zIndex: 3
    },
    logo: {
        width: 135,
        height: 40,
        alignSelf: 'center'
    },
    castButton: {
        position: 'absolute',
        left: 0,
        top: 0,
		height: 56,
		justifyContent: 'center',
		alignItems: 'center'
    },
	helpButton: {
        position: 'absolute',
        right: 0,
        top: 0,
		height: 56,
		justifyContent: 'center',
		alignItems: 'center'
    },
    flexCenter: {
        flex: 1,
        justifyContent: 'center'
    }
});

export default Header;
