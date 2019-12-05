import React from 'react';
import { View, TouchableNativeFeedback, Platform } from 'react-native'
import Touchable from './Touchable';

const RoundedButton = ({ size, onPress, children, style, accessible, accessibilityLabel }) => {
  return (
    <View style={[style, { height: size, width: size, borderRadius: size / 2 }]} accessible={true}>
      <Touchable
        background={Platform.OS === 'android'? TouchableNativeFeedback.Ripple('#7d941f', true) : '#7d941f'}
        onPress={onPress}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityTraits={'button'}
        accessibilityComponentType={'button'}>
        <View
        style={{
            backgroundColor: '#CF0',
            justifyContent: 'center',
            alignItems: 'center',
      			shadowColor: '#000',
      			shadowOffset: { width: 4, height: 4 },
      			shadowOpacity: 0.7,
      			shadowRadius: 5,
            width: size,
            height: size,
            borderRadius: size / 2 }}
        >
          {children}
        </View>
      </Touchable>
    </View>
  );
};

export default RoundedButton;
