import React, { Component } from 'react';
import { connect } from 'react-redux';
import { View, Text, Animated, AppState, StyleSheet, Image, ImageBackground, ScrollView, TouchableOpacity, Dimensions, Platform, AsyncStorage, Keyboard } from 'react-native';
import lunr from 'lunr';
import Input from './Input';
import SearchCloud from './SearchCloud';
import Icon from '../containers/Icon';
import { StationTile } from '../containers/StationTile';
import EventManager from '../containers/EventManager';
import Toast from 'react-native-root-toast';

const { height, width } = Dimensions.get('window');

class SearchPage extends Component {
    constructor(props) {
        super(props);

        this._navigatorPop = this.navigatorPop.bind(this);

        this.state = {
			text: '',
            searchList: { stations: [] },
            recentList: { stations: [] },
            keyboardOpened: false
        };

		this.idx;

		this.searchInput = {};
		this.searchTimeout = null;
    }

    componentWillMount() {
        AsyncStorage.getItem('recentSearch', (err, result) => {
            if (result != null) {
                const recentList = JSON.parse(result);
                this.setState({ recentList });
            }
        });

        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (info) => {
            if (info.endCoordinates) this.setState({ keyboardOpened: info.endCoordinates.height });
        });

        this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            this.setState({ keyboardOpened: false });
        });
    }

	normaliseSearch(word) {
		return word
		.replace('á', 'a')
		.replace('ã', 'a')
		.replace('à', 'a')
		.replace('é', 'e')
		.replace('ê', 'e')
		.replace('í', 'i')
		.replace('ó', 'o')
		.replace('ô', 'o')
		.replace('ú', 'u')
		.replace('Á', 'A')
		.replace('É', 'E')
		.replace('Í', 'I')
		.replace('Ó', 'O')
		.replace('Ô', 'O')
		.replace('Ú', 'U');
	}

	normalizeArtists(name) {
		if (name && typeof name == 'string') {
			return name
			.replace(/\bThe\b/i, '').trim();
		}

		return '';
	}

	componentDidMount() {
		const allStations = [];
		if (this.props.allStations && this.props.allStations.length) {
			for (var i = 0; i < this.props.allStations.length; i++) {
				if (this.props.allStations[i]) {
					const station = { ...this.props.allStations[i] };
					allStations.push(station);
				}
			}
		}

		if (allStations && allStations.length) {
			const that = this;
			this.idx = lunr(function () {
				this.ref('id');
				this.field('name_search');
				this.field('name_artists');

				allStations.forEach((station) => {
					station.name_search = that.normaliseSearch(station.name);
					if (station.artists && !station.name_artists) {
						station.name_artists = [];
						station.artists.forEach((artist) => {
							station.name_artists.push(that.normalizeArtists(artist.name));
						});
					}
					this.add(station);
				}, this);
			});
		}

		EventManager.trackView({ pageName: 'Search' });
    }

    componentWillUnmount() {
        this.keyboardDidShowListener.remove();
        this.keyboardDidHideListener.remove();
    }

    navigatorPop() {
        if (this.searchInput && this.state.searchList.stations.length) {
			this.searchInput.blur();
			return false;
		} else {
			this.props.navigation.goBack();
			return true;
		}
    }

	clearSearchList() {
		this.setState({
			searchList: { stations: [] }
		});
	}

    insertIntoRecentSearch(item) {
        // Cancela a requisição em andamento
        setTimeout(() => {
            if (this.searchInput) {
                const saveInstanceState = true;
				this.searchInput.blur(saveInstanceState);
            }
        }, 1000);

        let recentList = { stations: [] };

        AsyncStorage.getItem('recentSearch', (err, result) => {
            const recentKey = 'stations';

            if (result) {
                recentList = JSON.parse(result);
                if (recentList[recentKey] && item != null ) {
                    const isInside = recentList[recentKey].findIndex((obj) => item.id === obj.id);
                    const listLength = recentList[recentKey].length;
                    const listLimit = 6;
                    if (isInside !== -1) {
                        recentList[recentKey].splice(isInside, 1);
                    } else if (listLength >= listLimit) {
                        recentList[recentKey].splice(listLength - 1, 1);
                    }
                }
            }

            if (recentList && recentList[recentKey] instanceof Array) recentList[recentKey].unshift(item);


            AsyncStorage.setItem('recentSearch', JSON.stringify(recentList)).catch((err) => {
                // TODO: Enviar evento para o firebase
                if (AppState.currentState == "active") {
                    Toast.show("Desculpe, algumas ações não foram concluídas por falta de espaço");
                }
            });
            this.setState({ recentList });
        });
    }

	searchWords(text) {
		if (this.searchInput) this.searchInput.setText(text);
	}

    search(value) {
		clearTimeout(this.searchTimeout);

		if (typeof value != "string" || !value || !value.length) {
            this.setState({ text: '', searchList: { stations: [] } });
            return;
        }

		value = value.trim();

		const searchValue = this.normaliseSearch(value).replace(/\s+([^\s])/g, "* $1").trim();
		this.searchTimeout = setTimeout(() => {
			if (this.idx && this.idx.search) {
				const result = this.idx.search(`name_search:${searchValue}* name_search:${searchValue}~1 name_artists:${searchValue}* name_artists:${searchValue}~1`);
				const stations = result.map(item => {
					const station = this.props.allStations.find(obj => obj.id === item.ref);
					return station;
				});

				this.setState({ text: value, searchList: { stations } });
			}
		}, 200);
    }

	renderTitle() {
		if (this.state.text && this.state.searchList && this.state.searchList.stations && this.state.searchList.stations.length) {
			return (
				<Text style={[ styles.title, { paddingLeft: 14, paddingRight: 8, fontSize: 14 } ]}>
					{`EXIBINDO RESULTADOS PARA "${this.state.text}"`}
				</Text>
			);
		};
	}

    renderStationResult(resultList) {
        const { stations } = resultList || this.state.searchList;

        if (stations && stations instanceof Array && stations.length) {
            return (
                <View style={{ marginBottom: 10 }}>
					{this.renderTitle()}
                    <View style={styles.stationsContainer}>
                        {
                            stations.map((station, key) =>
                                <StationTile
                                onPress={this.insertIntoRecentSearch.bind(this, station)}
                                key={key}
                                navigation={this.props.navigation}
                                station={station}
                                tilesPerRow={3}
                                />
                            )
                        }
                    </View>
                </View>
            );
        }
    }

    renderSearchList() {
        return (
            <View style={{ flex: 1 }}>
                {this.renderStationResult()}
            </View>
        );
    }

    renderRecentSearch() {
        return (
            <View style={{ flex: 1 }}>
                {this.renderStationResult(this.state.recentList)}
            </View>
        );
    }

    renderSearch() {
        // Caso exista estações na lista
        const { stations } = this.state.searchList;
        const { keyboardOpened } = this.state;

        if (stations && stations instanceof Array && stations.length) {
            return (
                <View>
                    <ScrollView style={{ height: null }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="always">
                        <View style={styles.scrollContent}>
                            {this.renderSearchList()}
                        </View>
                    </ScrollView>
                </View>
            );
        }

        if (this.state.recentList.stations && this.state.recentList.stations instanceof Array && this.state.recentList.stations.length) {
            return (
                <View>
                    <Text style={{ paddingLeft: 14, color: '#999', fontSize: 14, fontFamily: 'rubik-medium', paddingTop: 10, paddingBottom: 4 }}>
                        RECENTES
                    </Text>
                    <ScrollView style={{ height: null }} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="always">
                        <View style={styles.scrollContent}>
                            {this.renderRecentSearch()}
                        </View>
                    </ScrollView>
                </View>
            );
        }

        return (
            <View style={styles.placeholderBody}>
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: 20 }}>
					<Icon name="search" size={14} color="#969696" style={{ marginRight: 4 }} />
					<Text style={{ color: '#969696' }}>SUGESTÕES DE BUSCA</Text>
				</View>
				<SearchCloud search={this.searchWords.bind(this)} />
            </View>
        );
    }

    renderHeader() {
        return (
			<Input
			ref={(searchInput) => { this.searchInput = searchInput; }}
			search={this.search.bind(this)}
			clearSearchList={this.clearSearchList.bind(this)}
			navigation={this.props.navigation}
			/>
        );
    }

    render() {
        return (
            <View style={styles.parent}>
                {this.renderHeader()}
                <View
                style={{ flex: 1, backgroundColor: '#2d2d2d' }}
                >
                    {this.renderSearch()}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    parent: {
        flex: 1,
        backgroundColor: '#2d2d2d'
    },
    scrollContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 1,
        marginTop: 1
    },
	title: {
		color: '#CF0',
		fontSize: 16,
		fontFamily: 'rubik-medium',
		paddingTop: 10,
		paddingBottom: 10
	},
	stationsContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	},

	placeholderBG: {
		height: height / 2,
		width
	},
    placeholderBody: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	placeholderContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	heart: {
		width: 60,
		height: 60,
		marginBottom: 10
	},
	notFound: {
		width: 70,
		height: 70
	},
	placeholderText: {
		color: '#FFF',
		fontSize: 18,
		textAlign: 'center',
		fontFamily: 'rubik-medium',
		paddingRight: 16,
		paddingLeft: 16,
		backgroundColor: 'transparent'
	}
});

const mapStateToProps = ({ stations }) => {
	const { allStations } = stations;
	return { allStations };
};

export default connect(mapStateToProps)(SearchPage);
