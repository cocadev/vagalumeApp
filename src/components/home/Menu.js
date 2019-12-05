import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Platform, StatusBar, Animated, ScrollView, Dimensions } from 'react-native';
import StatusBarHeight from '../containers/StatusBarHeight';

// Calcula o tamanho da barra inicial
const barHeight = Platform.OS === 'ios' ? 74 : 56 + StatusBarHeight;
const { width } = Dimensions.get('window');

// Tamanho das labels
const labelsHeight = 50;

class Menu extends Component {

    constructor(props) {
        super(props);

        const labelsOffset = props.offset - barHeight;

        this._menuItems = ['TODAS', 'TOP', 'ALFABÉTICA'];
        this._menuAnimations = {
            translateY: 0,
			translateX: 0,
            opacity: 1,
			top: barHeight
        };

        if (props.animated) {
            this._menuAnimations.translateY = props.barY.interpolate({
                inputRange: [0, barHeight],
                outputRange: [0, -barHeight - labelsHeight],
                extrapolate: 'clamp',
            });

			this._menuAnimations.translateX = props.scrollY.interpolate({
                inputRange: [0, 0, labelsOffset - barHeight],
                outputRange: [width, width, 0],
                extrapolate: 'clamp',
            });

            this._menuAnimations.opacity = props.scrollY.interpolate({
                inputRange: [0, labelsOffset, labelsOffset * 2],
                outputRange: [0, 0, 1],
                extrapolate: 'clamp',
            });
        }
    }

    renderMenuItems() {
        return this._menuItems.map((item, key) => {
            const activeText = this.props.index !== key ? {} : {
                color: '#CF0'
            };

            const activeItem = this.props.index !== key ? {} : {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: 30
            };

            const marginLeft = key === 0 ? 14 : 8;

            return (
                <TouchableWithoutFeedback
                onPress={Platform.OS === 'ios' ? this.props.pressMenuItem.bind(this, key) : null}
                onPressIn={Platform.OS === 'android' ? this.props.pressMenuItem.bind(this, key) : null}
                key={key}
                >
                    <View style={[styles.menuItem, { marginLeft }, activeItem]}>
                        <Text style={[styles.menuText, activeText]}>
                            {item}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            );
        });
    }

    render() {
        const animatedStyle = this.props.animated ? styles.animatedMenu : {};
        return (
            <Animated.View style={[styles.body, animatedStyle, {
                opacity: this._menuAnimations.opacity,
                transform: [{ translateY: this._menuAnimations.translateY }, { translateX: this._menuAnimations.translateX }],
				top: this.props.animated ? this._menuAnimations.top : 0
            }]}
            >
                <ScrollView showsHorizontalScrollIndicator={false} style={styles.scroll} horizontal>
                    {this.renderMenuItems()}
                </ScrollView>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    body: {
        flexDirection: 'row',
        alignItems: 'center',
        height: labelsHeight,
        zIndex: 2
    },
    menuItem: {
        padding: 6
    },
    menuText: {
        color: '#FFF',
		backgroundColor: 'transparent',
        fontFamily: 'rubik'
    },
    scroll: {
    },
    animatedMenu: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        left: 0,
        right: 0,
        zIndex: 1,
        top: Platform.OS === 'ios' ? 74 : StatusBarHeight + 56,
    }
});

export default Menu;
