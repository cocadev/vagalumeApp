import React, { Component } from 'react';
import { View, ScrollView } from 'react-native';

class Carousel extends Component {
    render() {
        return (
            <ScrollView horizontal style={this.props.style}>
                <View style={styles.content}>
                    {this.props.children}
                </View>
            </ScrollView>
        );
    }
}

const styles = {
    content: {
        flexDirection: 'row',
        paddingLeft: 16,
        paddingRight: 16
    }
};

export default Carousel;
