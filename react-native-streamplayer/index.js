import { NativeModules, DeviceEventEmitter } from 'react-native';

const that = false;
const StreamPlayer = function(src, onStateChanged, onError) {
    this.src = src;
    this.onStateChanged = onStateChanged;
    this.onError = onError;
    that = this;
};

const STATE_TYPE = {
    STARTING: 1,
    RUNNING: 2,
    STOPPED: 3,
    ERROR: 4
}

/**
* Start or resume playing audio file.
*/
StreamPlayer.prototype.play = function() {
    NativeModules.ReactNativeAudioStreaming.play(this.src, {});
};

/**
* Seek to
*/
StreamPlayer.prototype.seekTo = function(time) {
};

/**
* Stop playing audio file.
*/
StreamPlayer.prototype.stop = function() {
    NativeModules.ReactNativeAudioStreaming.stop();
};

/**
* Destroy player.
*/
StreamPlayer.prototype.release = function() {
    NativeModules.ReactNativeAudioStreaming.stop();
};

/*
* Events
*/
DeviceEventEmitter.addListener('AudioBridgeEvent', (value) => {
    if (value && value.status) {
        switch(value.status) {
            case 'BUFFERING':
                that.onStateChanged && that.onStateChanged(STATE_TYPE.STARTING);
            break;
            case 'PLAYING':
                that.onStateChanged && that.onStateChanged(STATE_TYPE.RUNNING);
            break;
            case 'STOPPED':
                that.onStateChanged && that.onStateChanged(STATE_TYPE.STOPPED);
            break;
            case 'ERROR':
                that.onStateChanged &&that.onStateChanged(STATE_TYPE.ERROR);
            break;
        }
    }
});

module.exports = StreamPlayer;
