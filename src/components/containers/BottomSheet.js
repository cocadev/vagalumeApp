import React, { Component } from 'react';
import { View, Platform, TimePickerAndroid , Share, Text, Linking, Animated, PanResponder, Image, TouchableWithoutFeedback, Dimensions } from 'react-native';
import EventManager from './EventManager';
import Icon from '../containers/Icon';


const height = 50 * 5;
const { width } = Dimensions.get("window");

class BottomSheet extends Component {
    constructor(props) {
        super(props);

        this.state = {
            pan: new Animated.ValueXY({ y: height + 50, x: 0 }),
            isVisible: false
        };

        this.backdropBackground = this.state.pan.y.interpolate({
            inputRange: [0, height],
            outputRange: [0.5, 0],
            extrapolate: 'clamp',
        });

        this._options = [
            { key: 'sleep', label: 'Modo soneca', icon: 'sleep', action: this.showSleepModal.bind(this) },
            { key: 'lyrics', label: 'Ver letra da música', icon: 'quote', action: this.showLyrics.bind(this) },
            { key: 'share', label: 'Compartilhar', icon: `share_${Platform.OS}`, action: this.share.bind(this) }
        ];

        this.openBottomSheet = this.openBottomSheet.bind(this);
    }

    componentWillMount() {
        const moveEvent = Animated.event([
            null, { dx: 0, dy: this.state.pan.y },
        ]);

        const TOP = 0;
        const DOWN = height;
        const PLAYER_LIMIT = height / 2;

        let ELEM_POS = null;

        this.panResponder = PanResponder.create({
            onMoveShouldSetResponderCapture: () => true,
            onMoveShouldSetPanResponderCapture: (e, gestureState) => {
                const sensibility = (Math.abs(gestureState.dy) > 10);
                if (sensibility) return true;
                return false;
            },
            onPanResponderGrant: () => {
                ELEM_POS = this.state.pan.y._value;
            },
            onPanResponderMove: (e, gestureState) => {
                const dy = Math.max(TOP, Math.min(DOWN, (gestureState.dy + ELEM_POS)));
                const gesture = { dx: 0, dy };
                return moveEvent(e, gesture);
            },
            onPanResponderRelease: (e, gesture) => {
                if (Math.abs(gesture.dy) > PLAYER_LIMIT) {
                    if (gesture.vy > 0) {
                        this.playerIndex++;
                    } else {
                        this.playerIndex--;
                    }
                } else {
                    this.playerIndex = this._playerIndex;
                }
            }
        });
    }

    _playerIndex = 0;

    get playerIndex() {
        return this._playerIndex;
    }

    set playerIndex(index) {
        const newIndex = Math.min(Math.max(index, 0), 1);

        this._playerIndex = newIndex;
        Animated.timing(this.state.pan, {
            toValue: { x: 0, y: (newIndex * height) },
            duration: 200
        }).start(() => {
            this.setState({
                isVisible: newIndex === 0
            });
        });
    }

    openBottomSheet() {
        this.setState({
            isVisible: true
        });
        this.playerIndex = 0;
    }

    showSleepModal() {
        this.props.toggleSleepModal();
    }

    showLyrics() {
        const { playingSong, playerInfo } = this.props;
        if (playingSong.title.id) {
            this.props.showLyrics();
			EventManager.trackEvent({ action: 'open_lyrics', category: 'Player', params: { station_id: playerInfo.id, song_id: playingSong.title.id } });
        }
    }

