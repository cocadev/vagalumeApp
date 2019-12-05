import React, { Component } from 'react';
import { View, Text } from 'react-native';

class RecorderTimer extends Component {
    constructor(props) {
        super(props);

		const time = props.recordingTS ? (Date.now() - props.recordingTS) : 0
        this.state = { time };

        this._enabled = false;
        this._interval = null;
    }

    componentWillReceiveProps(nextProps) {
        const { recordingTS } = nextProps;

        if (recordingTS && !this._enabled) {
            this._startTimer();
        } else if (!recordingTS && this._enabled) {
            this._stopTimer();
        }
    }

	componentDidMount() {
		const { recordingTS } = this.props;

        if (recordingTS && !this._enabled) {
            this._startTimer();
        }
	}

	componentWillUnmount() {
		this._stopTimer();
	}

    _startTimer() {
        this._stopTimer();
        this._enabled = true;
        this._interval = setInterval(() => {
            const time = Date.now() - this.props.recordingTS;
            this.setState({ time });
        }, 1000);
    }

    _stopTimer() {
        this._enabled = false;
        clearInterval(this._interval);
    }

    _filterTime(totalSeconds) {

		if (totalSeconds === 0) return '00:00';

        totalSeconds = Math.floor(totalSeconds / 1000);

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

    render() {
		const { styles } = this.props;
		const color = (styles && styles.color) ? styles.color : '#E24F27';
		const fontSize = (styles && styles.fontSize) ? styles.fontSize : 12;

        return (
            <View style={{ justifyContent: 'flex-end' }}>
                <Text style={{ color, fontSize, backgroundColor: 'transparent' }}>
                    {this._filterTime(this.state.time)}
                </Text>
            </View>
        )
    }
}

export default RecorderTimer;
