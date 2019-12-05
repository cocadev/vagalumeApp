import React, { Component } from 'react';
import {
	View,
	Text,
	Platform,
	TouchableWithoutFeedback,
	StyleSheet,
	Dimensions,
	Image,
	ScrollView,
	TouchableOpacity
} from 'react-native';
import SplashScreen from 'react-native-splash-screen';
import { connect } from 'react-redux';
import { initPlayer, getStation, getFollowingStations, followStation, unfollowStation } from '../../actions';
import { PLAYER_TYPES } from '../player/PlayerController';
import EventManager from '../containers/EventManager';
import { RecordingManager } from '../containers/StreamRecorder';
import { StationTile } from '../containers/StationTile';
import { STATE_TYPE } from '../containers/Player';
import PlayButton from '../containers/PlayButton';
import FollowButton from '../containers/FollowButton';
import Icon from '../containers/Icon';
import List from './List';
import ImageCache from '../containers/ImageCache';

const { width } = Dimensions.get('window');

class StationPage extends Component {
	constructor(props) {
		super(props);

		this.state = { isFollowing: false };

		this._navigatorPop = this.navigatorPop.bind(this);
	}

	componentWillMount() {
		this.props.getFollowingStations();

		const { stationData } = this.props.navigation.state.params;
		this.setState({ station: stationData });

		if (stationData && stationData.stream) {
			this.setState({ stationLoaded: true, isFollowing: this.isFollowing(stationData) });
			EventManager.trackView({ pageName: `Station - ${stationData.name}` });
		} else if (stationData.id || stationData.slug) {
			this.props.getStation(stationData.id || stationData.slug);
		}

		const promise = RecordingManager.listRecordingsComplete(this.props.allStations);
		if (promise) {
			promise
				.then((recordings) => {
					if (recordings instanceof Array && recordings && recordings.length) {
						try {
							const recordingsFilter = recordings.filter((obj) => obj.station.id === stationData.id);
							if (recordingsFilter instanceof Array && recordingsFilter && recordingsFilter.length) {
								this.setState({ recordings: recordingsFilter });
							}
						} catch (error) {
							// Não veio nenhuma estação para ser listada
						}
					}
				})
				.catch((error) => {
					// Não veio nenhuma estação para ser listada
				});
		}
	}

	componentDidMount() {
		setTimeout(() => {
			// Esconde o splash
			SplashScreen.hide();
		}, 10);
	}

	componentWillReceiveProps(nextProps) {
		const { station } = nextProps;

		// Caso ainda não tenha carregado as informações da estação
		if (
			station.id &&
			(this.state.station.id === station.id || this.state.station.slug === station.slug) &&
			!this.state.stationLoaded
		) {
			this.setState({ stationLoaded: true, station, isFollowing: this.isFollowing(station) });
			EventManager.trackView({ pageName: `Station - ${station.name}` });
		}
	}

	navigatorPop() {
		this.props.navigation.goBack(null);
		return true;
	}

	calculateHours(minutes) {
		if (minutes) {
			return Math.floor(minutes / 60);
		} else {
			return 0;
		}
	}

	togglePlay() {
		const { playerInstance, playerInfo, playerType } = this.props;
		const { station } = this.state;

		// Caso não tenha iniciado o player ainda ou a estação atual for diferente ou o player que estava era o offline
		if (!playerInstance || station.id !== playerInfo.id || playerType === PLAYER_TYPES.OFFLINE) {
			let type = playerType;
			// Se estava tocando offline, volta para o streamings
			if (playerType === PLAYER_TYPES.OFFLINE) type = PLAYER_TYPES.STREAM;

			this.props.initPlayer({ playerInfo: station, playerType: type, autoplay: true });
		} else if (this.props.status === STATE_TYPE.RUNNING) {
			playerInstance.stop();
		} else if (this.props.status === STATE_TYPE.STOPPED) {
			playerInstance.play();
		}
	}

	pressRecording(file) {
		const { status, playerInstance, playerType, recordingFile } = this.props;
		const recording = this.state.recordings.find((obj) => obj.id === file.id);

		// Caso esteja tocando o player com um arquivo de gravação e seja o mesmo selecionado
		if (recordingFile && playerType === PLAYER_TYPES.OFFLINE && recordingFile.id === file.id) {
			const { instance } = playerInstance;
			if (status === STATE_TYPE.RUNNING) {
				instance.stop();
			} else if (status === STATE_TYPE.STOPPED) {
				instance.play();
			}
		} else {
			if (recording.station) {
				this.props.initPlayer({
					playerInfo: recording.station,
					playerType: PLAYER_TYPES.OFFLINE,
					autoplay: true,
					recordingFile: recording
				});
			}
		}
	}

