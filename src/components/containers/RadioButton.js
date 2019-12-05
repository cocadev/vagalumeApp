import React, { Component } from 'react';
import { View, Animated, TouchableWithoutFeedback, Text } from 'react-native';

class RadioButtonn extends Component {

    constructor(props) {
        super(props);

        this.state = { isEnabled: false, backgroundValue: new Animated.Value(0) };

        this._backgroundColor = this.state.backgroundValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)']
        });

    }

    toggleRadioButton() {
        const isEnabled = !this.state.isEnabled;
        this.setState({ isEnabled });      

        Animated.timing(this.state.backgroundValue, {
            toValue: isEnabled ? 1 : 0,
            duration: 100
        }).start();
    }

    render() {
        const { isSelected } = this.props;
        const backgroundColor =  isSelected ? 'rgba(0, 0, 0, 1)' : 'rgba(0, 0, 0, 0)';

        return (           
             <View style={styles.content}>                
                <Animated.View style={{ backgroundColor: backgroundColor, ...styles.color }} />                
            </View>           
                
        );
    }
}

const styles = {
    parent: { flexDirection: 'row', justifyContent: 'center' },
    content: { width: 15, height: 15, borderRadius: 10, padding: 2, borderWidth: 1, borderColor: '#000', marginRight: 10 },
    color: { flex: 1, borderRadius: 10 }
};

export default RadioButtonn;
