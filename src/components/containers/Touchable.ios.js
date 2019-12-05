import React, { Component } from 'react';
import { TouchableOpacity } from 'react-native';

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

        const props = {};

        if (onPressIn) props.onPressIn = onPressIn;
        if (onPressOut) props.onPressOut = onPressOut;
        if (onPress) props.onPress = onPress;

        return (
            <TouchableOpacity 
                hitSlop={hitSlop} 
                style={style} 
                {...props}
                accessible={accessible} 
                accessibilityLabel={accessibilityLabel} 
                accessibilityTraits={accessibilityTraits}
                accessibilityComponentType={accessibilityComponentType}>

                    {children}
            </TouchableOpacity>
        );
    }
}

export default Touchable;