	isFollowing(station) {
		const { followingStations } = this.props;
		const stationIndex = followingStations.findIndex((obj) => obj.id === station.id);

		return stationIndex !== -1;
	}

	toggleFollow() {
		const { unfollowStation, followStation } = this.props;
		const { station, isFollowing } = this.state;

		if (isFollowing) {
			unfollowStation(station);
		} else {
			followStation(station);
		}

		this.setState({ isFollowing: !isFollowing });
	}

	renderImage() {
		const { station } = this.state;
		const placeholder = require('../../img/station_placeholder.png');
		const iosProps = Platform.OS === 'ios' ? { resizeMode: 'contain' } : {};
		const stationImage =
			station && station.img ? (
				<ImageCache source={{ uri: station.img['default'] }} style={styles.defaultImage} />
			) : (
				<Image style={styles.defaultImage} source={placeholder} />
			);

		return (
			<View style={styles.imageContainer}>
				<Image
					{...iosProps}
					source={require('../../img/blur_est.png')}
					style={[
						styles.defaultImage,
						{
							position: 'absolute',
							transform: [ { scale: 1.2 } ],
							top: 15,
							width: width * 0.65,
							marginLeft: 0.5,
							backgroundColor: 'transparent',
							opacity: 0.5
						}
					]}
				/>
				<View style={[ styles.defaultImage ]}>
					<View
						pointerEvents="none"
						style={[
							StyleSheet.absoluteFill,
							{
								backgroundColor: 'rgba(255, 255, 255, 0.2)',
								zIndex: 1,
								borderTopLeftRadius: 3,
								borderTopRightRadius: 3,
								height: 1
							}
						]}
					/>
					{stationImage}
					<View style={[ styles.imageButton, { elevation: 5 } ]}>
						<PlayButton
							green
							isDifferent={this.state.station.id !== this.props.playerInfo.id}
							onPress={this.togglePlay.bind(this)}
							player={this.props.playerInstance}
							playerStatus={this.props.status}
							size={50}
						/>
					</View>
				</View>
			</View>
		);
	}

	renderDescription() {
		const { station } = this.state;
		return (
			<View style={styles.descStationContainer}>
				<Text style={styles.descStation}>{station.desc_station}</Text>
			</View>
		);
	}

	renderFollowButton() {
		const { isFollowing } = this.state;

		return (
			<View style={styles.followButtonContainer}>
				<FollowButton isFollowing={isFollowing} toggleFollow={this.toggleFollow.bind(this)} />
			</View>
		);
	}

	renderHours() {
		const { stationLoaded, station } = this.state;
		const durationHours = this.calculateHours(station.duration_minutes);
		const showHours = durationHours > 1;
		const borderBottomWidthSize = showHours ? 0 : 1;
		const paddingBottomSize = showHours ? 0 : 16;

		if (stationLoaded) {
			return (
				<View style={styles.stationInfosContent}>
					<View
						style={[
							styles.activeMusicsContent,
							{ borderBottomWidth: borderBottomWidthSize, paddingBottom: paddingBottomSize }
						]}
						accessible={true}
					>
						<Icon name="song" size={30} color="#969696" />
						<View style={styles.clockBody}>
							<Text style={styles.musics}>{station.active_musics}</Text>
							<Text style={styles.musicsLabel}>músicas nesta estação</Text>
						</View>
					</View>
					{showHours && (
						<View style={[ styles.clockContent ]} accessible={true}>
							<View style={styles.clockBody}>
								<Text style={styles.hours}>{durationHours}h</Text>
								<Text style={styles.hoursLabel}>de música sem repetição</Text>
							</View>
						</View>
					)}
				</View>
			);
		}
	}

	renderArtists() {
		const { station } = this.state;

		return station.artists.map((artist) => (
			<View key={artist.id} style={styles.artistContainer}>
				<ImageCache source={{ uri: artist.img.small }} style={styles.artistImage} />
				<Text style={styles.artistName}>{artist.name}</Text>
			</View>
		));
	}

	renderStationArtists() {
		const { stationLoaded, station } = this.state;
		if (station.artists instanceof Array && stationLoaded && station.artists && station.artists.length > 1) {
			return (
				<View style={styles.stationArtists} accessible={true}>
					<Text style={styles.artistLabel}>
						ALGUNS <Text style={{ fontFamily: 'rubik-medium' }}>ARTISTAS NESTA ESTAÇÃO</Text>
					</Text>
					<ScrollView horizontal style={styles.artistsScroll}>
						{this.renderArtists()}
					</ScrollView>
				</View>
			);
		}
	}

