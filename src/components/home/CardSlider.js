import React, { Component } from 'react';
import { View, ScrollView, Image, Animated, Easing, Dimensions, StyleSheet, TouchableWithoutFeedback, Linking, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import EventManager from '../containers/EventManager';
import ImageCache from '../containers/ImageCache';

const { width } = Dimensions.get('window');

class CardSlider extends Component {

	constructor(props) {
		super(props);

		this.state = {
			indicatorIndex: 0,
			scrollY: new Animated.Value(0)
		};

		// Índice da card no slider
		this._index = -1;
		// Alinhamento dos cards no slider (offset)
		this._offset = (width - this.props.size) / 2;

		// Controles da velocidade do "gesture"
		this._t0 = null;
		this._x0 = null;
		this._vx = null;
		this._fadeIn = new Animated.Value(0);
		this.fadeIn();
	}

	componentWillMount() {
		this._scaleBG = Platform.OS === 'ios' ? this.props.scrollY.interpolate({
			inputRange: [-100, 0],
			outputRange: [2, 1],
			extrapolate: 'clamp'
		}) : 1;

		this._translateBG = Platform.OS === 'ios' ? this.props.scrollY.interpolate({
			inputRange: [-100, 0],
			outputRange: [-50, 0],
			extrapolate: 'clamp'
		}) : 0;
	}

	onScroll(e) {
		const t1 = Date.now();
		const x1 = e.nativeEvent.contentOffset.x;

		if (this._t0 !== null && this._x0 !== null) {
			const dx = x1 - this._x0;
			const t = t1 - this._t0;

			// Cálculo da velocidade
			this._vx = dx / t;
		}

		this._t0 = t1;
		this._x0 = x1;
	}

	onScrollEndDrag(e) {
		// Caso a velocidade do "gesture" for rápida, passa para o próximo card
		if (Math.abs(this._vx) > 0.01) {
			// Verifica a direção do card (esquerda o direita)
			this.index += this._vx > 0 ? 1 : -1;
		} else {
			// Verifica se a posição final precisa scrollar para o próxima card
			const { size } = this.props;
			const x = e.nativeEvent.contentOffset.x + (width / 2);
			const index = Math.floor(x / size);

			// Seta o novo index
			this.index = index;
		}
	}

	// Getter e Setter do índice do slider
	set index(i) {
		const { data } = this.props;
		const index = Math.max(0, Math.min(i, data.length - 1));

		if (index !== this._index) this._index = index;

		const x = (this._index * this.props.size) - this._offset;
		this.scrollView.scrollTo({ x });

		if (this.state.indicatorIndex !== index) this.fadeIn();

		this.setState({ indicatorIndex: index });
	}

	get index() {
		return this._index;
	}

	onPress(card) {
		if (card.external) {
			Linking.openURL(card.external);
		} else if (card.stationID) {
			const { allStations } = this.props;
			let stationData = { id: card.stationID };

			if (allStations && allStations instanceof Array && allStations.length) {
				const data = allStations.find((station) => station.id === card.stationID);
				if (data) stationData = data;
			}
			this.props.navigation.navigate('Station', { stationData });
			EventManager.trackEvent({ action: 'clicked_hotspot', category: 'Home', params: { station_id: card.stationID } });
		}
	}

	fadeIn() {
		this._fadeIn.setValue(0);
		Animated.timing(
			this._fadeIn,
			{
				toValue: 1,
				duration: 500,
				easing: Easing.linear
			}
		).start(() => {});
	}

	// Renderiza os cards baseado no "data" passado no componente
	renderCards() {
		const { data, size } = this.props;

		if (!data || !data.length) {
			return [
				<View key={0} style={{ width: size, paddingRight: 0, paddingLeft: 10 }}>
					<View style={{ flex: 1, backgroundColor: '#333', borderRadius: 3 }} />
				</View>,
				<View key={1} style={{ width: size, paddingRight: 10, paddingLeft: 10 }}>
					<View style={{ flex: 1, backgroundColor: '#333', borderRadius: 3 }} />
				</View>
			];
		}

		const ret = [];
		for (let key = 0; key < data.length; key++) {
			const card = data[key];
			let paddingLeft = 5;
			let paddingRight = 5;
			let paddingBottom = 5;
			let paddingTop = 5;

			if (key === 0) paddingLeft = 10;
			if (data && data instanceof Array && data.length > 1 && key === data.length - 1) {
				paddingRight = 10;
			}

			const source = card.offline ? card.img : { uri: card.img, cache: 'force-cache' };
			const accessibilityText = `Item na lista: ${key+1}º Destaque.`;

			ret.push((
				<TouchableWithoutFeedback key={key} onPress={this.onPress.bind(this, card)} accessible={true} accessibilityLabel={accessibilityText} accessibilityTraits={'button'} accessibilityComponentType={'button'}>
					<View key={key} style={{ width: size, paddingRight, paddingLeft, paddingTop, paddingBottom }}>
						<View style={{ flex: 1, backgroundColor: '#333', borderRadius: 3, elevation: 5 }}>
							<View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.2)', zIndex: 1, borderTopLeftRadius: 3, borderTopRightRadius: 3, height: 1 }]} />
							<ImageCache source={source} style={{ flex: 1, borderRadius: 3, width: size - (paddingRight + paddingLeft)}} />
						</View>
					</View>
				</TouchableWithoutFeedback>
			));
		}
		return ret;
	}

	renderIndicators() {
		const { data } = this.props;
		const { indicatorIndex } = this.state;
		let indicators = <View />;

		if (data && data instanceof Array && data.length > 1) {
			indicators = data.map((item, key) => {
				const size = (key === indicatorIndex) ? 8 : 6;
				const backgroundColor = (key === indicatorIndex) ? 'white' : 'rgba(255, 255, 255, 0.4)';

				return (
					<View key={key} style={{ width: size, height: size, margin: 3, borderRadius: 4, backgroundColor }} />
				);
			});
		}

		return (
			<View style={styles.indicators}>
				{indicators}
			</View>
		);
	}

	renderBackground() {
		const { data } = this.props;
		const key = this.state.indicatorIndex;
		const size = width > 560 ? this.props.size * 0.65 : this.props.size;

		const fadeIn = this._fadeIn.interpolate({
			inputRange: [0, 0.5, 1],
			outputRange: [0, 0, 1]
		});

		if (data && data instanceof Array && data.length) {

			const hasData = data[key];
			const hasOffline = hasData && data[key].offline;
			const hasImg = hasData && data[key].img ;
			const source = hasData && hasOffline && hasImg ? data[key].img : hasImg ? { uri: data[key].img, cache: 'force-cache' } : null;

			return (
				<Animated.View style={{ position: 'absolute', top: 0, transform: [{ scale: this._scaleBG }, { translateY: this._translateBG }], opacity: fadeIn }}>
					<Image
					source={source}
					blurRadius={5}
					style={{ width, height: size, opacity: 0.3 }}
					/>
					<LinearGradient
					  colors={['rgba(45, 45, 45, 0)', 'rgba(45, 45, 45, 0.5)', 'rgba(45, 45, 45, 1)']}
					  style={styles.shadow}
					/>
				</Animated.View>
			);
		}

		return <View />;
	}

	render() {
		return (
			<View>
				{this.renderBackground()}
				<ScrollView
				ref={(scrollView) => { this.scrollView = scrollView; }}
				horizontal
				scrollEventThrottle={10}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				onScroll={this.onScroll.bind(this)}
				onScrollEndDrag={this.onScrollEndDrag.bind(this)}
				style={this.props.style}
				>
					{this.renderCards()}
				</ScrollView>
				{this.renderIndicators()}
			</View>
		);
	}
}

const styles = StyleSheet.create({
	indicators: {
		flexDirection: 'row',
		alignItems: 'center',
		margin: 10,
		marginBottom: 0,
		justifyContent: 'center',
		zIndex: 2,
		height: 8
	},
	shadow: {
		height: 60,
		backgroundColor: 'transparent',
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 1
	}
});

export default CardSlider;
