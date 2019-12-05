import React, { Component } from 'react';
import { Animated, StyleSheet, Dimensions, View, Text, ScrollView, TouchableWithoutFeedback, TouchableOpacity, Platform, StatusBar, AsyncStorage, Image, Vibration, Alert } from 'react-native';
import { connect } from 'react-redux';
import { initPlayer } from '../../actions';;
import { RecordingManager } from '../containers/StreamRecorder';
import StatusBarHeight from '../containers/StatusBarHeight';
import { STATE_TYPE } from '../containers/Player';
import { PLAYER_TYPES } from '../player/PlayerController';
import RecorderTimer from '../player/RecorderTimer';
import Chromecast from '../../../react-native-chromecast';
import Toast from 'react-native-root-toast';
import Header from './Header';
import LinearGradient from 'react-native-linear-gradient';
import EventManager from '../containers/EventManager';
import Prompt from '../containers/Prompt';
import Icon from '../containers/Icon';
import ImageCache from '../containers/ImageCache';

class RecordingsPage extends Component {
    constructor(props) {
        super(props);

		const { playerType, status, isRecording } = props;

        this.state = {
            recordings: [],
            editMode: false,
            selectedRecordings: [],
            recordingHeight: new Animated.Value(90),
            recordingX: new Animated.Value(0),
			recordingOpacity: new Animated.Value(1),
			showingCurrentRecording: isRecording,
			isReady: false,
			renameItem: null
        };

		this.isPulsing = false;
        this._selectRecordingOpacity = new Animated.Value(0);
        this._handleBackButton = this.handleBackButton.bind(this);
    }

	componentWillReceiveProps(nextProps) {
		const { isRecording } = nextProps;

		// Controle das váriáveis de gravação
		if (isRecording && !this.isPulsing) {
            this.startPulseRecording();
        } else if (!isRecording && this.isPulsing) {
            this.stopPulseRecording();
        }

		if (isRecording && !this.state.showingCurrentRecording) {
			this.setState({ showingCurrentRecording: true });
		} else if (this.props.isRecording && !isRecording) {
			setTimeout(() => {
				this.getRecordings();
			}, 1500);
		}
	}

    componentDidMount() {
		const { isRecording } = this.props;
		EventManager.trackView({ pageName: 'Recordings' });

		// Controle das váriáveis de gravação
		if (isRecording && !this.isPulsing) {
            this.startPulseRecording();
        } else if (!isRecording && this.isPulsing) {
            this.stopPulseRecording();
        }
    }

    componentWillMount() {
        this.getRecordings();
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

    getRecordings() {
		const { allStations, isRecording } = this.props;
        RecordingManager.listRecordingsComplete(allStations)
        .then(recordings => {
            if (recordings) {
                this.setState({ recordings, showingCurrentRecording: isRecording, isReady: true });
            } else {
                this.setState({ recordings: null, showingCurrentRecording: isRecording, isReady: true });
            }
        })
        .catch(err => {
            this.setState({ recordings: null, showingCurrentRecording: isRecording, isReady: true });
        });
    }

    handleBackButton() {
		const { editMode } = this.state;
        if (editMode) {
            const selectedRecordings = [];
            this.setState({ selectedRecordings, editMode: false });
            this.disableEdit();
        } else {
            this.navigatorPop();
        }

        return true;
    }

    navigatorPop() {
        this.props.navigation.goBack();
        return true;
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
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
                <Text style={{ fontFamily: 'rubik', color: '#AAA', fontSize: 14 }}>
                    {formattedDay}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
					<Icon name="clock" size={18} color="#AAA" />
                    <Text style={{ fontFamily: 'rubik', color: '#AAA', fontSize: 14 }}>
                        {formattedHour}
                    </Text>
                </View>
            </View>
        );
    }

    filterTime(totalSeconds) {
        totalSeconds = Math.floor(totalSeconds);

        let hours = Math.floor(totalSeconds / 3600);
        totalSeconds %= 3600;
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;

        if (minutes < 10) {
            minutes = `0${minutes}`
        }

        if (seconds < 10) {
            seconds = `0${seconds}`
        }

        let time = `${minutes}:${seconds}`;

        if (hours > 0) {
            if (hours < 10) {
                hours = `0${hours}`
            }
            time = `${hours}:${time}`;
        }

        return time;
    }

