import React, { Component } from 'react';
import { Platform } from 'react-native';

const TouchableComponent = Platform.Version >= 21
? require('TouchableNativeFeedback')
: require('TouchableOpacity');

class Touchable extends Component {
    render() {
        const { 
            children,
            onPressIn, 
            onPress, 
            onPressOut, 
            style, 
            hitSlop, 
            accessible, 
            accessibilityLabel, 
            accessibilityTraits, 
            accessibilityComponentType 
        } = this.props;

        const background = Platform.Version < 21 ? false : (this.props.background ? TouchableComponent.SelectableBackground() : TouchableComponent.SelectableBackgroundBorderless());

        const props = {};

        if (onPressIn) props.onPressIn = onPressIn;
        if (onPressOut) props.onPressOut = onPressOut;
        if (onPress) props.onPress = onPress;

        return (
            <TouchableComponent 
                accessible={accessible} 
                accessibilityLabel={accessibilityLabel} 
                accessibilityTraits={accessibilityTraits}
                accessibilityComponentType={accessibilityComponentType}
                hitSlop={hitSlop} 
                background={background} 
                {...props} 
                style={style}>

                {children}
            </TouchableComponent>
        );
    }
}

export default Touchable;
