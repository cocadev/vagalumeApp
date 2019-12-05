package br.com.vagalume.mediaplayer;

import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.MediaPlayer.OnCompletionListener;
import android.media.MediaPlayer.OnErrorListener;
import android.media.MediaPlayer.OnPreparedListener;
import android.media.MediaRecorder;
import android.os.Environment;

import android.util.Log;
import java.lang.System;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.IOException;
import java.util.LinkedList;

public class AudioPlayer implements OnCompletionListener, OnPreparedListener, OnErrorListener {

    // AudioPlayer modes
    public enum MODE { NONE, PLAY, RECORD };

    // AudioPlayer states
    public enum STATE { MEDIA_NONE, MEDIA_STARTING, MEDIA_RUNNING, MEDIA_PAUSED, MEDIA_STOPPED, MEDIA_LOADING, MEDIA_ENDED, MEDIA_READY };

    private static final String LOG_TAG = "AudioPlayer";

    // AudioPlayer message ids
    private static int MEDIA_STATE = 1;
    private static int MEDIA_DURATION = 2;
    private static int MEDIA_POSITION = 3;
    private static int MEDIA_ERROR = 9;

    // Media error codes
    private static int MEDIA_ERR_NONE_ACTIVE    = 0;
    private static int MEDIA_ERR_ABORTED        = 1;

    private MediaPlayerModule handler;      // The AudioHandler object
    private String id;                      // The id of this player (used to identify Media object in JavaScript)
    private MODE mode = MODE.NONE;          // Playback or Recording mode
    private STATE state = STATE.MEDIA_NONE; // State of recording or playback

    private String audioFile = null;        // File name to play or record to
    private float duration = -1;            // Duration of audio

    private MediaRecorder recorder = null;  // Audio recording object
    private LinkedList<String> tempFiles = null; // Temporary recording file name
    private String tempFile = null;

    private MediaPlayer player = null;  // Audio player object
    private boolean prepareOnly = true; // playback after file prepare flag
    private int seekOnPrepared = 0;     // seek to this location once media is prepared

    public AudioPlayer(MediaPlayerModule handler, String id, String file) {
        this.handler = handler;
        this.id = id;
        this.audioFile = file;
        this.tempFiles = new LinkedList<String>();
    }

    public void destroy() {
        // Stop any play or record
        if (this.player != null) {
            if ((this.state == STATE.MEDIA_RUNNING) || (this.state == STATE.MEDIA_PAUSED)) {
                this.player.stop();
                this.setState(STATE.MEDIA_STOPPED);
            }
            this.player.release();
            this.player = null;
        }
    }

    public void startPlaying(String file) {
        if (this.readyPlayer(file) && this.player != null) {
            this.player.start();
            this.setState(STATE.MEDIA_RUNNING);
            this.seekOnPrepared = 0; //insures this is always reset
        } else {
            this.prepareOnly = false;
        }
    }

    public void seekToPlaying(int milliseconds) {
        if (this.readyPlayer(this.audioFile)) {
            if (milliseconds > 0) {
                this.player.seekTo(milliseconds);
            }
            //Log.d(LOG_TAG, "Send a onStatus update for the new seek");
            sendStatusChange(MEDIA_POSITION, null, (milliseconds / 1000.0f));
        }
        else {
            this.seekOnPrepared = milliseconds;
        }
    }

    public void pausePlaying() {

        // If playing, then pause
        if (this.state == STATE.MEDIA_RUNNING && this.player != null) {
            this.player.pause();
            this.setState(STATE.MEDIA_PAUSED);
        }
        else {
            //Log.d(LOG_TAG, "AudioPlayer Error: pausePlaying() called during invalid state: " + this.state.ordinal());
            sendErrorStatus(MEDIA_ERR_NONE_ACTIVE);
        }
    }

    public void stopPlaying() {
        if ((this.state == STATE.MEDIA_RUNNING) || (this.state == STATE.MEDIA_PAUSED)) {
            this.player.pause();
            this.player.seekTo(0);
            //Log.d(LOG_TAG, "stopPlaying is calling stopped");
            this.setState(STATE.MEDIA_STOPPED);
        }
        else {
            //Log.d(LOG_TAG, "AudioPlayer Error: stopPlaying() called during invalid state: " + this.state.ordinal());
            sendErrorStatus(MEDIA_ERR_NONE_ACTIVE);
        }
    }