	filterTime(totalSeconds) {
		totalSeconds = Math.floor(totalSeconds);

		let hours = Math.floor(totalSeconds / 3600);
		totalSeconds %= 3600;
		let minutes = Math.floor(totalSeconds / 60);
		let seconds = totalSeconds % 60;

		if (minutes < 10) {
			minutes = `0${minutes}`;
		}

		if (seconds < 10) {
			seconds = `0${seconds}`;
		}

		let time = `${minutes}:${seconds}`;

		if (hours > 0) {
			if (hours < 10) {
				hours = `0${hours}`;
			}
			time = `${hours}:${time}`;
		}

		return time;
	}

	filterDate(ts) {
		const day = new Date(ts);
		let dd = day.getDate();
		let mm = day.getMonth() + 1; //January is 0!

		const yyyy = day.getFullYear();

		if (dd < 10) {
			dd = `0${dd}`;
		}

		if (mm < 10) {
			mm = `0${mm}`;
		}

		const formattedDay = `${dd}/${mm}/${yyyy}`;
		const formattedHour = `${('0' + day.getHours()).slice(-2)}:${('0' + day.getMinutes()).slice(-2)}`;

		return (
			<View style={styles.recordingTimeBody}>
				<Text style={styles.recordingDay}>{formattedDay}</Text>
				<View style={styles.recordingHourBody}>
					<Icon name="clock" size={16} color="#AAA" />
					<Text style={styles.recordingHour}>{formattedHour}</Text>
				</View>
			</View>
		);
	}

	renderRecordings() {
		const { recordings } = this.state;
		return recordings.map((recording, key) => (
			<TouchableWithoutFeedback key={key} onPress={this.pressRecording.bind(this, recording)}>
				<View style={[ styles.recordingContainer, { borderTopWidth: key === 0 ? 0 : 1 } ]}>
					<View style={styles.recordingParent}>
						<View>
							{recording.station.img &&
							recording.station.img.default && (
								<ImageCache
									source={{ uri: recording.station.img.default }}
									style={styles.recordingImage}
								/>
							)}
						</View>
						<View style={{ marginLeft: 16 }}>
							<Text style={styles.recordingStation}>{recording.name || recording.station.name}</Text>
							<Text style={styles.recordingDuration}>Duração: {this.filterTime(recording.time)}</Text>
							{this.filterDate(recording.ts)}
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
		));
	}

	renderStationRecordings() {
		const { recordings } = this.state;
		if (recordings instanceof Array && recordings && recordings.length) {
			return (
				<View style={styles.recordingsBody}>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<Icon name="recording" size={20} color="#CF0" />
						<Text style={styles.recordingLabel}>GRAVAÇÕES DA ESTAÇÃO</Text>
					</View>
					<ScrollView>{this.renderRecordings()}</ScrollView>
				</View>
			);
		}
	}

	renderRelatedStations() {
		const { station } = this.state;
		return station.related.map((station) => (
			<StationTile key={station.id} navigation={this.props.navigation} station={station} />
		));
	}

	renderRelated() {
		const { station } = this.state;
		if (station.related instanceof Array && station.related && station.related.length) {
			return (
				<View>
					<View style={styles.relatedContent}>
						<Icon name="live" size={16} color="#CF0" />
						<Text style={styles.relatedLabel}>VEJA TAMBÉM</Text>
					</View>
					<View style={styles.relatedWrap}>{this.renderRelatedStations()}</View>
				</View>
			);
		}
	}

