import React from 'react';
import { View, TouchableNativeFeedback } from 'react-native'
import Touchable from './Touchable';

const Button = ({ onPress, children, style }) => {
    return (
        <Touchable
        background
        onPress={onPress}
        >
        <View style={{ ...styles.content, ...style }}>
            {children}
        </View>
        </Touchable>
    );
};

const styles = {
    content: {
        padding: 7,
        backgroundColor: '#CF0',
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center', 
        elevation: 5
    }
};

export default Button;
