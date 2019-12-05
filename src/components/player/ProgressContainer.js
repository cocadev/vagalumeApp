import React, { Component } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { STATE_TYPE } from '../containers/Player';
import Timer from '../containers/Timer';
import Icon from '../containers/Icon';
import { PLAYER_TYPES } from './PlayerController';
import ProgressBar from './ProgressBar';
import RecorderTimer from './RecorderTimer';

const { width } = Dimensions.get('window');

class ProgressContainer extends Component {
	constructor(props) {
		super(props);

		this.state = { recordingOpacity: new Animated.Value(1) };
		this.isPulsing = false;
	}

	componentWillReceiveProps(nextProps) {
		const { isRecording, status, song } = nextProps;

		// Controle das váriáveis de gravação
		if (isRecording && !this.isPulsing) {
            this.startPulseRecording();
        } else if (!isRecording && this.isPulsing) {
            this.stopPulseRecording();
        }
	}

	stopPulseRecording() {
		const { recordingOpacity } = this.state;

        this.isPulsing = false;
        recordingOpacity.stopAnimation();
        recordingOpacity.setValue(1);
    }

	startPulseRecording() {
        this.isPulsing = true;
        this.pulseRecording();
    }

	pulseRecording() {
        Animated.sequence([
            Animated.timing(this.state.recordingOpacity,
                {
                    toValue: 0.2,
                    duration: 1000
                }
            ),
            Animated.timing(this.state.recordingOpacity,
                {
                    toValue: 1,
                    duration: 1000
                }
            )
        ]).start(() => {
            if (!this.isPulsing) return;
            this.pulseRecording();
        });
    }

	filterDate(ts) {
        const day = new Date(ts);
        let dd = day.getDate();
        let mm = day.getMonth() + 1;

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
            <View style={styles.recordedDay}>
                <Text style={styles.recordedDayText}>
                    {formattedDay}
                </Text>
                <View style={styles.recordedHour}>
					<Icon name="clock" size={14} color="#AAA" />
                    <Text style={styles.recordedHourText}>
                        {formattedHour}
                    </Text>
                </View>
            </View>
        );
    }

	renderRecordingTitle() {
		const { isRecording } = this.props;
		const { recordingOpacity } = this.state;

		if (isRecording) {
			return (
				<View style={styles.recordingContainer}>
					<Animated.View style={[styles.recordingSignal, { opacity: recordingOpacity }]} />
					<Text style={styles.recordingTitle}>
						GRAVANDO
					</Text>
				</View>
			)
		}
	}

	renderNextSong() {
		const { isRecording, playerType, nextSongList, song } = this.props;
		if (!isRecording && playerType === PLAYER_TYPES.STREAM && song && song.title && song.title.id && nextSongList && nextSongList.length) {
			const nextSong = nextSongList[0];
			return (
				<View style={[styles.recordingContainer, { flex: 1 }]} accessible={true}>
					<View style={{ flex: 1, justifyContent: 'center' }}>
						<Text numberOfLines={1} style={[styles.recordingTitle, { textAlign: 'center' }]}>
							<Text style={[styles.recordingTitle, { color: '#CF0' }]}>
								Próxima música:
							</Text>
							{` ${nextSong.artist.name} - ${nextSong.title.name}`}
						</Text>
					</View>
				</View>
			);
		}
	}

	renderRecordingDate() {
		const { playerType, recordingFile } = this.props;
		if (playerType === PLAYER_TYPES.OFFLINE) {
			return (
				<View style={styles.recordingDateBody}>
					<Icon name="recording" size={14} color="#CF0" style={{ marginRight: 4 }} />
                    <Text style={styles.recordedText}>GRAVADO EM</Text>
                    {this.filterDate(recordingFile.ts)}
                </View>
			)
		}
	}

	render() {
		const { isRecording, song, status, station } = this.props;
		const containerBackground = song.duration != null ? 'rgba(93, 93, 93, 1)' : 'rgba(255, 255, 255, 0.1)';

		return (
			<View style={{ top: 16 }}>
                <View style={styles.recordingBody}>
					{this.renderRecordingTitle()}
					{this.renderNextSong()}
                    {isRecording && <View>
                        <RecorderTimer recordingTS={isRecording} />
                    </View>}
                </View>
                {this.renderRecordingDate()}
                <View style={styles.progressBody}>
                    <View style={[styles.progressContainer, { backgroundColor: containerBackground }]}>
                        <ProgressBar
						playingSong={song}
						status={status}
						playerInfo={station}
						rounded
						size={width - 64}
						/>
                    </View>
                    <Timer
					playingSong={song}
					playerInfo={station}
					status={status}
					/>
                </View>
            </View>
		);
	}
}

const styles = StyleSheet.create({
	recordingBody: {
		position: 'absolute',
		top: -22,
		flexDirection: 'row',
		justifyContent: 'space-between',
		right: 0,
		left: 0
	},
	recordingContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	recordingSignal: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#E24F27',
		marginRight: 8
	},
	recordingTitle: {
		color: '#FFF',
		fontSize: 12,
		fontFamily: 'rubik',
		backgroundColor: 'transparent'
	},
	recordingDateBody: {
		position: 'absolute',
		top: -27,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		right: 0,
		left: 0
	},
	recordingIcon: {
		width: 18,
		height: 18,
		marginRight: 6
	},
	recordedText: {
		color: '#FFF',
		fontSize: 11,
		fontFamily: 'rubik',
		backgroundColor: 'transparent'
	},
	recordedDay: {
		marginLeft: 7,
		alignItems: 'center',
		flexDirection: 'row'
	},
	recordedDayText: {
		fontFamily: 'rubik-bold',
		color: '#FFF',
		fontSize: 11,
		marginTop: 3,
		marginBottom: 3,
		backgroundColor: 'transparent'
	},
	recordedHour: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 8
	},
	recordedIcon: {
		width: 14,
		height: 14
	},
	recordedHourText: {
		fontFamily: 'rubik-bold',
		color: '#FFF',
		fontSize: 11,
		marginTop: 3,
		marginBottom: 3,
		backgroundColor: 'transparent'
	},
	progressBody: {
		height: 36
	},
	progressContainer: {
		width: width - 64,
		height: 4,
		borderRadius: 4
	}
});

export default ProgressContainer;
