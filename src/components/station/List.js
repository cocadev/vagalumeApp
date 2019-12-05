import React, { Component } from 'react';
import { ScrollView, Animated, Share, View, StyleSheet, Dimensions, Image, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { objCacheImgBgLow } from '../containers/StationTile';
import StatusBarHeight from '../containers/StatusBarHeight';
import Header from './Header';
import EventManager from '../containers/EventManager';
import ImageCache from '../containers/ImageCache';

const { width, height } = Dimensions.get('window');

class List extends Component {
	constructor(props) {
		super(props);

		this.state = { scrollY: new Animated.Value(0), barTranslate: new Animated.Value(0) };
		this._scrollDirection = null;
	}

	componentWillMount() {
        this._scaleBG = Platform.OS === 'ios' ? this.state.scrollY.interpolate({
            inputRange: [-100, 0],
            outputRange: [2, 1],
            extrapolate: 'clamp'
        }) : 1;

		this._translateBG = Platform.OS === 'ios' ? this.state.scrollY.interpolate({
            inputRange: [-100, 0],
            outputRange: [-50, 0],
            extrapolate: 'clamp'
        }) : 0;
	}

	truncate(string) {
        if (string) {
			if (string != null && string.length > 20) {
				return `${string.substring(0, 20)}...`;
			} else {
				return string;
			}
		} else {
			return '';
		}
    }

	onScroll(e) {
		const direction = e.nativeEvent.contentOffset.y > this.state.scrollY._value ? 'up' : 'down';
		if (this._scrollDirection !== direction) {
			this._scrollDirection = direction;
			if (direction === 'down' && this.state.scrollY._value > 80) {
				Animated.timing(
					this.state.barTranslate,
					{
						toValue: 0,
						duration: 300,
					}
				).start();
			} else if (this.state.scrollY._value > 80 && direction === 'up') {
				Animated.timing(
					this.state.barTranslate,
					{
						toValue: -80,
						duration: 300,
					}
				).start();
			}
		}
		Animated.event(
			[{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }]
		)(e);
	}

	camelize(str) {
		if ((str) && (typeof str === 'string')) {
			str = str
			.trim()
			.toLowerCase()
			.replace(/([^A-Za-z\u00C0-\u017F0-9]+)(.)/ig, function () {
				return arguments[2].toUpperCase();
			});
			return str.charAt(0).toUpperCase() + str.slice(1);
		}
		return '';
    }

	shareStation() {
		const { station } = this.props;
		const log = { station_id: station.id, from: 'station' };
		const url = `https://vagalume.fm/${station.slug}/`;

		const content = {
			title: 'Vagalume.FM',
			message: `Escutando a estação #${this.camelize(station.name)} no @VagalumeFM ${url}`
		};

		EventManager.trackEvent({ action: 'share', category: 'Station', params: log });
		Share.share(content, { dialogTitle: 'Compartilhar' });
	}

	renderBackground() {
		const { station } = this.props;

		return (
			<View style={styles.backgroundBody}>
				<Animated.View style={{ backgroundColor: '#1d1d1d', transform: [{ scale: this._scaleBG }, { translateY: this._translateBG }] }}>
				  {station && station.img && <ImageCache
		            source={{ uri: station.img['bg-low'] }}
		            style={styles.stationBackground}
		          />}
		          <LinearGradient
		          colors={['rgba(45, 45, 45, 0)', 'rgba(45, 45, 45, 0.5)', 'rgba(45, 45, 45, 1)']}
		          style={styles.stationBGFade}
		          />
				</Animated.View>
            </View>
		);
	}

	renderName() {
		const { station } = this.props;

		const stationNameOpacity = this.state.scrollY.interpolate({
	      inputRange: [0, 30, 66],
	      outputRange: [1, 1, 0],
	      extrapolate: 'clamp',
	    });

	    const stationFontSize = this.state.scrollY.interpolate({
	      inputRange: [0, 30, 66],
	      outputRange: [36, 36, 18],
	      extrapolate: 'clamp'
	    });

	    const hideStationName = this.state.scrollY.interpolate({
	      inputRange: [0, 70, 71],
	      outputRange: [1, 1, 0],
	      extrapolate: 'clamp'
	    });

		return (
			<View style={styles.stationNameContainer} accessible={true}>
              <Animated.Text
			  style={[styles.stationLabel, { opacity: stationNameOpacity }]}>
			  	ESTAÇÃO
              </Animated.Text>
              <Animated.Text
                style={[styles.stationName, { opacity: hideStationName, fontSize: stationFontSize }]}
              >
                {station.name}
              </Animated.Text>
            </View>
		);
	}

	render() {
		const { station, navigatorPop } = this.props;
		const { barTranslate } = this.state;

		const barElevation = this.state.scrollY.interpolate({
	      inputRange: [0, 70, 71],
	      outputRange: [0, 0, 2],
	      extrapolate: 'clamp'
	    });

		const showBarStationName = this.state.scrollY.interpolate({
	      inputRange: [0, 70, 71],
	      outputRange: [0, 0, 1],
	      extrapolate: 'clamp'
	    });

		const barOpacity = this.state.scrollY.interpolate({
	      inputRange: [0, 66, 102],
	      outputRange: ['rgba(51, 51, 51, 0)', 'rgba(51, 51, 51, 0)', 'rgba(51, 51, 51, 1)']
	    });

		return (
			<View>
				<Header
				backPage={navigatorPop}
				barElevation={barElevation}
				showBarStationName={showBarStationName}
				stationName={this.truncate(station.name)}
				barOpacity={barOpacity}
				translateY={barTranslate}
				shareStation={this.shareStation.bind(this)}
				style={styles.header}
				/>
				<ScrollView
				onScroll={this.onScroll.bind(this)}
				scrollEventThrottle={16}
				style={styles.scrollContent}
				>
					{this.renderBackground()}
					{this.renderName()}
					{this.props.children}
				</ScrollView>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	header: {
		position: 'relative',
		zIndex: 5
	},
	scrollContent: {
		backgroundColor: '#2d2d2d',
	    zIndex: 0
	},
	backgroundBody: {
		position: 'absolute',
		width,
		height: height * 0.4
	},
	stationBackground: {
      width: null,
      opacity: 0.3,
	  height: height * 0.4
  },
  stationBGFade: {
	  height: 60,
	  backgroundColor: 'transparent',
	  position: 'absolute',
	  left: 0,
	  right: 0,
	  bottom: 0
  },
  stationNameContainer: {
	  flex: 1,
	  alignItems: 'center',
	  zIndex: 2,
	  marginTop: StatusBarHeight === 0 ? 72 : 96,
	  marginBottom: 16
  },
  stationLabel: {
	  color: '#FFF',
	  fontSize: 14,
	  marginBottom: -5,
	  fontFamily: 'rubik',
	  backgroundColor: 'transparent'
  },
  stationName: {
	  color: '#CF0',
	  position: 'relative',
	  zIndex: 2,
	  fontFamily: 'rubik',
	  textAlign: 'center',
	  paddingLeft: 16,
	  paddingRight: 16,
	  backgroundColor: 'transparent'
  }
});

export default List;
