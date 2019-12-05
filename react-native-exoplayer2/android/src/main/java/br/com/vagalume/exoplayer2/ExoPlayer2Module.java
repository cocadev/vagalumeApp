package br.com.vagalume.exoplayer2;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import java.util.HashMap;
import android.net.Uri;
import android.os.Handler;

import android.util.Log;
import java.util.Map;
import com.google.android.exoplayer2.ExoPlayerFactory;
import com.google.android.exoplayer2.SimpleExoPlayer;
import com.google.android.exoplayer2.extractor.DefaultExtractorsFactory;
import com.google.android.exoplayer2.extractor.ExtractorsFactory;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.hls.HlsMediaSource;
import com.google.android.exoplayer2.trackselection.AdaptiveTrackSelection;
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector;
import com.google.android.exoplayer2.trackselection.TrackSelection;
import com.google.android.exoplayer2.DefaultLoadControl;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.upstream.DefaultAllocator;
import com.google.android.exoplayer2.upstream.DataSource;
import com.google.android.exoplayer2.upstream.DefaultBandwidthMeter;
import com.google.android.exoplayer2.upstream.DefaultDataSourceFactory;
import com.google.android.exoplayer2.util.Util;

public class ExoPlayer2Module extends ReactContextBaseJavaModule implements LifecycleEventListener, EventLogger.StreamError {

	private boolean isReady;
	private EventLogger eventLogger;
	private SimpleExoPlayer player;
	private Uri source;
	private int buffer = 60000;
	private MediaSource mediaSource;
	private final int minLoadableRetryCount = 1;
	private static final String TAG = "VAGALUME.FM - LOGGERS";

	protected ReactApplicationContext context;

	public ExoPlayer2Module(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        context.addLifecycleEventListener(this);
    }

    @Override
    public String getName() {
        return "ExoPlayer2";
    }

	@Override
	public Map<String, Object> getConstants() {
		return Constants.getConstants();
	}

	@ReactMethod
    public void set(String url) {
        source = Uri.parse(url);

        release();
		Handler mainHandler = new Handler();
        DefaultBandwidthMeter bandwidthMeter = new DefaultBandwidthMeter();
        eventLogger = new EventLogger(context, this);
		TrackSelection.Factory videoTrackSelectionFactory = new AdaptiveTrackSelection.Factory(bandwidthMeter);
        DefaultTrackSelector trackSelector = new DefaultTrackSelector(videoTrackSelectionFactory);
		DefaultAllocator allocator = new DefaultAllocator(true, C.DEFAULT_BUFFER_SEGMENT_SIZE);
		/*
			Valores definidos para melhor configuração de buffer
			DEFAULT_MIN_BUFFER_MS = 360000
			DEFAULT_MAX_BUFFER_MS = 600000

			Valores default do ExoPlayer2
			DEFAULT_BUFFER_FOR_PLAYBACK_MS = 2500
			DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS = 5000
			TARGET_BUFFER_BYTES = -1
			PRIORITIZE_TIME_OVER_SIZE_THRESHOLDS = true
		*/
		DefaultLoadControl loadControl = new DefaultLoadControl(allocator, 360000, 600000, 2500, 5000, -1, true);
		player = ExoPlayerFactory.newSimpleInstance(context, trackSelector, loadControl);

		DataSource.Factory dataSourceFactory = new DefaultDataSourceFactory(context,
                Util.getUserAgent(context, "ExoPlayer2"), bandwidthMeter);

		ExtractorsFactory extractorsFactory = new DefaultExtractorsFactory();

		mediaSource = new HlsMediaSource(source, dataSourceFactory, minLoadableRetryCount, mainHandler, eventLogger);
		player.prepare(mediaSource);
		player.addMetadataOutput(eventLogger);
        player.addListener(eventLogger);
        player.seekTo(buffer);
    }

	@ReactMethod
	public void seekTo(int ms) {
		if (player != null) {
			player.seekTo(ms);
		}
	}

	@ReactMethod
	public void setBuffer(int ms) {
		if (ms > 0 && player != null) {
			buffer = ms;
			player.seekTo(ms);
		}
	}

	@ReactMethod
	public void play() {
		if (player != null) {
			player.setVolume(0);
			player.setPlayWhenReady(true);
		}
	}

	@ReactMethod
	public void stop() {
		if (player != null) {
			player.setPlayWhenReady(false);
		}
	}

	@ReactMethod
	public void release() {
		if (player != null) {
			stop();
			player.release();
			player = null;
			mediaSource = null;
		}
	}

	@ReactMethod
	public void setVolume(float volume) {
		if (player != null) {
			player.setVolume(volume);
		}
	}

	@ReactMethod
	public void getPosition(Promise promise) {
		promise.resolve(0);
	}

	@Override
	public void onError(Exception error) {
		isReady = false;
	}

	@Override
    public void onHostResume() {
    }

    @Override
    public void onHostPause() {
    }

    @Override
    public void onHostDestroy() {
		release();
    }
}
