import React, { Component } from 'react';
import { View, Text } from 'react-native';

class Timer extends Component {

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
        clearInterval(this.progressTimeout);
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
		clearInterval(this.progressTimeout);
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
        clearInterval(this.progressTimeout);
    }

    render() {
        return (
            <View pointerEvents="none" style={{ left: 0, right: 0, bottom: 3, position: 'absolute', height: 26, justifyContent: 'space-between', flexDirection: 'row' }}>
                <View>
                    <Text style={{ backgroundColor: 'transparent', color: this.props.playingSong.duration != null ? '#FFF' : 'rgba(255, 255, 255, 0.4)', fontSize: 12 }}>
                    {this.props.playingSong.duration != null ? this.msToTime(this.state.time) : '00:00'}
                    </Text>
                </View>
                <View>
                    <Text style={{ backgroundColor: 'transparent', color: this.state.time !== null ? '#FFF' : 'rgba(255, 255, 255, 0.4)', fontSize: this.state.time !== null ? 12 : 20, marginTop: this.state.time !== null ? 0 : -8 }}>
                        {this.state.time !== null ? this.msToTime(this.props.playingSong.duration) : '∞'}
                    </Text>
                </View>
            </View>
        );
    }
}

export default Timer;
