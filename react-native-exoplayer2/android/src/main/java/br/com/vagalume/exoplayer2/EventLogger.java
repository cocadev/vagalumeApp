package br.com.vagalume.exoplayer2;

import android.util.Log;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import java.io.UnsupportedEncodingException;

import com.google.android.exoplayer2.ExoPlaybackException;
import com.google.android.exoplayer2.Format;
import com.google.android.exoplayer2.PlaybackParameters;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.Timeline;
import com.google.android.exoplayer2.metadata.Metadata;
import com.google.android.exoplayer2.metadata.MetadataOutput;
import com.google.android.exoplayer2.metadata.emsg.EventMessage;
import com.google.android.exoplayer2.metadata.id3.ApicFrame;
import com.google.android.exoplayer2.metadata.id3.CommentFrame;
import com.google.android.exoplayer2.metadata.id3.GeobFrame;
import com.google.android.exoplayer2.metadata.id3.Id3Frame;
import com.google.android.exoplayer2.metadata.id3.PrivFrame;
import com.google.android.exoplayer2.metadata.id3.TextInformationFrame;
import com.google.android.exoplayer2.metadata.id3.UrlLinkFrame;
import com.google.android.exoplayer2.source.AdaptiveMediaSourceEventListener;
import com.google.android.exoplayer2.source.TrackGroupArray;
import com.google.android.exoplayer2.trackselection.TrackSelectionArray;
import com.google.android.exoplayer2.upstream.DataSpec;
import com.google.android.exoplayer2.mediacodec.MediaCodecRenderer.DecoderInitializationException;
import com.google.android.exoplayer2.upstream.HttpDataSource.HttpDataSourceException;
import com.google.android.exoplayer2.upstream.HttpDataSource.InvalidResponseCodeException;
import java.net.UnknownHostException;
import java.net.SocketTimeoutException;
import java.net.ConnectException;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

import java.io.IOException;

