import { NativeModules, DeviceEventEmitter } from 'react-native';

const that = false;
const AVPlayer = function(src, onStateChanged, onDelay, onError, onId3Metadata) {
    this.src = src;
    this.onStateChanged = onStateChanged;
    this.onDelay = onDelay;
    this.onError = onError;
	this.onId3Metadata = onId3Metadata;
    that = this;
};

/**
* Start or resume playing audio file.
*/
AVPlayer.prototype.play = function() {
    if(this.src !== undefined){
        NativeModules.AVPlayerManager.startPlayingAudio(this.src);
    }
};

/**
* Start or resume playing audio file.
*/
AVPlayer.prototype.playOffline = function() {
    NativeModules.AVPlayerManager.startPlayingAudioFile(this.src);
};


/**
* Seek to
*/
AVPlayer.prototype.seekTo = function(time) {
    NativeModules.AVPlayerManager.seekTo(time);
};

/**
* Set buffer
*/
AVPlayer.prototype.setBuffer = function(time) {
	console.log('a', time);
    NativeModules.AVPlayerManager.putBuffer(time);
};

/**
* Stop playing audio file.
*/
AVPlayer.prototype.stop = function() {
    NativeModules.AVPlayerManager.stopPlayingAudio('');
};

/**
* Destroy player.
*/
AVPlayer.prototype.release = function() {
    NativeModules.AVPlayerManager.release('');
};

/**
* Update meta notification
*/
AVPlayer.prototype.updateMetas = function(obj) {
    NativeModules.AVPlayerManager.updateMetas(obj);
}

/**
* Get position
*/
AVPlayer.prototype.getPosition = function() {
    return NativeModules.AVPlayerManager.getPosition();
}

/*
* Events
*/
DeviceEventEmitter.addListener('avplayer.onId3Metadata', (value) => {
	try {
		value.metadata.extra = JSON.parse(value.metadata.extra);
		value.metadata.time = JSON.parse(value.metadata.time);
		that.onId3Metadata(value.metadata);

	} catch (e) {
		// Nao envia o callback para o front
	}
});
DeviceEventEmitter.addListener('avplayer.onStateChanged', (value) => {
    that.onStateChanged(value.status);
});
DeviceEventEmitter.addListener('avplayer.onDelay', (value) => {
    that.onDelay(value.delay);
});
DeviceEventEmitter.addListener('avplayer.onError', (value) => {
    that.onError(value.status);
});

module.exports = AVPlayer;
