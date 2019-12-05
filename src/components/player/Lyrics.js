import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, ScrollView } from 'react-native';

class Lyrics extends Component {
    constructor(props) {
        super(props);

        this.state = { isRendering: props.isShowingLyrics, showTranslation: false };
        this._fadeLyrics = new Animated.Value(props.isShowingLyrics ? 1 : 0);
    }

    componentWillReceiveProps(nextProps) {
        const { isShowingLyrics, data } = this.props;

        if (isShowingLyrics !== nextProps.isShowingLyrics) {
            this.toggleLyrics(nextProps.isShowingLyrics);
        }

        if (nextProps.data !== this.props.data) {
			setTimeout(() => {
				if (this.scrollView) this.scrollView.scrollTo({ x: 0 });
			}, 50);
            this.setState({ showTranslation: false });
        }
    }

    toggleLyrics(isShowing) {
        if (isShowing) {
            this.setState({ isRendering: true });
            Animated.timing(this._fadeLyrics, {
                toValue: 1,
                duration: 200
            }).start();
        } else {
            Animated.timing(this._fadeLyrics, {
                toValue: 0,
                duration: 200
            }).start(() => {
                this.setState({ isRendering: false });
            });
        }
    }

    renderText() {
        const { data } = this.props;

        if (data && data.text) {
            if (this.state.showTranslation) {
                return data.translate[0].text;
            } else {
                return data.text;
            }
        }
    }

    showTranslation(showTranslation) {
        this.setState({ showTranslation });
    }

    renderTranslationButton() {
		const { data } = this.props;
        const { showTranslation } = this.state;

        if (data && data.translate && data.translate.length) {
            return (
                <TouchableOpacity onPress={this.showTranslation.bind(this, true)}>
                    <View style={{ padding: 6, paddingRight: 10, paddingLeft: 10, borderRadius: 20, backgroundColor: showTranslation ? 'rgba(255, 255, 255, 0.2)' : 'transparent' }}>
                        <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'rubik' }}>
                            TRADUÇÃO
                        </Text>
                    </View>
                </TouchableOpacity>
            );
        }
    }

    renderTabs() {
        const { showTranslation } = this.state;
		const { data } = this.props;

        if (data && data.translate && data.translate.length) {
            return (
                <View style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'row', marginBottom: 16 }}>
                    <TouchableOpacity onPress={this.showTranslation.bind(this, false)}>
                        <View style={{ padding: 6, paddingRight: 10, paddingLeft: 10, borderRadius: 20, backgroundColor: showTranslation ? 'transparent' : 'rgba(255, 255, 255, 0.2)', marginRight: 16 }}>
                            <Text style={{ color: '#FFF', fontSize: 14, fontFamily: 'rubik' }}>
                                ORIGINAL
                            </Text>
                        </View>
                    </TouchableOpacity>
                    {this.renderTranslationButton()}
                </View>
            );
        }
    }

    renderLyrics() {
        const { data } = this.props;
        return (
            <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 2, opacity: this._fadeLyrics, paddingTop: 90, paddingLeft: 16, paddingRight: 16 }]}>
                {this.renderTabs()}
                <ScrollView ref={scrollView => { this.scrollView = scrollView; }}>
                    <Text style={{ color: '#FFF', fontSize: 18, paddingBottom: 16, fontFamily: 'rubik'  }}>
                        {this.renderText()}
                    </Text>
                </ScrollView>
            </Animated.View>
        );
    }

    render() {
        if (this.state.isRendering) {
            return this.renderLyrics();
        } else {
            return <View />;
        }
    }
}

export default Lyrics;