final class EventLogger extends Player.DefaultEventListener implements Player.EventListener,
MetadataOutput, AdaptiveMediaSourceEventListener {

    public interface StreamError {
        void onError(Exception error);
    }

    private static final String TAG = "VagalumeExo";
	private Map<String, Object> constants;

	protected ReactApplicationContext context;
    private StreamError streamError;


    public EventLogger(ReactApplicationContext reactContext, StreamError streamError) {
		constants = Constants.getConstants();
		context = reactContext;
        this.streamError = streamError;
    }

    @Override
    public void onTimelineChanged(Timeline timeline, Object manifest) {

    }

    @Override
    public void onTracksChanged(TrackGroupArray trackGroups, TrackSelectionArray trackSelections) {
    }

    @Override
    public void onLoadingChanged(boolean isLoading) {

    }

    @Override
    public void onPlayerStateChanged(boolean playWhenReady, int playbackState) {
		int state = (int) constants.get("STREAM_FAIL");
		switch (playbackState) {
			case Player.STATE_BUFFERING:
				state = (int) constants.get("STATE_STARTING");
			break;
			case Player.STATE_ENDED:
				state = (int) constants.get("STATE_STOPPED");
			break;
			case Player.STATE_IDLE:
				return;
			case Player.STATE_READY:
				if (playWhenReady) {
					state = (int) constants.get("STATE_RUNNING");
				} else {
					state = (int) constants.get("STATE_STOPPED");
				}
			break;
			default:
				state = (int) constants.get("STREAM_FAIL");
			break;
		}

		try {
           context
               .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
               .emit(String.valueOf(constants.get("ON_STATE_CHANGED")), state);
       } catch (Exception e) {}
    }

    @Override
    public void onRepeatModeChanged(int repeatMode) {
    }

    @Override
    public void onShuffleModeEnabledChanged(boolean shuffleModeEnabled) {

    }

    @Override
    public void onPositionDiscontinuity(int reason) {
    }

    @Override
    public void onPlaybackParametersChanged(PlaybackParameters playbackParameters) {
    }

    @Override
    public void onSeekProcessed() {
    }

    @Override
    public void onMetadata(Metadata metadata) {
		WritableMap params = Arguments.createMap();

        for (int i = 0; i < metadata.length(); i++) {
            Metadata.Entry entry = metadata.get(i);
            if (entry instanceof TextInformationFrame) {
				String key = "";
                TextInformationFrame textInformationFrame = (TextInformationFrame) entry;

				switch(textInformationFrame.id) {
					case "TPE1":
						key = "band";
					break;
					case "TPE2":
						key = "band_url";
					break;
					case "TIT2":
						key = "song";
					break;
					case "TIT3":
						key = "song_url";
					break;
					case "TLEN":
						key = "duration";
					break;
					case "TOFN":
						key = "segment";
					break;
					case "TIME":
						key = "time";
					break;
					case "TXXX":
						key = "extra";
					break;
				}

                String value = textInformationFrame.value;

                if (key.equals("song") || key.equals("band")) {
                    try {
                        value = new String(value.getBytes("ISO-8859-1"), "UTF-8");
                    } catch (UnsupportedEncodingException e) {
                        e.printStackTrace();
                    }
                }

				params.putString(key, value);
            }
        }

		try {
			context
			.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
			.emit(String.valueOf(constants.get("ON_ID3_METADATA")), params);
		} catch (Exception e) {}
    }

    @Override
    public void onLoadError(DataSpec dataSpec, int dataType, int trackType, Format trackFormat, int trackSelectionReason, Object trackSelectionData, long mediaStartTimeMs, long mediaEndTimeMs, long elapsedRealtimeMs, long loadDurationMs, long bytesLoaded, IOException error, boolean wasCanceled) {
		onError(error);
    }

    @Override
    public void onPlayerError(ExoPlaybackException error) {
        onError(error);
    }

    private void onError(Exception error) {
        Object cause      = error.getCause();
        String message    = error.getMessage();
        String eventName  = String.valueOf(constants.get("ON_STATE_CHANGED"));
        String status     = null;

        if (cause instanceof HttpDataSourceException) {
            // Thrown when an error is encountered when trying to read from a HttpDataSource.
            message = error.getCause().getMessage();

            Pattern pattern = Pattern.compile("https?:\\/\\/[^\\s]+\\.(ts|aac|m3u8)");
            Matcher matcher = pattern.matcher(message);
            if (matcher.find()) {
                String extension = matcher.group(1);
                if (extension.equals("ts")) status = String.valueOf(constants.get("TS_FAIL"));
                if (extension.equals("m3u8")) status = String.valueOf(constants.get("M3U8_FAIL"));
                if (extension.equals("aac")) status = String.valueOf(constants.get("AAC_FAIL"));
            }

        } else if (cause instanceof InvalidResponseCodeException) {
            // Thrown when an attempt to open a connection results in a response code not in the 2xx range.
            status = String.valueOf(constants.get("TS_NOT_FOUND"));

        } else if (cause instanceof UnknownHostException) {
            // Thrown to indicate that the IP address of a host could not be determined.
            // Error Message (example): Unable to connect to https://stream.vagalume.fm/hls/14660055301134442883/14750048853846-1475004885-04-30.00.aac / master.m3u8
            status = String.valueOf(constants.get("UNKNOWN_HOST"));

        } else if (cause instanceof SocketTimeoutException) {
            // Signals that a timeout has occurred on a socket read or accept.
            status = String.valueOf(constants.get("SOCKET_TIMEOUT"));

        } else if (cause instanceof ConnectException) {
            // Signals that an error occurred while attempting to connect a socket to a remote address and port. Typically, the connection was refused remotely (e.g., no process is listening on the remote address/port).
            status = String.valueOf(constants.get("CONNECT_EXCEPTION"));

        } else if (cause instanceof DecoderInitializationException) {
            // Thrown when a failure occurs instantiating a decoder.
            status = String.valueOf(constants.get("INVALID_STREAM"));
        }

        streamError.onError(error);

        if (status != null) {
            try {
                context
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, status);
            } catch (Exception e) {}
        }

    }

    @Override
    public void onUpstreamDiscarded(int trackType, long mediaStartTimeMs, long mediaEndTimeMs) {
    }

    @Override
    public void onDownstreamFormatChanged(int trackType, Format trackFormat, int trackSelectionReason, Object trackSelectionData, long mediaTimeMs) {
    }

    @Override
    public void onLoadStarted(DataSpec dataSpec, int dataType, int trackType, Format trackFormat, int trackSelectionReason, Object trackSelectionData, long mediaStartTimeMs, long mediaEndTimeMs, long elapsedRealtimeMs) {
    }

    @Override
    public void onLoadCompleted(DataSpec dataSpec, int dataType, int trackType, Format trackFormat, int trackSelectionReason, Object trackSelectionData, long mediaStartTimeMs, long mediaEndTimeMs, long elapsedRealtimeMs, long loadDurationMs, long bytesLoaded) {
        
    }

    @Override
    public void onLoadCanceled(DataSpec dataSpec, int dataType, int trackType, Format trackFormat, int trackSelectionReason, Object trackSelectionData, long mediaStartTimeMs, long mediaEndTimeMs, long elapsedRealtimeMs, long loadDurationMs, long bytesLoaded) {
    }
}