    activeItem(recordingID) {
		const { recordings, editMode } = this.state;
        if (!editMode) {
            this.selectRecording(recordingID);
            this.enableEdit();
            Vibration.vibrate([0, 50]);
        }
    }

    enableEdit() {
		this.setState({ editMode: true });

        Animated.sequence([
            Animated.timing(
                this.state.recordingX,
                {
                    toValue: 50,
                    duration: 200
                }
            )
        ]).start();

        Animated.timing(this._selectRecordingOpacity, {
            toValue: 1,
            duration: 100
        }).start();
    }

    disableEdit() {
        Animated.sequence([
            Animated.timing(
                this.state.recordingX,
                {
                    toValue: 0,
                    duration: 200
                }
            )
        ]).start();

        Animated.timing(this._selectRecordingOpacity, {
            toValue: 0,
            duration: 100
        }).start();
    }

    selectRecording(id) {
        const { selectedRecordings } = this.state;
        selectedRecordings.push(id);
        this.setState({ selectedRecordings });
    }

    deselectRecording(id) {
        const { selectedRecordings } = this.state;
        const index = selectedRecordings.findIndex(recording => recording === id);
        let editMode = true;
        if (index > -1) selectedRecordings.splice(index, 1);

        if (selectedRecordings && selectedRecordings instanceof Array && !selectedRecordings.length) {
            editMode = false;
            this.disableEdit();
        }

        this.setState({ selectedRecordings, editMode });
    }

    pressRecording(recordingID) {
        const { cast } = this.props;

        const castSessionResumed = cast.session === 'onSessionResumed';
        const castSessionStarted = cast.session === 'onSessionStarted';
        const castSessionConnected = cast.session === 'CONNECTED';

        // Realiza a verificação de conexão com o chromecast, impedindo a reprodução da gravação.
		if (castSessionResumed || castSessionStarted || castSessionConnected) {
            Toast.show('Desculpe! Ainda não é possível executar uma gravação no Chromecast. Por favor, desconecte-se do Chromecast para reproduzir a gravação.');
            return;
        }

		// Caso esteja no modo de edição
		if (this.state.editMode) {
			const isSelected = this.state.selectedRecordings.findIndex(id => id === recordingID);
			if (isSelected === -1) {
				this.selectRecording(recordingID);
			} else {
				this.deselectRecording(recordingID);
			}
		} else {
			const { recordingFile, status, player } = this.props;
			const recording = this.state.recordings.find(obj => obj.id === recordingID);

			// Caso esteja tocando o player com um arquivo de gravação e seja o mesmo selecionado
			if (recordingFile && player && recording.id === recordingFile.id) {
				const { instance } = player;
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
    }

    deleteRecordings() {
        Alert.alert(
            'Excluir gravações?',
            'Tem certeza que deseja excluir as gravações selecionadas?',
            [
                {
                    text: 'Sim',
                    onPress: () => {
                        const newRecordings = [];
                        let recordingLive;
                        const currentRecording = this.state.recordings.find((obj, key) => key === this.state.indexPlayingRecording);

                        // Faz a remoção dos recordings selecionados
                        const paths = this.state.selectedRecordings.map(id => {
                            return {
                                id,
                                path: this.state.recordings.find(obj => obj.id === id).path
                            };
                        });

                        // Deleta a lista de recordings selecionados
                        RecordingManager.deleteRecordings(paths);

                        for (let i = 0; i < this.state.recordings.length; i++) {
                            const recording = this.state.recordings[i];
                            const isSelected = this.state.selectedRecordings.findIndex(id => id === recording.id);

                            // Puxa o novo array se não existirem itens selecionados
                            if (isSelected === -1) {
                                newRecordings.push(recording);
                            }

                            // Verifica se o ultimo recording era o que estava tocando
                            if (isSelected > -1 && this.props.recordingFile && recording.id == this.props.recordingFile.id){
                                recordingLive = recording;
                            }
                        }

						if (recordingLive) {
							this.props.initPlayer({ playerInfo: recordingLive.station, playerType: PLAYER_TYPES.STREAM, autoplay: true });
						}

                        // Seta o novo estado dos recordings
                        this.setState({
                            editMode: false,
                            selectedRecordings: [],
                            recordings: newRecordings
                        });

                        this.disableEdit();

                        Toast.show('Gravações excluídas com sucesso');
                    }
                },
                {
                    text: 'Não',
                    style: 'cancel',
                    onPress: () => {
                        this.handleBackButton();
                    }
                },
                { cancelable: false }
            ]
        );
    }

	renderImage(recording, key) {
		if (recording && recording.station && recording.station.img && recording.station.img.default) {
			return (
				<ImageCache source={{ uri: recording.station.img.default }}
				style={{ width: 60, height: 60, borderRadius: 30, borderColor: this.state.indexPlayingRecording === key ? '#CF0' : '#333', borderWidth: 1 }}
				/>
			);
		} else {
			return (
				<View />
			);
		}
	}

	renderPlayIcon(recording) {
		const { recordingFile, status, player } = this.props;
		let icon;

		if (recordingFile && player) {
			const isRunning = recording.id === recordingFile.id;
			const backgroundColor = isRunning ? 'rgba(0, 0, 0, 0.5)' : 'transparent';

			if (isRunning && (status === STATE_TYPE.RUNNING || status === STATE_TYPE.STARTING)) {
				icon = (
					<TouchableWithoutFeedback
						onPress={() => {
							player.stop();
						}}>
						<Icon name="pause" size={30} color="#CF0" />
					</TouchableWithoutFeedback>
				);
			} else if (isRunning && status === STATE_TYPE.STOPPED) {
				icon = (
					<TouchableWithoutFeedback
						onPress={() => {
							player.play();
						}}>
						<Icon name="play" size={30} color="#CF0" />
					</TouchableWithoutFeedback>
				);
			}

			return (
				<View style={{ backgroundColor, borderRadius: 35, position: 'absolute', left: 1, right: 1, top: 1, bottom: 1, justifyContent: 'center', alignItems: 'center' }}>
					{icon}
				</View>
			);
		}
	}

	renderRecIcon() {
		const { isRecording } = this.props;
		if (isRecording) {
			return (
				<View style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 35, position: 'absolute', left: 1, right: 1, top: 1, bottom: 1, justifyContent: 'center', alignItems: 'center' }}>
					<Icon name="rec_off" size={50} color="#FFF" />
				</View>
			);
		}
	}

