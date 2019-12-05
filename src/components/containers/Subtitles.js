import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

class Subtitles extends Component {

    constructor(props) {
        super(props);

        this.state = { time: null };
        this.progressTimeout = null;

		// Variável de controle de tempo do timeout
		this.last = null;
    }

    componentWillReceiveProps(nextProps) {
		const { playingSong, status, playerInfo } = nextProps;

		if ((playingSong.title.id
          && this.props.playingSong.title.id !== playingSong.title.id)
        || (playingSong.title.id
            && this.props.playingSong.position !== playingSong.position)) {
          this.stopProgress();

		  this.setState({ time: playingSong.position });
          this.startProgress();
        }

		if (this.state.time && status !== this.props.status && status !== 2) this.stopProgress();
        if (this.state.time && status !== this.props.status && status === 2) this.startProgress();

        if (this.state.time !== null && playerInfo.id && (this.props.playerInfo.id !== playerInfo.id || !playingSong.title.id)) {
            this.clearProgress();
        }
    }

    componentWillUnmount() {
        clearTimeout(this.progressTimeout);
    }

    msToTime(duration) {
        if (!duration || duration <= 0) return '';

        let seconds = parseInt((duration/1000)%60);
        let minutes = parseInt((duration/(1000*60))%60);
        let hours = parseInt((duration/(1000*60*60))%60)

        minutes = (minutes < 10) ? `0${minutes}` : minutes;
        seconds = (seconds < 10) ? `0${seconds}` : seconds;
        hours = (hours ? ((hours < 10) ? `0${hours}:` : `${hours}:`) : '');

        return `${hours}${minutes}:${seconds}`;
    }

    clearProgress() {
        this.setState({
            time: null
        });
    }

    startProgress() {
        this.tick();
		this.last = Date.now();
    }

	tick() {
		clearTimeout(this.progressTimeout);
		this.progressTimeout = setTimeout(() => {
			this.tick();
            if (this.state.time <= this.props.playingSong.duration) {
				const now = Date.now();
				const diff = now - this.last;
				this.setState({
					time: this.state.time + diff
				});
				this.last = now;
            } else {
                this.stopProgress();
            }
        }, 1000);
	}

    stopProgress() {
        clearTimeout(this.progressTimeout);
    }

	renderSubtitles() {
		const { playingSong, lyrics, subtitles } = this.props;
		if (playingSong.duration && subtitles && subtitles.length) {
			let text = subtitles[0].text_compressed.find(item => {
				if (item[1] <= (this.state.time / 1000) && item[2] > (this.state.time / 1000)) {
					return true;
				} else {
					return false;
				}
			});

            text = text ? text[0] : '...';

            return (
                <TouchableOpacity onPress={(this.props.showLyrics)}>
                    <Text style={{ color: '#FFF', fontFamily: 'rubik', textAlign: 'center', fontSize: 16 }}>
                        {text}
                    </Text>
                </TouchableOpacity>
            );
		} else if (playingSong.duration && (subtitles && !subtitles.length) && lyrics && lyrics.text && playingSong.title && playingSong.title.id) {
			this.stopProgress();
            return this.renderLyricsButton();
        }
    }

    renderLyricsButton() {
        return (
            <TouchableOpacity onPress={(this.props.showLyrics)}>
                <View style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 6, borderRadius: 20, paddingLeft: 16, paddingRight: 16 }}>
                    <Text selectable={true} selectionColor="#CF0" style={{ fontFamily: 'rubik', fontSize: 14, color: '#FFF' }}>
                        VER LETRA
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    render() {
        return (
            <View style={{
				justifyContent: 'center',
				flexDirection: 'row',
				paddingLeft: 16,
				paddingRight: 16,
				height: 32
			}}>
				<View>
                    {this.renderSubtitles()}
				</View>
            </View>
        );
    }
}

export default Subtitles;
