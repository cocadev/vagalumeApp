import React, { Component } from 'react';
import { View, Dimensions, ScrollView, TouchableOpacity, StyleSheet, Image, Text } from 'react-native';
import { connect } from 'react-redux';
import { getFollowingStations } from '../../actions';
import StatusBarHeight from '../containers/StatusBarHeight';
import { StationTile } from '../containers/StationTile';
import Button from '../containers/Button';
import Icon from '../containers/Icon';
import Header from './Header';
import analytics from '../../lib/analytics';
import EventManager from '../containers/EventManager';

const { height, width } = Dimensions.get('window');

class FollowingPage extends Component {

	constructor(props) {
		super(props);

		this._navigatorPop = this.navigatorPop.bind(this);
	}

	componentWillMount() {
        this.props.getFollowingStations();
    }

	componentDidMount() {
		EventManager.trackView({ pageName: 'Following' });
    }

	// Remove uma página da lista de histórico
    navigatorPop() {
        this.props.navigation.goBack();
        return true;
    }

	// Volta para a lista de estações principal
    exploreStations() {
        this.props.navigation.navigate('Home');
    }

	goSearch() {
        this.props.navigation.navigate('Search');
    }

	renderFollowingStations() {
		const { followingStations, navigation } = this.props;
		return followingStations.map(station =>
			<StationTile
			key={station.id}
			navigation={navigation}
			station={station}/>
		);
	}

	renderStationList() {
		const { followingStations } = this.props;
		const accessibilityText = 'Seguir mais estações';
		if (followingStations && followingStations instanceof Array && followingStations.length) {
			const PLACE_SIZE = width > 560 ? (width / 4) - 4 : (width / 2) - 2;
            return (
                <ScrollView>
                    <View style={styles.scrollContent}>
                        {this.renderFollowingStations()}
                        <TouchableOpacity onPress={this.goSearch.bind(this)} accessible={true} accessibilityLabel={accessibilityText} accessibilityTraits={'button'} accessibilityComponentType={'button'}> 
                            <View style={[styles.placeholderTile, { width: PLACE_SIZE, height: PLACE_SIZE }]}>
                                <Image resizeMode="cover" source={require('../../img/follow_placeholder.png')} style={{ borderRadius: 3, width: PLACE_SIZE - 2, height: PLACE_SIZE - 2 }} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            );
		} else {
			return this.renderPlaceholder();
		}
	}

	renderPlaceholder() {
		// TODO: (1)
		return (
			<View style={styles.placeholderContent} accessible={true}>
				<Image
				source={require('../../img/station_list_placeholder.png')}
				style={[styles.placeholderBG, { position: 'absolute'}]}
				resizeMode="contain"
				/>
				<View style={styles.placeholderContent}>
					<Icon name="heart_on" size={60} color="#CF0" />
					<Text style={styles.placeholderText}>
						Você ainda não está
					</Text>
					<Text style={[styles.placeholderText, { marginBottom: 16 }]}>
						seguindo nenhuma estação
					</Text>
				</View>
			</View>
		);
	}

	render() {
		return (
			<View style={styles.body}>
                <Header
				navigatorPop={this._navigatorPop}
				/>
                {this.renderStationList()}
            </View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		flex: 1,
        backgroundColor: '#2d2d2d'
	},
	placeholderBG: {
		height: height / 2
	},
	placeholderContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	placeholderHeart: {
		width: 60,
		height: 60
	},
	placeholderText: {
		color: '#FFF',
		fontSize: 18,
		textAlign: 'center',
		fontFamily: 'rubik',
		backgroundColor: 'transparent'
	},
	placeholderButton: {
		color: '#2d2d2d',
		fontFamily: 'rubik'
	},
	scrollContent: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 1,
        marginTop: 1
    },
	placeholderTile: {
		padding: 2,
		borderRadius: 3,
		justifyContent: 'center',
		alignItems: 'center'
	}
});

const mapStateToProps = ({ stations }) => {
    const { followingStations } = stations;
    return { followingStations };
};

export default connect(mapStateToProps, { getFollowingStations })(FollowingPage);