	renderRecordingName(recording) {
		if (recording && recording.station && recording.station.name) {
			const name = recording.name ? recording.name : recording.station.name;
			return (
				<Text style={{ fontFamily: 'rubik-medium', color: '#FFF', fontSize: 14 }}>
					{name}
				</Text>
			);
		} else {
			return (
				<View />
			);
		}
	}

    renderRecordings() {
        const { recordings, showingCurrentRecording } = this.state;
        const { width, height } = Dimensions.get('window');
        if (recordings && recordings instanceof Array && recordings.length) {
                return recordings.map((recording, key) => {
                    const isSelected = this.state.selectedRecordings.findIndex(id => id === recording.id);

                    const hasStation = recording && recording.hasOwnProperty('station');
                    const isComplete = recording && recording.hasOwnProperty('isComplete') && recording.isComplete;
                    const hasSeekTo = recording && recording.hasOwnProperty('seekTo');
                    const hasTs = recording && recording.hasOwnProperty('ts');
                    const hasTime = recording && recording.hasOwnProperty('time');


                    if (hasStation && isComplete && hasSeekTo && hasTs && hasTime) {
                        return (
                            <View key={key}>
                                <TouchableWithoutFeedback
									onPress={this.pressRecording.bind(this, recording.id)}
									onLongPress={this.activeItem.bind(this, recording.id)}
									accessible={true}
									accessibilityComponentType={'button'}
									accessibilityTraits={'button'}
									>
                                    <View style={{ backgroundColor: (isSelected > -1 || this.state.indexPlayingRecording === key)  ? 'rgba(0, 0, 0, 0.1)' : '#2d2d2d', paddingLeft: 16, paddingRight: 16 }}>

                                        <Animated.View style={{opacity: this._selectRecordingOpacity, height: 20, width: 20, position: 'absolute', top: 35, left: 25, zIndex: 5 }}>
                                            {isSelected == -1 && this.state.editMode && <View style={{ height: 20, width: 20, backgroundColor: 'transparent', borderColor: '#aaa', borderWidth: 1, borderRadius: 20 }}>
                                            </View>}
                                            {isSelected > -1 && <View style={{ borderRadius: 20, position: 'absolute'  }}>
                                                <Image style={{ width: 20, height: 20 }} source={require('../../img/ic_check_verde.png')} />
                                            </View>}
                                        </Animated.View>

                                        <View style={{borderTopColor: '#3d3d3d', borderTopWidth: key === 0 ? 0 : 1}}></View>

                                        <Animated.View style={{ transform: [{ translateX: this.state.recordingX }], height: isSelected > -1 ? this.state.recordingHeight : 90, alignItems: 'center', flexDirection: 'row'}}>
                                            <View style={{ width: 60, height: 60, borderRadius: 30 }}>
                                                {this.renderImage(recording, key)}
                                                {this.renderPlayIcon(recording)}
                                            </View>
                                            <View style={{ marginLeft: 16 }}>
                                                {this.renderRecordingName(recording)}
												<View style={{ flexDirection: 'row', alignItems: 'center' }}>
	                                                <Text style={{ fontFamily: 'rubik', color: '#AAA', fontSize: 14, marginRight: 3 }}>
	                                                    Duração:
	                                                </Text>
													<Text style={{ color: '#AAA', fontSize: 14 }}>
														{this.filterTime(recording.time)}
													</Text>
												</View>
                                                {this.filterDate(recording.ts)}
                                            </View>
                                        </Animated.View>
                                    </View>
                                </TouchableWithoutFeedback>
                            </View>
                        );
                    }
                });
        } else if (showingCurrentRecording) {
			return( <View /> );
        }
    }

