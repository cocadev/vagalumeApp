import { NativeModules, DeviceEventEmitter } from 'react-native';

class ExoPlayer2 {
	constructor(src, onStateChanged, onId3Metadata) {
		this.src = src;
		this.onStateChanged = onStateChanged;
		this.onId3Metadata = onId3Metadata;

		NativeModules.ExoPlayer2.set(this.src);
		this.addListeners();

		this.STATE_STARTING = NativeModules.ExoPlayer2.STATE_STARTING;
		this.STATE_RUNNING = NativeModules.ExoPlayer2.STATE_RUNNING;
		this.STATE_STOPPED = NativeModules.ExoPlayer2.STATE_STOPPED;
		this.STREAM_FAIL = NativeModules.ExoPlayer2.STREAM_FAIL;
		this.INVALID_STREAM = NativeModules.ExoPlayer2.INVALID_STREAM;
		this.TS_FAIL = NativeModules.ExoPlayer2.TS_FAIL;
		this.M3U8_FAIL = NativeModules.ExoPlayer2.M3U8_FAIL;
		this.TS_NOT_FOUND = NativeModules.ExoPlayer2.TS_NOT_FOUND;
		this.AAC_FAIL = NativeModules.ExoPlayer2.AAC_FAIL;
		this.UNKNOWN_HOST = NativeModules.ExoPlayer2.UNKNOWN_HOST;
		this.SOCKET_TIMEOUT = NativeModules.ExoPlayer2.SOCKET_TIMEOUT;
		this.CONNECT_EXCEPTION = NativeModules.ExoPlayer2.CONNECT_EXCEPTION;
	}

	addListeners() {
		this.stateChangeListener = DeviceEventEmitter
		.addListener(NativeModules.ExoPlayer2.ON_STATE_CHANGED, (value) => {
		    this.onStateChanged(value);
		});

		this.id3MetadataListener = DeviceEventEmitter
		.addListener(NativeModules.ExoPlayer2.ON_ID3_METADATA, (value) => {
			/* Convertendo o JSON recebido no metadata */
			try {
				value.extra = JSON.parse(value.extra);
				value.time = JSON.parse(value.time);
				this.onId3Metadata(value);
			} catch(e) {}
		});
	}

	removeListeners() {
		this.stateChangeListener.remove();
		this.id3MetadataListener.remove();
	}

	play() {
		NativeModules.ExoPlayer2.play();
	}

	stop() {
		NativeModules.ExoPlayer2.stop();
	}

	seekTo(ms) {
		NativeModules.ExoPlayer2.seekTo(ms);
	}

	setBuffer(ms) {
		NativeModules.ExoPlayer2.setBuffer(ms);
	}

	release() {
		this.removeListeners();
		NativeModules.ExoPlayer2.release();
	}

	getPosition() {
		return NativeModules.ExoPlayer2.getPosition();
	}

	setVolume(volume) {
		if (volume !== null) NativeModules.ExoPlayer2.setVolume(volume);
	}
}

export default ExoPlayer2;