    camelize(str) {
		if (str && typeof str == 'string') {
			str = str
			.trim()
			.toLowerCase()
			.replace(/([^A-Za-z\u00C0-\u017F0-9]+)(.)/ig, function () {
				return arguments[2].toUpperCase();
			});
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
    }

    share() {
        const { playingSong, playerInfo } = this.props;
        const log = { station_id: playerInfo.id, from: 'options' };
		const url = `https://vagalume.fm/${playerInfo.slug}/`;

        let content = {};

        if (playingSong.title.id) {
            const { title, artist } = playingSong;

            content = {
                title: 'Vagalume.FM',
                message: `Escutando ${title.name} - ${artist.name} na estação #${this.camelize(playerInfo.name)} no @VagalumeFM ${url}`
            };
            log.song_id = playingSong.title.id;
        } else {
            content = {
                title: 'Vagalume.FM',
                message: `Escutando a estação #${this.camelize(playerInfo.name)} no @VagalumeFM ${url}`
            };
        }

		EventManager.trackEvent({ action: 'share', category: 'Player', params: log });
        Share.share(content, { dialogTitle: 'Compartilhar' });
    }

    optionFocus(key) {
        this.refs[key].setNativeProps({
            style: {
                color: '#CF0'
            }
        });
    }

    optionBlur(key) {
        this.refs[key].setNativeProps({
            style: {
                color: '#FFF'
            }
        });
    }

	toStringTime(time) {
		let h = time.getHours();
		let m = time.getMinutes();

		h = h < 10 ? `0${h}` : h;
		m = m < 10 ? `0${m}` : m;

		return `${h}:${m}`;
	}

    renderOptions() {
        let { sleepTime } = this.props;
        const date = sleepTime && sleepTime.dateTime ? new Date(sleepTime.dateTime) : null;
        const time = date ? this.toStringTime(date) : null;

        return this._options.map((option, key) =>
            <TouchableWithoutFeedback
                key={key}
                onPressIn={this.optionFocus.bind(this, option.key)}
                onPress={() => {
                this.playerIndex = 1;
                    setTimeout(() => {
                        option.action();
                    }, 250);
                }}
                onPressOut={this.optionBlur.bind(this, option.key)}>
                <View style={styles.options.content}>
                    <View style={styles.options.row}>
						<Icon name={option.key === 'sleep' && time ? 'sleep_on' : option.icon} size={22} color="#CF0" />
                        <Text ref={option.key} style={styles.options.text}>{option.label}</Text>
                        {option.key === 'sleep' && time &&
                            <View style={styles.tagContainer}>
                                <Text style={styles.tag}>
                                    DEFINIDO PARA ÀS {time}
                                </Text>
                            </View>}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    }

    renderFollowOption() {
        const favButton = this.props.isFollowing ?
        'heart_on' : 'heart_off';

        return (
            <TouchableWithoutFeedback
            onPressIn={this.optionFocus.bind(this, 'followStation')}
            onPress={this.props.toggleFollow.bind(this)}
            onPressOut={this.optionBlur.bind(this, 'followStation')}
            >
                <View style={styles.options.content}>
                    <View style={styles.options.row}>
						<Icon name={favButton} size={22} color="#CF0" />
                        <Text
                        ref="followStation"
                        style={styles.options.text}
                        >
                            {
                                this.props.isFollowing
                                ? 'Deixar de seguir estação'
                                : 'Seguir estação'
                            }
                        </Text>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        );
    }

    renderBottomSheet(translateX, translateY) {
        if (this.state.isVisible) {
            return (
                <View style={styles.parent}>
                    <Animated.View
                    onTouchEnd={() => { this.playerIndex = 1; }}
                    style={[
                        styles.backdrop,
                        { opacity: this.backdropBackground }
                    ]}/>
                    <Animated.View
                        {...this.panResponder.panHandlers}
                        style={[
                            styles.sheet,
                            { transform: [{ translateX }, { translateY }] }
                        ]}>
                        {this.renderFollowOption()}
                        {this.renderOptions()}
						<Icon style={styles.bottomImage} pointerEvents="none" name="vagalume" size={150} color="#3d3d3d" />
                    </Animated.View>
                </View>
            );
        }

        return <View />;
    }

    render() {
        const { pan } = this.state;
        const [translateX, translateY] = [pan.x, pan.y];

        return this.renderBottomSheet(translateX, translateY);
    }
}

const styles = {
    parent: {
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        zIndex: 9,
        elevation: 2,
        justifyContent: 'flex-end'
    },
    backdrop: {
        backgroundColor: '#000',
        zIndex: 1,
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
    },
    sheet: {
        zIndex: 2,
        backgroundColor: '#333'
    },
    tag: {
        color: '#2d2d2d',
        fontFamily: 'rubik-bold',
        fontSize: 10
    },
    tagContainer: {
        padding: 3,
        borderRadius: 3,
        backgroundColor: '#CF0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    options: {
        content: {
            alignItems: 'center',
            flexDirection: 'row',
            height: 55,
            borderBottomColor: '#3C3C3C',
            borderBottomWidth: 1,
            marginLeft: 16,
            marginRight: 16
        },
        text: {
            padding: 8,
            color: '#FFF',
            fontSize: 16,
            fontFamily: 'rubik'
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
        },
        icon: {
            width: 25,
            height: 25,
            marginRight: 4
        }
    },
    bottomImage: {
        position: 'absolute',
        width: width * 0.4,
        height: width * 0.4,
        right: 0,
        bottom: -((width * 0.3) / 2)
    }
};

export default BottomSheet;
