import { NativeModules, DeviceEventEmitter } from 'react-native';

const mediaObjects = {};

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
}

const Media = function (src, statusCallback, errorCallback) {
    this.id = guid();
    mediaObjects[this.id] = this;
    this.src = src;
    this.statusCallback = statusCallback;
    this.errorCallback = errorCallback;
    this._duration = -1;
    this._position = -1;
    NativeModules.MediaPlayer.create(this.id, this.src);
};

// Media messages
Media.MEDIA_STATE = 1;
Media.MEDIA_DURATION = 2;
Media.MEDIA_POSITION = 3;
Media.MEDIA_ERROR = 9;

// Media states
Media.MEDIA_NONE = 0;
Media.MEDIA_STARTING = 1;
Media.MEDIA_RUNNING = 2;
Media.MEDIA_PAUSED = 3;
Media.MEDIA_STOPPED = 4;
Media.MEDIA_ENDED = 6;
Media.MEDIA_READY = 7;
Media.MEDIA_MSG = ["None", "Starting", "Running", "Paused", "Stopped", "Ended"];

Media.get = function (id) {
    return mediaObjects[id];
};

Media.onStatus = function (id, msgType, value) {
  const media = mediaObjects[id];

  if (media) {
      switch (msgType) {
          case Media.MEDIA_STATE :
              if (value === Media.MEDIA_STOPPED) {
                  value = Media.MEDIA_PAUSED;
              }

              if (media.statusCallback) {
                  media.statusCallback(value);
              }
              break;
          case Media.MEDIA_DURATION :
              media._duration = value;
              break;
          case Media.MEDIA_ERROR :
              if (media.errorCallback) {
                  media.errorCallback(value);
              }
              break;
          case Media.MEDIA_POSITION :
              media._position = Number(value);
              break;
          default :
              if (console.error) {
                  console.error(`Unhandled Media.onStatus :: ${msgType}`);
              }
              break;
      }
  } else if (console.error) {
      console.error(`Received Media.onStatus callback for unknown media :: ${id}`);
  }
};

Media.prototype.play = function () {
    NativeModules.MediaPlayer.startPlayingAudio(this.id, this.src);
};

Media.prototype.stop = function () {
    NativeModules.MediaPlayer.stopPlayingAudio(this.id);
    NativeModules.MediaPlayer.release(this.id);
};

Media.prototype.seekTo = function (milliseconds) {
    NativeModules.MediaPlayer.seekToAudio(this.id, milliseconds);
};

Media.prototype.pause = function () {
    NativeModules.MediaPlayer.pausePlayingAudio(this.id);
};

Media.prototype.getCurrentPosition = function (success) {
    NativeModules.MediaPlayer.getCurrentPositionAudio(this.id, success);
};

Media.prototype.release = function () {
    NativeModules.MediaPlayer.release(this.id);
};

Media.prototype.setVolume = function (volume) {
	// Seta o volume
    NativeModules.MediaPlayer.setVolume(this.id, volume);
};

DeviceEventEmitter.addListener('mediaPlayer.onMessageFromNative', (e) => {
  const msg = JSON.parse(e);
  if (msg.action === 'status') {
      Media.onStatus(msg.status.id, msg.status.msgType, msg.status.value);
  } else {
      throw new Error(`Unknown media action ${msg.action}`);
  }
});

module.exports = Media;
