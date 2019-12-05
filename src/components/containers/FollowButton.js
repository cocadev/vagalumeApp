import React, { Component } from 'react';
import { View, Image, Text, Animated, TouchableWithoutFeedback, Platform } from 'react-native';
import Icon from './Icon';

class FollowButton extends Component {

    constructor(props) {
        super(props);

        const { isFollowing } = props;
        const initialValue = isFollowing ? 1 : 0;
        this.state = { isFollowing };
    }

    componentWillReceiveProps(nextProps) {
        const { isFollowing } = nextProps;
        if (isFollowing !== this.state.isFollowing) {
            this.setState({ isFollowing });
        }
    }

    render() {
        const { isFollowing } = this.state;
        const borderColor = isFollowing ? 'rgba(0, 0, 0, 0.1)' : '#CF0';
        const color = isFollowing ? '#2D2D2D' : '#CF0';
		const followIcon = isFollowing ? 'heart_on' : 'heart_off';
        const backgroundColor = isFollowing ? 'rgba(204, 255, 0, 1)' : 'rgba(204, 255, 0, 0)';
        return (
            <TouchableWithoutFeedback onPress={this.props.toggleFollow.bind(this)}>
                <View style={{ borderColor, backgroundColor, ...styles.button}}>
                    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
						<Icon name={followIcon} size={26} color={color} />
                        <View style={{ justifyContent: 'center' }}>
                            <Text style={{ color, fontSize: isFollowing ? 12 : 14, fontFamily: 'rubik-medium' }}>
                                {isFollowing ? 'SEGUINDO' : 'SEGUIR'}
                            </Text>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    }
}

const styles = {
    button: {
        padding: 6,
        borderRadius: 5,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        width: 106
    }
};

export default FollowButton;