	render() {
		const { station } = this.state;

		return (
			<View style={styles.body}>
				<List station={station} navigatorPop={this._navigatorPop}>
					{this.renderImage()}
					{this.renderDescription()}
					{this.renderFollowButton()}
					{this.renderHours()}
					{this.renderStationArtists()}
					{this.renderStationRecordings()}
					{this.renderRelated()}
				</List>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	body: {
		flex: 1
	},
	imageContainer: {
		alignItems: 'center'
	},
	defaultImage: {
		flex: 1,
		height: width * 0.55,
		maxHeight: 280,
		width: width * 0.7,
		maxWidth: 333,
		borderRadius: 3,
		justifyContent: 'flex-end',
		alignItems: 'flex-end',
		backgroundColor: '#333'
	},
	imageBorder: {
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
		borderTopWidth: 1,
		borderRadius: 3,
		position: 'absolute',
		zIndex: 3,
		left: 0,
		top: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'transparent'
	},
	imageButton: {
		position: 'absolute',
		right: 8,
		bottom: 8,
		width: 52,
		height: 52
	},
	descStationContainer: {
		marginLeft: 16,
		marginRight: 16,
		marginTop: 26,
		paddingBottom: 14
	},
	descStation: {
		color: '#FFF',
		fontSize: 20,
		fontFamily: 'rubik',
		textAlign: 'center'
	},
	followButtonContainer: {
		alignItems: 'center',
		paddingBottom: 20,
		borderBottomColor: '#343434',
		borderBottomWidth: 1,
		borderStyle: 'solid',
		marginLeft: 16,
		marginRight: 16
	},
	stationInfosContent: {
		flexDirection: 'column',
		justifyContent: 'center'
	},
	activeMusicsContent: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginTop: 16,
		marginLeft: 16,
		marginRight: 16,
		borderBottomColor: '#343434',
		borderStyle: 'solid'
	},
	clockContent: {
		flexDirection: 'row',
		justifyContent: 'center',
		borderBottomColor: '#343434',
		marginLeft: 16,
		marginRight: 16,
		borderBottomWidth: 1,
		borderStyle: 'solid',
		paddingBottom: 16
	},
	clockImage: {
		width: 30,
		height: 30,
		marginRight: 8
	},
	clockBody: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	musicsBody: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	hours: {
		color: '#FFF',
		fontSize: 15,
		marginRight: 5,
		fontFamily: 'rubik-light'
	},
	musics: {
		color: '#FFF',
		fontSize: 22,
		marginRight: 5,
		fontFamily: 'rubik-medium'
	},
	hoursLabel: {
		color: '#FFF',
		fontSize: 13,
		fontFamily: 'rubik-light'
	},
	musicsLabel: {
		color: '#FFF',
		fontSize: 18,
		fontFamily: 'rubik'
	},
	stationArtists: {
		marginTop: 16
	},
	artistLabel: {
		color: '#CF0',
		fontSize: 14,
		marginLeft: 16,
		fontFamily: 'rubik'
	},
	artistsScroll: {
		paddingLeft: 16,
		paddingRight: 16,
		paddingBottom: 16,
		marginTop: 8
	},
	artistContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 16
	},
	artistImage: {
		width: 40,
		height: 40,
		borderRadius: 20,
		marginRight: 10
	},
	artistName: {
		color: '#FFF',
		fontSize: 12,
		fontFamily: 'rubik'
	},
	recordingsBody: {
		paddingTop: 16,
		marginRight: 16,
		marginLeft: 16,
		borderTopColor: '#343434',
		borderTopWidth: 1,
		borderStyle: 'solid'
	},
	recordingIcon: {
		height: 20,
		width: 20,
		position: 'absolute',
		bottom: -1
	},
	recordingLabel: {
		color: '#FFF',
		fontSize: 14,
		marginLeft: 5,
		fontFamily: 'rubik'
	},
	recordingContainer: {
		backgroundColor: '#2d2d2d',
		borderTopColor: '#3d3d3d'
	},
	recordingParent: {
		height: 90,
		alignItems: 'center',
		flexDirection: 'row'
	},
	recordingImage: {
		width: 60,
		height: 60,
		borderRadius: 30,
		borderColor: '#333',
		borderWidth: 1
	},
	recordingStation: {
		fontFamily: 'rubik-medium',
		color: '#FFF',
		fontSize: 14
	},
	recordingDuration: {
		fontFamily: 'rubik',
		color: '#AAA',
		fontSize: 14
	},
	recordingTimeBody: {
		alignItems: 'center',
		flexDirection: 'row'
	},
	recordingDay: {
		fontFamily: 'rubik',
		color: '#AAA',
		fontSize: 14,
		marginTop: 3,
		marginBottom: 3
	},
	recordingHourBody: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 5
	},
	recordingTimeIcon: {
		width: 14,
		height: 14
	},
	recordingHour: {
		fontFamily: 'rubik',
		color: '#AAA',
		fontSize: 14,
		marginTop: 3,
		marginBottom: 3,
		marginLeft: 4
	},
	relatedContent: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingTop: 16,
		marginLeft: 16,
		marginBottom: 10,
		borderTopColor: '#343434',
		borderTopWidth: 1,
		borderStyle: 'solid',
		marginRight: 16
	},
	relatedIcon: {
		height: 20,
		width: 20
	},
	relatedLabel: {
		color: '#FFF',
		marginLeft: 5,
		fontSize: 14,
		fontFamily: 'rubik'
	},
	relatedWrap: {
		flexDirection: 'row',
		flexWrap: 'wrap'
	}
});

const mapStateToProps = ({ stations, player }) => {
	const { station, allStations, followingStations } = stations;
	const { playerInfo, status, instance, playerType, recordingFile } = player;

	return {
		station,
		allStations,
		followingStations,
		recordingFile,
		playerInfo,
		status,
		playerInstance: instance,
		playerType
	};
};

export default connect(mapStateToProps, {
	initPlayer,
	getStation,
	getFollowingStations,
	followStation,
	unfollowStation
})(StationPage);
