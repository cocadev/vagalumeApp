import React, { Component } from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import Icon from '../containers/Icon';

class NavigateStation extends Component {
    renderButton() {
            const nextStyle = this.props.isNext ? { transform: [{ rotateY: '180deg' }], right: 0 } : { left: 0 };
            const accessibilityText = this.props.isNext ? 'Proxima estação' : 'Estação anterior';
            return (
                <View style={[this.props.style, { justifyContent: 'center', alignItems: 'center', ...nextStyle }]}>
                    <TouchableOpacity hitSlop={{ top: 30, left: 30, right: 30, bottom: 30 }} onPress={this.props.onPress.bind(this)} accessible={true} accessibilityLabel={accessibilityText} accessibilityTraits={'button'} accessibilityComponentType={'button'}>
						<Icon name="chevron_left" size={75} color="#FFF" style={{ opacity: 0.5 }} />
                    </TouchableOpacity>
                </View>
            );
    }

    render() {
        return this.renderButton();
    }
}

export default NavigateStation;
