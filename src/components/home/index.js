import React, { Component } from 'react';
import { Alert, View, Text, Dimensions, Linking, TouchableWithoutFeedback, ScrollView, StyleSheet, Animated, AsyncStorage, FlatList, Platform, StatusBar } from 'react-native';
import { connect } from 'react-redux';
import EventManager from '../containers/EventManager';
import SplashScreen from 'react-native-splash-screen';
import LinearGradient from 'react-native-linear-gradient';
import DeviceInfo from 'react-native-device-info';
import { getFeatured, getAllStations, getAllStationsCache, initPlayer } from '../../actions';
import { PLAYER_TYPES } from '../player/PlayerController';
import StatusBarHeight from '../containers/StatusBarHeight';
import Header from './Header';
import CardSlider from './CardSlider';
import Menu from './Menu';
import StationTile from './StationTile';
import List from './List';
import VersionChecker from './VersionChecker';
import DeviceAlert from './DeviceAlert';
import PlayerHandler from '../../../react-native-player-handler';
import Button from '../containers/Button';
import { STATIONS_CACHE } from '../../actions/JsonCache';
import Toast from 'react-native-root-toast';

// Calcula o tamanho da barra inicial
const barHeight = Platform.OS === 'ios' ? 79 : 56 + StatusBarHeight;

// Pega o tamanho do dispositivo (altura e largura)
const { width, height } = Dimensions.get('window');

const sliderHeight = width > 560 ? width * 0.8 : width * 0.95;

