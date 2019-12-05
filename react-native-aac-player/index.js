import { NativeModules, DeviceEventEmitter } from 'react-native';

class AACPlayer {
    constructor(src, onStateChanged) {
        this.src = src;
        this.onStateChanged = onStateChanged;
        this.emitter = null;

        NativeModules.AACPlayer.setStream(this.src);

        this.emitter = DeviceEventEmitter.addListener('aacPlayer.statusChanged', (value) => {
            this.onStateChanged(value);
        });
    }

	/**
	 * Get position.
	 */
	getPosition() {
	  	try {
	    	return NativeModules.AACPlayer.getPosition();
		} catch(error) {return 0;}
	}

	/**
	 * Volume Controller.
	 */
	setVolume (volume) {
	  	try {
	      	NativeModules.AACPlayer.setVolume(volume);
	  	} catch(error) {
	      	return;
	  	}
	}

    play() {
        NativeModules.AACPlayer.play();
    }

    stop() {
        NativeModules.AACPlayer.stop();
    }

    release() {
        this.emitter.remove();
        NativeModules.AACPlayer.destroy();
    }
}

module.exports = AACPlayer;
