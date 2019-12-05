import React, { Component } from 'react';
import { View, Animated, Text, TouchableNativeFeedback, Dimensions, Platform, StyleSheet } from 'react-native';
import Touchable from '../containers/Touchable';

const { width } = Dimensions.get('window');

class InfoTabs extends Component {
    constructor(props) {
        super(props);

        this.state = { borderPos: new Animated.Value(0), index: 0 };
        this.onPageSelected = this.onPageSelected;

		this._tabs = ['PRÓXIMAS', 'ÚLTIMAS', 'VEJA TAMBÉM'];
    }

    onPageSelected(index) {
        const pos = (width / this._tabs.length) * index;

        this.setState({ index });

        Animated.spring(
            this.state.borderPos,
            { toValue: pos }
        ).start();
    }

    setPos(index) {
        this.onPageSelected(index);
        this.props.onTabSelected(index);
    }

	renderTab(label, key) {
		const { index } = this.state;
		const background = Platform.OS === 'android' ? TouchableNativeFeedback.Ripple('#333') : '#333';

		return (
			<Touchable
			key={key}
			style={{ flex: 1 }}
			background={background}
			onPress={this.setPos.bind(this, key)}
			>
				<View style={styles.tabContainer}>
					<Text
					style={[styles.tabText, { color: index === key ? '#FFF' : '#AAA' }]}
					>
						{label}
					</Text>
				</View>
			</Touchable>
		);
	}

	renderTabs() {
		return this._tabs.map((label, key) => {
			return this.renderTab(label, key);
		});
	}

	render() {
		const { borderPos } = this.state;
		return (
			<View style={styles.body}>
				<Animated.View style={[styles.border, { left: borderPos, width: width /  this._tabs.length }]} />
				{this.renderTabs()}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		height: 40,
		marginTop: 10,
		paddingBottom: 20,
		width,
		flexDirection: 'row'
	},
	border: {
		backgroundColor: '#CF0',
		height: 3,
		position: 'absolute',
		bottom: 0,
		zIndex: 2
  	},
	tabText: {
		fontFamily: 'rubik-medium',
		textAlign: 'center',
		fontSize: 12,
		paddingLeft: 6,
		paddingRight: 6
	},
	tabContainer: {
		flex: 1,
		height: 40,
		justifyContent: 'center',
		alignItems: 'center'
	}
});

export default InfoTabs;