class HomePage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            scrollY: new Animated.Value(0),
            index: 0,
            allStations: props.allStations,
			featuredStations: props.featuredStations,
            loadingStations: false,
			showNewsPopup: false
        };

        this._lastScroll = null;
        this._barY = new Animated.Value(0);
		this._newsPopupOpacity = new Animated.Value(0);
    }

    componentWillMount() {
        this.props.getAllStationsCache();
        this.props.getFeatured();

		AsyncStorage.getItem('newPopup', (err, result) => {
			if (!result) {
				this.setState({ showNewsPopup: true });
				this._newsPopupOpacity.setValue(1);
			}
		});
    }

    componentDidMount() {
        // Envia o evento de tracking
		EventManager.trackView({ pageName: 'Home' });

        setTimeout(() => {
			SplashScreen.hide();

			// Mostra o balão de avaliar o aplicativo
			this.showRateApp();
			// Mostra o balão da notificação desligada
			this.showNotificationDisabled();
        }, 1500);
    }

    componentWillReceiveProps(nextProps) {
        const { allStations, featuredStations, filteredStations } = nextProps;

        if (this.state.loadingStations && allStations.length && allStations.length >= 1 && allStations.length <= 8) {
            this.setState({ loadingStations: false });
        }

        // Verifica se a informação está diferente
		if (allStations && allStations instanceof Array && this.state.allStations.length !== allStations.length && allStations.length > this.state.allStations.length) {
            this.setState({ allStations, loadingStations: false });
        }

		if (featuredStations instanceof Array && featuredStations && this.state.featuredStations.length !== featuredStations.length) {
            this.setState({ featuredStations });
        }

		if (filteredStations && filteredStations.length && filteredStations !== this.props.filteredStations) {
			this.setState({ allStations: filteredStations });
			setTimeout(() => {
				this.props.initPlayer({ playerInfo: filteredStations[0], playerType: PLAYER_TYPES.STREAM, autoplay: false });
			}, 300);
		}
    }

	hideNewsPopup() {
		AsyncStorage.getItem('newPopup', (err, result) => {
			if (!result) {
				AsyncStorage.setItem('newPopup', 'shown');
				this.setState({ showNewsPopup: false });
			}
		});
	}

	renderNewsTooltip() {
		if (this.state.showNewsPopup) {
			return (
				<TouchableWithoutFeedback onPress={() => {
					Animated.timing(this._newsPopupOpacity, {
						toValue: 0,
						timing: 200,
					}).start(() => {
						this.hideNewsPopup();
					});
				}}>
					<Animated.View style={{ zIndex: 4, elevation: 6, opacity: this._newsPopupOpacity, position: 'absolute', right: 8, top : 70, paddingTop: 10 }}>
						<View style={{ width: 0, height: 0,
							backgroundColor: 'transparent',
							borderStyle: 'solid',
							borderLeftWidth: 7,
							borderRightWidth: 7,
							borderBottomWidth: 10,
							borderLeftColor: 'transparent',
							borderRightColor: 'transparent',
							borderBottomColor: 'rgba(0, 0, 0, 0.8)', position: 'absolute', right: 5, top: 0}}
							/>
						<View style={{ padding: 7, borderRadius: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
							<Text style={{ fontFamily: 'rubik', fontSize: 12, color: '#FFF' }}>
								<Text style={{ fontFamily: 'rubik', fontSize: 12, color: '#CF0' }}>Precisa de ajuda?</Text>{'\n'}Fale com a gente quando quiser {'\n'}tirar dúvidas ou mandar sugestões :)
							</Text>
						</View>
					</Animated.View>
				</TouchableWithoutFeedback>
			);
		}
	}

    onScroll(e) {
        Animated.event(
            [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }]
        )(e);

        if (e.nativeEvent.contentOffset.y < 0) return;

        const barDY = e.nativeEvent.contentOffset.y - this._lastScroll;

        this._lastScroll = e.nativeEvent.contentOffset.y;
        this._barY.setValue(
            Math.max(0, Math.min(this._barY._value + barDY, barHeight))
        );
    }

    pressMenuItem(index) {
		if (!this.props.allStations || !this.props.allStations.length) return;

		const allStations = [...this.props.allStations];

        const { listeners } = this.props;

        switch (index) {
			case 0:
				EventManager.trackEvent({ action: 'clicked_home_filter', category: 'Home', params: { type: 'all' } });
                this.setState({ index, allStations });
			break;
			case 1:
				EventManager.trackEvent({ action: 'clicked_home_filter', category: 'Home', params: { type: 'top' } });

                allStations.sort((a, b) => {
                    const listenersA = listeners[a.id];
                    const listenersB = listeners[b.id];
                    if (listenersA && listenersB) {
                        return listenersB - listenersA;
                    }
                    return -1;
                });
                this.setState({ index, allStations });
            break;
            case 2:
				EventManager.trackEvent({ action: 'clicked_home_filter', category: 'Home', params: { type: 'a-z' } });

                allStations.sort((a, b) => {
                    if (a.name && b.name) {
                        const textA = a.name.toUpperCase();
                        const textB = b.name.toUpperCase();
                        const express = (textA > textB) ? 1 : 0;
                        return (textA < textB) ? -1 : express;
                    }
                    return -1;
                });
                this.setState({ index, allStations });
            break;
            default:
        }
    }

	showNotificationDisabled() {
		if (Platform.OS === 'android') {
			// Verifica se as notificações estao ativas
			PlayerHandler.isNotificationEnabled((enabled) => {
				// Disable notification
				// Type: Yes;
				if (!enabled) {
					EventManager.trackEvent({ action: 'disable_notification', category: 'Home', params: { event_type: 'opening_alert' } });
					Alert.alert(
						'Ativar as notificações?',
						'Ative as notificações para controlar o Vagalume.FM em segundo plano e na tela bloqueada.',
						[
							{
								text: 'Depois',
								onPress: () => {},
								style: 'cancel'
							},
							{
								text: ''
							},
							{
								text: 'Ativar',
								onPress: () => {
									EventManager.trackEvent({ action: 'disable_notification', category: 'Home', params: { event_type: 'active' } });
									PlayerHandler.openNotificationSettings();
								},
								style: 'default'
							}
						]
					);
				}
			});
		}
	}

	showRateApp() {
		// Balão de avaliação do aplicativo
		AsyncStorage.getItem('rateCount', (err, result) => {
			if (result == null) {
				AsyncStorage.setItem('rateCount', JSON.stringify({ value: 0 })).catch((err) => {
                    // TODO: Enviar evento para o firebase
                    if (AppState.currentState == "active") {
                        Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                    }
                });
			} else {
				let rateCount = JSON.parse(result);

				if (rateCount.value === 'finished') return;

				if (rateCount.value > 4) {
					Alert.alert(
						'Obrigado por baixar o Vagalume FM 💚',
						`Curtindo o Vagalume FM? Avalie o app na Google Play`,
						[
							{
								text: 'Não Avaliar',
								onPress: () => {
									EventManager.trackEvent({ action: 'rate_app', category: 'Home', params: { event_type: 'cancel' } });
									AsyncStorage.setItem('rateCount', JSON.stringify({ value: 'finished' })).catch((err) => {
                                        // TODO: Enviar evento para o firebase
                                        if (AppState.currentState == "active") {
                                            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                                        }
                                    });
								},
								style: 'cancel'
							},
							{
								text: 'Avaliar',
								onPress: () => {
									EventManager.trackEvent({ action: 'rate_app', category: 'Home', params: { event_type: 'success' } });

									const URL = Platform.OS === 'android'
									? 'https://play.google.com/store/apps/details?id=br.com.vagalume.fm'
									: 'itms-apps://itunes.apple.com/app/id1154246231?action=write-review&mt=8';

									Linking.openURL(URL);
									AsyncStorage.setItem('rateCount', JSON.stringify({ value: 'finished' })).catch((err) => {
                                        // TODO: Enviar evento para o firebase
                                        if (AppState.currentState == "active") {
                                            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                                        }
                                    });
								},
								style: 'default'
							},
							{
								text: 'Depois',
								onPress: () => {
									EventManager.trackEvent({ action: 'rate_app', category: 'Home', params: { event_type: 'show_after' } });
									AsyncStorage.setItem('rateCount', JSON.stringify({ value: 0 })).catch((err) => {
                                        // TODO: Enviar evento para o firebase
                                        if (AppState.currentState == "active") {
                                            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                                        }
                                    });
								}
							}
						]
					);
				} else {
					AsyncStorage.setItem('rateCount', JSON.stringify({ value: rateCount.value + 1 })).catch((err) => {
                       // TODO: Enviar evento para o firebase
                        if (AppState.currentState == "active") {
                            Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                        }
                    });
				}
			}
		});
	}

    // Renderiza as estações no FlatList
    renderItem(data) {
        const { listeners } = this.props;
        const station = data.item;
		const count = width > 560 ? 3 : 2;
        return (
            <StationTile
            key={station.id}
            navigation={this.props.navigation}
            numColumns={count}
            station={station}
            listeners={listeners[station.id]}
            />
        );
    }

    renderTryButton() {
        const backgroundColor = this.state.loadingStations ? "#AAA" : "#CF0";

        return (
            <View style={{ width, padding: 10, paddingBottom: 16 }}>
                <Button
                    style={{ backgroundColor }}
                    onPress={() => {
                        if (!this.state.loadingStations) {
                            this.props.getAllStations();
                            this.setState({ loadingStations: true });
							EventManager.trackEvent({ action: 'load_more_stations', category: 'Home' });
                        }
                    }}>
                    <Text style={styles.buttonText}>{this.state.loadingStations ? "CARREGANDO..." : "CARREGAR MAIS" }</Text>
                </Button>
            </View>
        );
    }

    renderSlider() {
        return (
            <View>
                <CardSlider
				scrollY={this.state.scrollY}
                size={sliderHeight}
                data={this.props.featured}
                navigation={this.props.navigation}
                allStations={this.props.allStations}
                style={{ height: height * 0.35, width, marginTop: barHeight + 8 }}
                />
				<View style={styles.versionContainer}>
					<VersionChecker />
					<DeviceAlert />
				</View>
                <Menu
                index={this.state.index}
                pressMenuItem={this.pressMenuItem.bind(this)}
                />
				{this.renderNewsTooltip()}
            </View>
        );
    }

	showSlaaskModal() {
		function guid() {
			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
			}
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
		}

		this.hideNewsPopup();

		function encodeQueryData(data) {
			let ret = [];
			for (let d in data)
			ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]));
			return ret.join('&');
		}

		AsyncStorage.getItem('slaask_token')
		.then(token => {
			if (!token) {
				token = guid();
				AsyncStorage.setItem('slaask_token', token);
			}

			const params = {
				visitor_token: token,
				device: DeviceInfo.getModel(),
				brand: DeviceInfo.getBrand(),
				version: DeviceInfo.getVersion(),
				system: DeviceInfo.getSystemVersion()
			};

			Linking.openURL('http://suporte.vagalume.fm/?' + encodeQueryData(params));
		})
		.catch(err => {
		});
	}

    render() {
        return (
            <View style={styles.body}  accessible={false}>
                <Header
                navigation={this.props.navigation}
                scrollY={this.state.scrollY}
				showSlaaskModal={this.showSlaaskModal.bind(this)}
                barY={this._barY}
                />
                <Menu
                animated
                offset={sliderHeight}
                barY={this._barY}
                scrollY={this.state.scrollY}
                index={this.state.index}
                pressMenuItem={this.pressMenuItem.bind(this)}
                />
                <List
                onScroll={this.onScroll.bind(this)}
                data={this.state.allStations}
                renderItem={this.renderItem.bind(this)}
                renderTryButton={this.renderTryButton.bind(this)}
                ListHeaderComponent={this.renderSlider.bind(this)}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    body: {
        flex: 1,
        backgroundColor: '#2d2d2d'
    },
    buttonText: {
        fontFamily: 'rubik-bold',
        color: '#2d2d2d',
        paddingTop: 3,
        paddingBottom: 3
    },
	versionContainer: {
		paddingLeft: 16,
		paddingRight: 16
	}
});

const mapStateToProps = ({ stations }) => {
    const { featured, allStations, listeners, filteredStations } = stations;

    return { featured, allStations, listeners, filteredStations };
};

export default connect(mapStateToProps, { initPlayer, getFeatured, getAllStations, getAllStationsCache })(HomePage);
