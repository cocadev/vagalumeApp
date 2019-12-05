import React, { Component } from 'react'
import { Animated, View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { NavigationActions } from 'react-navigation';
import EventManager from './EventManager';
import Icon from './Icon';

const Touchable = Platform.select({
	ios: () => require('TouchableWithoutFeedback'),
	android: () => require('TouchableNativeFeedback')
})();

const { width } = Dimensions.get('window');

class Tabs extends Component {
	goSearch() {
		const { currentScreen } = this.props;
		if (currentScreen !== 'Search' && this.props.navigation && this.props.navigation.dispatch) {
			this.props.navigation.dispatch({ type: 'Navigation/NAVIGATE', routeName: 'Search'});
		}

		EventManager.trackEvent({ action: 'clicked_tabs', category: 'Tabs', params: { page_type: 'search' } });
	}

	goFollowing() {
		const { currentScreen } = this.props;
		if (currentScreen !== 'Following' && this.props.navigation && this.props.navigation.dispatch) {
			 this.props.navigation.dispatch({ type: 'Navigation/NAVIGATE', routeName: 'Following'});
		}

		EventManager.trackEvent({ action: 'clicked_tabs', category: 'Tabs', params: { page_type: 'following' } });
	}

	goRecordings() {
		const { currentScreen } = this.props;
		if (currentScreen !== 'Recordings' && this.props.navigation && this.props.navigation.dispatch) {
			this.props.navigation.dispatch({ type: 'Navigation/NAVIGATE', routeName: 'Recordings'});
		}

		EventManager.trackEvent({ action: 'clicked_tabs', category: 'Tabs', params: { page_type: 'recordings' } });
	}

	goHome() {
		const { navigation } = this.props;
		// Verifica se possui o state de navegação
		if (navigation.state) {
			const { nav } = navigation.state;
			// Caso tenha rotas para voltar
			if (nav && nav.routes && nav.routes instanceof Array && nav.routes.length) {
				const { routes } = nav;
				const index = routes.findIndex((route) => route.routeName === 'Home');

				EventManager.trackEvent({ action: 'clicked_tabs', category: 'Tabs', params: { page_type: 'home' } });

				// Verifica se a home está no stack de navegação
				if (index > -1) {
					const home = index + 1;

					// Pega uma rota depois da home para prosseguir com o "back"
					if (routes[home]) {
						const backAction = NavigationActions.back({ key: routes[home].key });
						if (this.props.navigation && this.props.navigation.dispatch) {
							this.props.navigation.dispatch(backAction);
						}
					}
				} else {
					// Navega para uma nova home
					if (this.props.navigation && this.props.navigation.dispatch) {
						this.props.navigation.dispatch({ type: 'Navigation/NAVIGATE', routeName: 'Home'});
					}
				}
			}
		}
	}

	renderHomeButton() {
		const color = this.props.currentScreen === 'Home' ? '#CF0' : '#FFF';
		return (
			<Touchable
			hitSlop={{ top: 0, left: 10, right: 10, bottom: 10 }}
			onPress={this.goHome.bind(this)}
			>
				<View style={styles.tab}>
					<View style={styles.touchable}>
						<Icon name="home" size={20} color={color} style={styles.icon} />
						<Text style={[styles.label, { color: this.props.currentScreen === 'Home' ? '#CF0': '#969696' }]}>Início</Text>
					</View>
				</View>
			</Touchable>
		);
	}

	renderFollowingButton() {
		const color = this.props.currentScreen === 'Following' ? '#CF0' : '#FFF';
		return (
			<Touchable
			hitSlop={{ top: 0, left: 10, right: 10, bottom: 10 }}
			onPress={this.goFollowing.bind(this)}
			>
				<View style={styles.tab}>
					<View style={styles.touchable}>
						<Icon name="heart_on" size={20} color={color} style={styles.icon} />
						<Text style={[styles.label, { color: this.props.currentScreen === 'Following' ? '#CF0': '#969696' }]}>Seguindo</Text>
					</View>
				</View>
			</Touchable>
		);
	}

	renderRecordingsButton() {
		const color = this.props.currentScreen === 'Recordings' ? '#CF0' : '#FFF';
		return (
			<Touchable
			hitSlop={{ top: 0, left: 10, right: 10, bottom: 10 }}
			onPress={this.goRecordings.bind(this)}
			>
				<View style={styles.tab}>
					<View style={styles.touchable}>
						<Icon name="recording" size={20} color={color} style={styles.icon} />
						<Text style={[styles.label, { color: this.props.currentScreen === 'Recordings' ? '#CF0': '#969696' }]}>Gravações</Text>
					</View>
				</View>
			</Touchable>
		);
	}

	renderSearchButton() {
		const color = this.props.currentScreen === 'Search' ? '#CF0' : '#FFF';
		return (
			<Touchable
			hitSlop={{ top: 0, left: 10, right: 10, bottom: 10 }}
			onPress={this.goSearch.bind(this)}
			>
				<View style={styles.tab}>
					<View style={styles.touchable}>
						<Icon name="search" size={20} color={color} style={styles.icon} />
						<Text style={[styles.label, { color: this.props.currentScreen === 'Search' ? '#CF0': '#969696' }]}>Busca</Text>
					</View>
				</View>
			</Touchable>
		);
	}

	render() {
		const { tabsHeight } = this.props;

		return (
			<Animated.View style={[styles.body, { height: tabsHeight, transform: [{ translateY: this.props.tabsTranslate }] }]}>
				{this.renderHomeButton()}
				{this.renderFollowingButton()}
				{this.renderRecordingsButton()}
				{this.renderSearchButton()}
			</Animated.View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		width,
		backgroundColor: '#333',
		borderTopColor: '#2d2d2d',
		borderTopWidth: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		position: 'absolute',
		bottom: 0,
		zIndex: 10,
		elevation: 4
	},
	icon: {
		height: 20,
		marginBottom: 2
	},
	label: {
		fontFamily: 'rubik',
		fontSize: 10
	},
	tab: {
		justifyContent: 'center',
		alignItems: 'center',
		flex: 1
	},
	touchable: {
		justifyContent: 'center',
		alignItems: 'center',
		width: 70,
		paddingLeft: 10,
		paddingRight: 10,
		flex: 1
	}
});

export default Tabs;