	renderCurrentRecording() {
		const { playerInfo, isRecording, status } = this.props;
		const { showingCurrentRecording } = this.state;

		if (showingCurrentRecording && playerInfo.id) {
			return (
				<View style={{ backgroundColor: '#2d2d2d', paddingLeft: 16, paddingRight: 16 }} accessible={true}>
					<View style={{ height: 90, alignItems: 'center', flexDirection: 'row'}}>
						<View style={{ width: 60, height: 60, borderRadius: 30 }}>
							{(playerInfo.img && playerInfo.img.default) && <ImageCache source={{ uri: playerInfo.img.default }} style={{ width: 60, height: 60, borderRadius: 30, borderColor: '#333', borderWidth: 1 }} />}
							{this.renderRecIcon()}
						</View>
						<View style={{ marginLeft: 16 }}>
							<Text style={{ fontFamily: 'rubik-medium', color: '#FFF', fontSize: 14 }}>
								{playerInfo.name}
							</Text>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Text style={{ fontFamily: 'rubik', color: '#AAA', fontSize: 14, marginRight: 3 }}>
									Duração:
								</Text>
								<RecorderTimer styles={{ fontFamily: 'rubik', color: '#AAA', fontSize: 14 }} recordingTS={isRecording} />
							</View>
							{isRecording ? (
								<View style={{ flexDirection: 'row', alignItems: 'center' }}>
									<Animated.View style={{ opacity: this.state.recordingOpacity, height: 10, width: 10, backgroundColor: '#E24F27', borderRadius: 5, marginRight: 5 }} />
									<Text style={{ fontFamily: 'rubik', color: '#AAA', fontSize: 12, marginTop: 2 }}>
										GRAVANDO
									</Text>
								</View>
							) : (
								this.filterDate(Date.now())
							)}
						</View>
					</View>
					<View style={{borderBottomColor: '#3d3d3d', borderBottomWidth: 1 }}></View>
				</View>
			);
		}
	}