    public void onCompletion(MediaPlayer player) {
        //Log.d(LOG_TAG, "on completion is calling stopped");
        this.setState(STATE.MEDIA_ENDED);
    }

    public long getCurrentPosition() {
        if ((this.state == STATE.MEDIA_RUNNING) || (this.state == STATE.MEDIA_PAUSED)) {
            int curPos = this.player.getCurrentPosition();
            sendStatusChange(MEDIA_POSITION, null, (curPos / 1000.0f));
            return curPos;
        }
        else {
            return -1;
        }
    }

    public boolean isStreaming(String file) {
        if (file.contains("http://") || file.contains("https://") || file.contains("rtsp://")) {
            return true;
        }
        else {
            return false;
        }
    }

    public float getDuration(String file) {

        // Can't get duration of recording
        if (this.recorder != null) {
            return (-2); // not allowed
        }

        // If audio file already loaded and started, then return duration
        if (this.player != null) {
            return this.duration;
        }

        // If no player yet, then create one
        else {
            this.prepareOnly = true;
            this.startPlaying(file);

            // This will only return value for local, since streaming
            // file hasn't been read yet.
            return this.duration;
        }
    }

    public void onPrepared(MediaPlayer player) {
        // Listen for playback completion
        this.player.setOnCompletionListener(this);
        // seek to any location received while not prepared
        this.seekToPlaying(this.seekOnPrepared);
        // If start playing after prepared
        if (!this.prepareOnly) {
            this.player.start();
            this.setState(STATE.MEDIA_RUNNING);
            this.seekOnPrepared = 0; //reset only when played
        } else {
            this.setState(STATE.MEDIA_STARTING);
        }
        // Save off duration
        this.duration = getDurationInSeconds();
        // reset prepare only flag
        this.prepareOnly = true;

        // Send status notification to JavaScript
        sendStatusChange(MEDIA_DURATION, null, this.duration);
    }

    private float getDurationInSeconds() {
        return (this.player.getDuration() / 1000.0f);
    }

    public boolean onError(MediaPlayer player, int arg1, int arg2) {
        //Log.d(LOG_TAG, "AudioPlayer.onError(" + arg1 + ", " + arg2 + ")");

        // we don't want to send success callback
        // so we don't call setState() here
        this.state = STATE.MEDIA_STOPPED;
        this.destroy();
        // Send error notification to JavaScript
        sendErrorStatus(arg1);

        return false;
    }

    private void setState(STATE state) {
        if (this.state != state) {
            sendStatusChange(MEDIA_STATE, null, (float)state.ordinal());
        }
        this.state = state;
    }

    private void setMode(MODE mode) {
        if (this.mode != mode) {
        }
        this.mode = mode;
    }

    public int getState() {
        return this.state.ordinal();
    }

    public void setVolume(float volume) {
        if (this.player != null) {
            this.player.setVolume(volume, volume);
        } else {
            //Log.d(LOG_TAG, "AudioPlayer Error: Cannot set volume until the audio file is initialized.");
            sendErrorStatus(MEDIA_ERR_NONE_ACTIVE);
        }
    }

    private boolean playMode() {
        switch(this.mode) {
        case NONE:
            this.setMode(MODE.PLAY);
            break;
        case PLAY:
            break;
        case RECORD:
            //Log.d(LOG_TAG, "AudioPlayer Error: Can't play in record mode.");
            sendErrorStatus(MEDIA_ERR_ABORTED);
            return false; //player is not ready
        }
        return true;
    }

