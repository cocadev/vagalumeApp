import React, { Component } from 'react';
import { View } from 'react-native'
import Touchable from './Touchable';

class IconButton extends Component {
    render() {       
        return (
            <Touchable
            accessible={this.props.accessible}
            accessibilityLabel={this.props.accessibilityLabel}           
            accessibilityTraits={'button'}
            accessibilityComponentType={'button'}
            hitSlop={this.props.hitSlop}
            onPressIn={this.props.onPressIn}
            onPress={this.props.onPress}
            onPressOut={this.props.onPressOut}
            color={this.props.color}
            >
                <View
                style={[this.props.style, {
                    width: this.props.size,
                    height: this.props.size,
                    alignItems: 'center',
                    justifyContent: 'center' }]}
                >
                    {this.props.children}
                </View>
            </Touchable>
        );
    }
}

export default IconButton;
