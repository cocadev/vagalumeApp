import { NativeModules, DeviceEventEmitter } from 'react-native';

const that = false;
const MediaControlsIOS = function(onMediaControlsEvent) {
    this.onMediaControlsEvent = onMediaControlsEvent;
    NativeModules.MediaControlsManager.init('');
    that = this;
};

const MEDIA_CONTROLS_EVENTS = {
    PLAY: 1,
    PAUSE: 2,
    NEXT: 3,
    PREV: 4,
    TOGGLE: 5
}

/**
* Update meta notification
*/
MediaControlsIOS.prototype.updateMetas = function(obj) {
    NativeModules.MediaControlsManager.updateMetas(obj);
}

/*
* Events
*/

DeviceEventEmitter.addListener('mediacontrols.togglePlayPause', (value) => {
    that.onMediaControlsEvent(MEDIA_CONTROLS_EVENTS.TOGGLE);
});
DeviceEventEmitter.addListener('mediacontrols.play', (value) => {
    that.onMediaControlsEvent(MEDIA_CONTROLS_EVENTS.PLAY);
});
DeviceEventEmitter.addListener('mediacontrols.pause', (value) => {
    that.onMediaControlsEvent(MEDIA_CONTROLS_EVENTS.PAUSE);
});
DeviceEventEmitter.addListener('mediacontrols.onPrevCommand', (value) => {
    that.onMediaControlsEvent(MEDIA_CONTROLS_EVENTS.PREV);
});
DeviceEventEmitter.addListener('mediacontrols.onNextCommand', (value) => {
    that.onMediaControlsEvent(MEDIA_CONTROLS_EVENTS.NEXT);
});

module.exports = MediaControlsIOS;
