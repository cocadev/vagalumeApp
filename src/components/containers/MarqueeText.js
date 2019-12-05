import React, { Component } from 'react';
import { Animated, View, Easing, Dimensions} from 'react-native';

class MarqueeText extends Component {

    constructor(props) {
        super(props);

        this.state = { textWidth: 9999};

        this.timeoutMarquee = null;
        this._textX = new Animated.Value(0);
        this._isMarquee = false;
        this._verifyMarque = false;
        this._animating = false;
        this._edges = {end: 0};
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.text !== this.props.text) {
            clearInterval(this.timeoutMarquee);
            this._isMarquee = false;
            this._verifyMarque = false;
            this._animating = false;
            this._textX.stopAnimation();
            this._textX.setValue(0);
            this._edges = {end: 0};
            this.setState({ textWidth: 9999});
        }
    }

    checkMultiline() {
        if (!this._verifyMarque) {
            if (this._edges.end > this.props.width) {
                this._isMarquee = true;
            }
            this._verifyMarque = true;
        }
    }

    marquee(width) {
        Animated.sequence([
            Animated.timing(this._textX, {
                toValue: -width,
                duration: (width / 90) * 1000,
                easing: Easing.linear,
                delay: 1000
            }),
            Animated.timing(this._textX, {
                toValue: this.props.width,
                duration: 0,
                easing: Easing.linear,
            }),
            Animated.timing(this._textX, {
                toValue: 0,
                duration: (this.props.width / 90) * 1000,
                easing: Easing.linear,
            })
        ]).start(() => {
            if (this._isMarquee) this.marquee(width);
        });
    }

    render() {
        return (
            <View
            style={[
                styles.parent,
                {
                    width: this.props.width,
                    justifyContent: this._verifyMarque && this._isMarquee ? 'flex-start' : 'center'
                }
            ]}
            accessible={true} accessibilityLiveRegion={'polite'} accessibilityTraits={'frequentUpdates'}
            >
                <View
                style={{
                    width: this.state.textWidth,
                    flexDirection: 'row'
                }}
                >
                   <View style={{flexDirection: 'row'}}>
                        <Animated.Text
                        onLayout={(e) => {
                            let widthLayout = e.nativeEvent.layout.width;
                            clearInterval(this.timeoutMarquee);
                            this.timeoutMarquee = setInterval(() => {
                                if (this._verifyMarque) {
                                    if (this._isMarquee) {
                                        widthLayout = widthLayout + 20;
                                        if (!this._animating) {
                                            this._animating = true;
                                            this.marquee(widthLayout);
                                        }
                                    }
                                    this.setState({ textWidth: widthLayout });
                                    clearInterval(this.timeoutMarquee);
                                }
                            }, 500);
                        }}
                        style={[
                            this.props.style,
                            {
                                paddingLeft: this._isMarquee
                                ? 16
                                : 0,
                                width: null,
                                lineHeight: 26,
                                height: 30,
                                fontFamily: 'rubik',
                                transform: [{ translateX: this._textX }] }
                        ]}
                        >
                            {this.props.text}
                        </Animated.Text>
                        <View
                            style={styles.edges}
                            onLayout={(e) => {
                                if (!this._verifyMarque) {
                                    this._edges.end = e.nativeEvent.layout.x;
                                    this.checkMultiline();
                                }
                            }}/>
                    </View>
                </View>
            </View>
        );
    }
}

const styles = {
    parent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flexWrap: 'wrap'
    },
    edges: {
        backgroundColor: 'rgba(0, 0, 0, 0)',
        width: 1,
        height: 1
    }
};

export default MarqueeText;