    private boolean readyPlayer(String file) {
        if (playMode()) {
            switch (this.state) {
                case MEDIA_NONE:
                    if (this.player == null) {
                        this.player = new MediaPlayer();
                        this.player.setOnErrorListener(this);
                    }
                    try {
                        this.loadAudioFile(file);
                    } catch (Exception e) {
                        sendErrorStatus(MEDIA_ERR_ABORTED);
                    }
                    return false;
                case MEDIA_LOADING:
                    //Log.d(LOG_TAG, "AudioPlayer Loading: startPlaying() called during media preparation: " + STATE.MEDIA_STARTING.ordinal());
                    this.prepareOnly = false;
                    return false;
                case MEDIA_STARTING:
                    this.setState(STATE.MEDIA_READY);
                    return true;
                case MEDIA_RUNNING:
                case MEDIA_PAUSED:
                    return true;
                case MEDIA_STOPPED:
                    //if we are readying the same file
                    if (this.audioFile.compareTo(file) == 0 && file != null) {
                        //maybe it was recording?
                        if(this.recorder!=null && player==null) {
                            this.player = new MediaPlayer();
                            this.player.setOnErrorListener(this);
                            this.prepareOnly = false;

                            try {
                                this.loadAudioFile(file);
                            } catch (Exception e) {
                                sendErrorStatus(MEDIA_ERR_ABORTED);
                            }
                            return false;//we´re not ready yet
                        }
                        else if(this.player!= null){
                           //reset the audio file
                          try{
                            player.seekTo(0);
                            player.pause();
                          }catch(Exception e){
                              e.printStackTrace();
                          }
                            return true;
                        }
                    } else {
                        //reset the player
                        this.player.reset();
                        try {
                            this.loadAudioFile(file);
                        } catch (Exception e) {
                            sendErrorStatus(MEDIA_ERR_ABORTED);
                        }
                        //if we had to prepare the file, we won't be in the correct state for playback
                        return false;
                    }
                default:
                    //Log.d(LOG_TAG, "AudioPlayer Error: startPlaying() called during invalid state: " + this.state);
                    sendErrorStatus(MEDIA_ERR_ABORTED);
            }
        }
        return false;
    }

    private void loadAudioFile(String file) throws IllegalArgumentException, SecurityException, IllegalStateException, IOException {
        if (this.isStreaming(file)) {
            this.player.setDataSource(file);
            this.player.setAudioStreamType(AudioManager.STREAM_MUSIC);
            //if it's a streaming file, play mode is implied
            this.setMode(MODE.PLAY);
            this.setState(STATE.MEDIA_STARTING);
            this.player.setOnPreparedListener(this);
            this.player.prepareAsync();
        }
        else {
            if (file.startsWith("/android_asset/")) {
            }
            else {
                File fp = new File(file);
                if (fp.exists()) {
                  try{
                    FileInputStream fileInputStream = new FileInputStream(file);
                    this.player.setDataSource(fileInputStream.getFD());
                    fileInputStream.close();
                  }catch(Exception e){
                      e.printStackTrace();
                  }
                }
                else {
                    this.player.setDataSource(Environment.getExternalStorageDirectory().getPath() + "/" + file);
                }
            }
                this.setState(STATE.MEDIA_STARTING);
                this.player.setOnPreparedListener(this);
                this.player.prepare();

                // Get duration
                this.duration = getDurationInSeconds();

            }
    }

    private void sendErrorStatus(int errorCode) {
        sendStatusChange(MEDIA_ERROR, errorCode, null);
    }

    private void sendStatusChange(int messageType, Integer additionalCode, Float value) {

        if (additionalCode != null && value != null) {
            throw new IllegalArgumentException("Only one of additionalCode or value can be specified, not both");
        }

        JSONObject statusDetails = new JSONObject();
        try {
            statusDetails.put("id", this.id);
            statusDetails.put("msgType", messageType);
            if (additionalCode != null) {
                JSONObject code = new JSONObject();
                code.put("code", additionalCode.intValue());
                statusDetails.put("value", code);
            }
            else if (value != null) {
                statusDetails.put("value", value.floatValue());
            }
        } catch (JSONException e) {
            //Log.e(LOG_TAG, "Failed to create status details", e);
        }

        this.handler.sendEventMessage("status", statusDetails);
    }

    public float getCurrentAmplitude() {
        if (this.recorder != null) {
            try{
                if (this.state == STATE.MEDIA_RUNNING) {
                    return (float) this.recorder.getMaxAmplitude() / 32762;
                }
            }
            catch (Exception e) {
                e.printStackTrace();
            }
        }
        return 0;
    }
}
