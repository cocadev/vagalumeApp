package br.com.vagalume.aacplayer;

import android.media.AudioTrack;
import com.spoledge.aacdecoder.MultiPlayer;
import com.spoledge.aacdecoder.PlayerCallback;
import com.spoledge.aacdecoder.AACPlayer;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.LifecycleEventListener;

public class AACPlayerModule extends ReactContextBaseJavaModule implements PlayerCallback, LifecycleEventListener {

  public AudioTrack audioTrack;

  public AACPlayerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    ctx = reactContext;

    reactContext.addLifecycleEventListener(this);
  }

  @Override
  public String getName() {
    return "AACPlayer";
  }

  protected MultiPlayer multiPlayer = null;
  protected Integer status = null;
  protected Boolean mWaitingToPlay;
  protected String streaming;

  protected ReactApplicationContext ctx;

  @ReactMethod
  public void setStream(String url) {
    streaming = url;
  }

  @ReactMethod
  public void stop() {
    if (multiPlayer != null && status == 2) {
        sendEvent("aacPlayer.statusChanged", 3);
        multiPlayer.stop();
        multiPlayer = null;
    }
  }

  @ReactMethod
  public void play() {
      prepareToPlay();
  }

  @ReactMethod
  public void getPosition(Promise promise) {
	  return;
  }

  @ReactMethod
  public void setVolume(float volume) {
	  return;
  }

  @ReactMethod
  public void getStatus(Callback successCallback, Callback errorCallback) {
    if (status != null) {
        successCallback.invoke(status);
    } else {
        errorCallback.invoke(status);
    }
  }

  @ReactMethod
  public void destroy() {
    if (multiPlayer != null) {
        multiPlayer.stop();
        status = null;
        multiPlayer = null;
    }
  }

  private void sendEvent(String eventName, Integer code) {
    try {
        if (code != status) {
            status = code;

            ctx
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, status);
        }
    } catch (Exception e) {
    }
  }

  public void prepareToPlay() {
      if (multiPlayer != null && (status == 2 || status == 1)) {
          multiPlayer.stop();
      }
      multiPlayer = null;
      multiPlayer = new MultiPlayer(this, AACPlayer.DEFAULT_AUDIO_BUFFER_CAPACITY_MS, AACPlayer.DEFAULT_DECODE_BUFFER_CAPACITY_MS);
      multiPlayer.playAsync(streaming);
      sendEvent("aacPlayer.statusChanged", 1);
  }

  @Override
  public void playerStarted() {
      sendEvent("aacPlayer.statusChanged", 2);
  }

  @Override
  public void playerPCMFeedBuffer(boolean isPlaying, int audioBufferSizeMs, int audioBufferCapacityMs) {
      if (!isPlaying) {
          sendEvent("aacPlayer.statusChanged", 2);
      }
  }

  @Override
  public void playerStopped(int perf) {
  }

  @Override
  public void playerException(Throwable t) {
      sendEvent("aacPlayer.statusChanged", 3);
  }

  @Override
  public void playerMetadata(String key, String value) {
  }

  @Override
  public void playerAudioTrackCreated(AudioTrack audioTrack) {
  }

  public void MediaPlayerEnhanced() {
  }

  @Override
  public void onHostResume() {
  }

  @Override
  public void onHostPause() {
  }

  @Override
  public void onHostDestroy() {
    if (multiPlayer != null) {
        multiPlayer.stop();
        multiPlayer = null;
        status = null;
    }
  }
}
