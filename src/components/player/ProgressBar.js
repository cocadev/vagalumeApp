import React, { Component } from 'react';
import { View, Animated } from 'react-native';

class ProgressBar extends Component {
    constructor(props) {
        super(props);

        this.progressValue = new Animated.Value(0);
        this.progressStart = new Animated.Value(0);

        this._progressInterval = null;
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

          this.progressStart.setValue(playingSong.position);
          if (playingSong.duration > 0 && this.props.size > 0) {
              this.progressValue = this.progressStart.interpolate({
                  inputRange: [0, playingSong.duration],
                  outputRange: [0, this.props.size],
              });
          } else {
              this.progressValue = 0;
          }

          this.startProgress();
        }

        if (status !== this.props.status && status !== 2) this.stopProgress();
        if (status !== this.props.status && status === 2) this.startProgress();

        if ((playerInfo.id && this.props.playerInfo.id !== playerInfo.id) || !playingSong.title.id) {
            this.clearProgress();
        }
    }

    clearProgress() {
        this.progressStart.setValue(0);
    }

    startProgress() {
		this.tick();
		this.last = Date.now();
    }

	tick() {
		const { playingSong } = this.props;
		this.stopProgress();
		this._progressInterval = setTimeout(() => {
			this.tick();
			if (this.progressStart._value + 1000 <= this.props.playingSong.duration) {
				const now = Date.now();
				const diff = now - this.last;
				this.progressStart.setValue(this.progressStart._value + diff);
				this.last = now;
			}
		}, 1000);
	}

    stopProgress() {
        clearInterval(this._progressInterval);
    }

    render() {
        return (
            <View style={{ flex: 1 }}>
                <Animated.View
                style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: this.progressValue,
                    backgroundColor: '#CF0',
					borderRadius: 4
                }}
                />
            </View>
        );
    }
}

export default ProgressBar;
