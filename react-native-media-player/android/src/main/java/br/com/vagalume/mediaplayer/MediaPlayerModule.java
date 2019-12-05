package br.com.vagalume.mediaplayer;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.LifecycleEventListener;
import android.app.Activity;

import android.content.Context;
import android.media.AudioManager;
import android.media.AudioManager.OnAudioFocusChangeListener;
import android.net.Uri;

import java.util.ArrayList;

import java.util.HashMap;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.util.Log;

public class MediaPlayerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

  public MediaPlayerModule(ReactApplicationContext reactContext) {
      super(reactContext);

      reactContext.addLifecycleEventListener(this);

      this.players = new HashMap<String, AudioPlayer>();
      this.pausedForPhone = new ArrayList<AudioPlayer>();
      this.pausedForFocus = new ArrayList<AudioPlayer>();

      ctx = reactContext;
  }

  @Override
  public String getName() {
    return "MediaPlayer";
  }

  public static String TAG = "AudioHandler";
  HashMap<String, AudioPlayer> players;  // Audio player object
  ArrayList<AudioPlayer> pausedForPhone; // Audio players that were paused when phone call came in
  ArrayList<AudioPlayer> pausedForFocus; // Audio players that were paused when focus was lost
  private int origVolumeStream = -1;

  protected ReactApplicationContext ctx;

  @ReactMethod
  public void startPlayingAudio(String id, String target) {
      String fileUriStr;

      try {
          Uri targetUri = Uri.parse(target);
          fileUriStr = targetUri.toString();
      } catch (IllegalArgumentException e) {
          fileUriStr = target;
      }

      if(fileUriStr == null) {
          return;
      }else {
          try {
              this.startPlayingAudioPlayer(id, FileHelper.stripFileProtocol(fileUriStr));
          }catch(Exception e)   {
              e.printStackTrace();
              return;
          }
      }
  }

  @ReactMethod
  public void seekToAudio(String id, Integer milliseconds) {
      this.seekToAudioMedia(id, milliseconds);
  }

  @ReactMethod
  public void pausePlayingAudio(String id) {
      this.pausePlayingAudioPlayer(id);
  }

  @ReactMethod
  public void stopPlayingAudio(String id) {
      this.stopPlayingAudioPlayer(id);
  }

  @ReactMethod
  public void setVolume(String id, Float volume) {
      try {
		//   Log.e("VOLUME SETADO ", ""+ volume);
          this.setVolumePlayer(id, volume);
      } catch (NumberFormatException nfe) {
          //no-op
      }
  }

  @ReactMethod
  public void getCurrentPositionAudio(String id, Callback callbackContext) {
      float f = this.getCurrentPositionAudio(id);
      callbackContext.invoke(f);
  }

  @ReactMethod
  public void create(String id, String src) {
      src = FileHelper.stripFileProtocol(src);
      getOrCreatePlayer(id, src);
  }

  @ReactMethod
  public void release(String id) {
      boolean b = this.releasePlayer(id);
  }

  public void onDestroy() {
      if (!players.isEmpty()) {
          onLastPlayerReleased();
      }

      for (AudioPlayer audio : this.players.values()) {
          audio.destroy();
      }

      this.players.clear();
  }

  private AudioPlayer getOrCreatePlayer(String id, String file) {
      AudioPlayer ret = players.get(id);
      if (ret == null) {
          if (players.isEmpty()) {
              onFirstPlayerCreated();
          }
          ret = new AudioPlayer(this, id, file);
          players.put(id, ret);
      }
      return ret;
  }

  private boolean releasePlayer(String id) {
      AudioPlayer audio = players.remove(id);
      if (audio == null) {
          return false;
      }
      if (players.isEmpty()) {
          onLastPlayerReleased();
      }
      audio.destroy();
      return true;
  }

  public void startPlayingAudioPlayer(String id, String file) {
      AudioPlayer audio = getOrCreatePlayer(id, file);
      try{
          audio.startPlaying(file);
          getAudioFocus();
      }catch(Exception e){
          e.printStackTrace();
      }
  }

  public void seekToAudioMedia(String id, int milliseconds) {
      AudioPlayer audio = this.players.get(id);

    if (audio != null) {
        audio.seekToPlaying(milliseconds);
    }
  }

  public void pausePlayingAudioPlayer(String id) {
      AudioPlayer audio = this.players.get(id);

    if (audio != null) {
        audio.pausePlaying();
    }
  }

  public void stopPlayingAudioPlayer(String id) {
      AudioPlayer audio = this.players.get(id);
    if (audio != null) {
        audio.stopPlaying();
    }
  }

  public float getCurrentPositionAudio(String id) {
      AudioPlayer audio = this.players.get(id);

    if (audio != null) {
        return (audio.getCurrentPosition() / 1000.0f);
    }
    return -1;
  }

  @SuppressWarnings("deprecation")
  public void setAudioOutputDevice(int output) {
      String TAG1 = "AudioHandler.setAudioOutputDevice(): Error : ";
      AudioManager audiMgr = (AudioManager) getCurrentActivity().getSystemService(Context.AUDIO_SERVICE);

    if (output == 2) {
        audiMgr.setRouting(AudioManager.MODE_NORMAL, AudioManager.ROUTE_SPEAKER, AudioManager.ROUTE_ALL);
    }
    else if (output == 1) {
        audiMgr.setRouting(AudioManager.MODE_NORMAL, AudioManager.ROUTE_EARPIECE, AudioManager.ROUTE_ALL);
    }
    else {
        //Log.e(TAG1," Unknown output device");
    }
  }

  public void pauseAllLostFocus() {

      for (AudioPlayer audio : this.players.values()) {
          if (audio.getState() == AudioPlayer.STATE.MEDIA_RUNNING.ordinal()) {
              this.pausedForFocus.add(audio);
              audio.pausePlaying();
          }
      }
  }

  public void resumeAllGainedFocus() {

      try{
          for (AudioPlayer audio : this.pausedForFocus) {
              audio.startPlaying(null);
          }
          this.pausedForFocus.clear();
      }
      catch(Exception e){
          e.printStackTrace();
      }
  }

  private OnAudioFocusChangeListener focusChangeListener = new OnAudioFocusChangeListener() {
    public void onAudioFocusChange(int focusChange) {

        switch (focusChange) {
            case (AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) :
            case (AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) :
            case (AudioManager.AUDIOFOCUS_LOSS) :
            pauseAllLostFocus();
            break;
            case (AudioManager.AUDIOFOCUS_GAIN):
            resumeAllGainedFocus();
            break;
            default:
            break;
        }
    }
  };

  private void sendEvent(JSONObject actionData) {

      try {
          ctx
          .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("mediaPlayer.onMessageFromNative", actionData.toString());
      }
      catch (Exception e) {
      }
  }

  void sendEventMessage(String action, JSONObject actionData) {
      JSONObject message = new JSONObject();

      try {
          message.put("action", action);

          if (actionData != null) {
              message.put(action, actionData);
          }
      }
      catch (JSONException e) {
          //Log.e(TAG, "Failed to create event message", e);
      }

      sendEvent(message);
  }

  public void getAudioFocus() {
      String TAG2 = "AudioHandler.getAudioFocus(): Error : ";
      Activity activity = getCurrentActivity();

      try{
          if(activity == null){return;}
          AudioManager am = (AudioManager) getCurrentActivity().getSystemService(Context.AUDIO_SERVICE);
          //int result = am.requestAudioFocus(focusChangeListener,
          //AudioManager.STREAM_MUSIC,
          //AudioManager.AUDIOFOCUS_GAIN);

          //if (result != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
              //Log.e(TAG2,result + " instead of " + AudioManager.AUDIOFOCUS_REQUEST_GRANTED);
          //}
      }
      catch(Exception e){
          e.printStackTrace();
          return;}
  }

  @SuppressWarnings("deprecation")
  public int getAudioOutputDevice() {
    AudioManager audiMgr = (AudioManager) getCurrentActivity().getSystemService(Context.AUDIO_SERVICE);

    if (audiMgr.getRouting(AudioManager.MODE_NORMAL) == AudioManager.ROUTE_EARPIECE) {
        return 1;
    }
    else if (audiMgr.getRouting(AudioManager.MODE_NORMAL) == AudioManager.ROUTE_SPEAKER) {
        return 2;
    }
    else {
        return -1;
    }
  }

  public void setVolumePlayer(String id, float volume) {
    String TAG3 = "AudioHandler.setVolume(): Error : ";
    AudioPlayer audio = this.players.get(id);

    if (audio != null) {
        audio.setVolume(volume);
    } else {
        Log.e(TAG3,"Erro ao setar o volume " + id);
    }
  }

  private void onFirstPlayerCreated() {
      Activity activity = getCurrentActivity();

      if (activity != null) {
          origVolumeStream = getCurrentActivity().getVolumeControlStream();
          getCurrentActivity().setVolumeControlStream(AudioManager.STREAM_MUSIC);
      }
  }

  private void onLastPlayerReleased() {

      if (origVolumeStream != -1) {
          getCurrentActivity().setVolumeControlStream(origVolumeStream);
          origVolumeStream = -1;
      }
  }

  @Override
  public void onHostResume() {
  }

  @Override
  public void onHostPause() {
  }

  @Override
  public void onHostDestroy() {
      onDestroy();
  }
}