	renderEmptyState() {
		const { width, height } = Dimensions.get('window');

		return (
			<View style={[StyleSheet.absoluteFill, { zIndex: 1, paddingTop: (StatusBarHeight + 56) }]}>
				<View style={{ position: 'absolute', top: 0 }}>
					<Image
						source={require('../../img/woman-listen-music.jpg')}
						style={{ height: height / 1.7, width, opacity: 0.3 }} />

					<LinearGradient
						colors={['rgba(45, 45, 45, 0)', 'rgba(45, 45, 45, 0.5)', 'rgba(45, 45, 45, 1)']}
						style={styles.bgFade} />
				</View>

				<View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <View style={{ marginBottom: 40, justifyContent: 'center', alignItems: 'center' }}>
						<View style={{ height: 83, width: 83 }}>
							<Icon color="#a5a7aa" size={80} name="vagalume_rec" style={{ position: 'absolute' }} />
						</View>

						<View style={{ justifyContent: 'center', alignItems: 'center' }}>
							<Text style={{ backgroundColor: 'transparent', color: '#FFF', fontSize: 18, fontFamily: 'rubik-medium' }}>
							<Text style={{ backgroundColor: 'transparent', color: '#CF0'}}>Grave</Text> as estações</Text>
							<Text style={{ backgroundColor: 'transparent', color: '#FFF', fontSize: 18, fontFamily: 'rubik-medium' }}>
							para ouvir <Text style={{ backgroundColor: 'transparent', color: '#CF0'}}>offline</Text> sem</Text>
							<Text style={{ backgroundColor: 'transparent', color: '#FFF', fontSize: 18, fontFamily: 'rubik-medium' }}>
							gastar sua Internet</Text>
						</View>
					</View>
				</View>
				<Image
					source={require('../../img/arrow.png')}
					style={{ width: 400 * 0.4, height: height * 0.2, right: 10, bottom: 20, position: 'absolute' }}
					resizeMode='contain' />
			</View>
		);
	}

	renameRecording() {
		if (this.state.selectedRecordings && this.state.selectedRecordings[0]) {
			const recording = this.state.recordings.find((obj) => obj.id === this.state.selectedRecordings[0]);
			this.setState({ renameItem: recording });
		}
	}

	submitRenameRecording(name) {
		RecordingManager.renameRecording(this.state.renameItem, name)
		.then(() => {
			const { recordings } = this.state;
			const recordingIndex = recordings.findIndex(obj => obj.id === this.state.renameItem.id);

			if (recordingIndex != -1) {
				recordings[recordingIndex].name = name;
			}

			this.setState({
				renameItem: null,
				editMode: false,
				selectedRecordings: [],
				recordings
			});
			this.disableEdit();

			Toast.show('Gravação renomeada com sucesso');
		})
		.catch(() => {
			this.setState({
				renameItem: null,
				editMode: false,
				selectedRecordings: []
			});
			this.disableEdit();

			Toast.show('Ocorreu um problema ao renomear a gravação');
		});
	}

    render() {
		const { editMode, recordings, selectedRecordings, showingCurrentRecording, isReady } = this.state;

		const hasRecording = (recordings && recordings.length) ? true : false;
		const emptyState = isReady && (!showingCurrentRecording && !hasRecording) ? this.renderEmptyState() : null;

        return (
            <View style={{ backgroundColor: '#2d2d2d', flex: 1 }}>
				<Prompt
				title="Renomear gravação"
				placeholder="Digite o nome da gravação"
				defaultValue={this.state.renameItem ? (this.state.renameItem.name || this.state.renameItem.station.name) : ""}
				visible={this.state.renameItem !== null}
				submitText="Renomear"
				cancelText="Cencelar"
				onCancel={() => this.setState({ renameItem: null })}
				onSubmit={this.submitRenameRecording.bind(this)}
				/>
				<Header
				editMode={editMode}
				recordings={recordings}
				selectedRecordings={selectedRecordings}
				deleteRecordings={this.deleteRecordings.bind(this)}
				renameRecording={this.renameRecording.bind(this)}
				handleBackButton={this._handleBackButton}
				enableEdit={this.enableEdit.bind(this)}
				disableEdit={() => {
					this.setState({ editMode: false, selectedRecordings: [] });
					this.disableEdit();
				}}
				/>
				{emptyState}
                <ScrollView>
                    <View style={{backgroundColor: '#2d2d2d'}}>
						{this.renderCurrentRecording()}
                        {this.renderRecordings()}
                    </View>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
	placeholderText: {
		color: '#FFF',
		fontSize: 18,
		textAlign: 'center',
		fontFamily: 'rubik',
		backgroundColor: 'transparent'
	},
	bgFade: {
		height: 80,
		backgroundColor: 'transparent',
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0
	},
})

const mapStateToProps = ({ player, stations }) => {
    const { allStations } = stations;
    const { playerType, playerInfo, status, cast, recordingFile, instance, isRecording } = player;
    return { playerInfo, allStations, playerType, status, recordingFile, player: instance, cast, isRecording };
};

export default connect(mapStateToProps, { initPlayer })(RecordingsPage);
