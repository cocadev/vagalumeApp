import React, { Component } from 'react';
import { Animated, View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

class Loader extends Component {
    constructor(props) {
        super(props);
        this.state = { left: new Animated.Value(0), right: new Animated.Value(width) }
    }

    componentDidMount() {
        this.animate();
    }

    animate() {
        Animated.sequence([
            Animated.timing(this.state.right, {
                toValue: 0,
                duration: 300,
            }),
            Animated.timing(this.state.left, {
                toValue: width,
                duration: 300,
            }),
            Animated.timing(this.state.left, {
                toValue: 0,
                duration: 300,
            }),
            Animated.timing(this.state.right, {
                toValue: width,
                duration: 300,
            }),
        ]).start(() => {
            this.animate();
        })
    }

    render() {
        return (
            <View style={{ height: 1, position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                <Animated.View style={{ backgroundColor: '#CF0', left: this.state.left, right: this.state.right, position: 'absolute', bottom: 0, top: 0 }} />
            </View>
        );
    }
}

export default Loader;
