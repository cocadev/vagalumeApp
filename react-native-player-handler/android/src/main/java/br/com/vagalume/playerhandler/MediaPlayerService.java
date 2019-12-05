package br.com.vagalume.playerhandler;

import android.app.NotificationManager;
import android.content.ComponentName;
import android.app.Notification;
import android.content.IntentFilter;
import android.media.MediaPlayer;
import android.os.Binder;
import android.os.IBinder;
import android.os.RemoteException;
import android.support.v4.media.session.MediaButtonReceiver;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaControllerCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import android.os.SystemClock;
import android.os.Bundle;
import java.net.URL;
import java.net.HttpURLConnection;
import java.io.InputStream;
import java.io.IOException;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactApplicationContext;
import android.content.ComponentCallbacks2;
import android.media.session.MediaSession;
import android.media.AudioManager;
import android.content.BroadcastReceiver;
import android.content.res.Resources;
import android.telephony.PhoneStateListener;
import android.telephony.TelephonyManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.app.PendingIntent;
import android.os.PowerManager;
import android.net.wifi.WifiManager;
import android.app.Service;
import android.os.IBinder;
import android.os.Build;
import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.os.Looper;
import android.support.v4.app.NotificationCompat;
import android.support.v4.media.app.NotificationCompat.MediaStyle;
import android.util.Log;
import java.util.List;
import android.app.ActivityManager;
import android.support.v4.util.SimpleArrayMap;
import android.view.KeyEvent;
import android.content.BroadcastReceiver;
import android.os.ResultReceiver;
import android.widget.RemoteViews;
import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.bitmap.RoundedCorners;
import com.bumptech.glide.request.RequestOptions;
import com.bumptech.glide.request.target.NotificationTarget;
import android.app.Notification;
import com.bumptech.glide.request.target.SimpleTarget;
import com.bumptech.glide.request.transition.Transition;
import android.view.View;
import android.app.NotificationChannel;

public class MediaPlayerService extends Service implements AudioManager.OnAudioFocusChangeListener, ComponentCallbacks2  {

	// enums
	private enum PlayerTypes {
		STREAM(1), OFFLINE(2), CHROMECAST(3);
		private final int option;
		PlayerTypes(int option) {
			this.option = option;
		}
		public int getValue() {
			return option;
		}
	}

	private enum PlaybackStatus {
		PLAY(0), PAUSE(1), NEXT(2), PREV(3), STOP(4), REC(5);
		private final int option;
		PlaybackStatus(int option) {
			this.option = option;
		}
		public int getOption() {
			return option;
		}
	}

	// Var
	private static final String PLAYER_SERVICE_KEY = "playerService";
	private final int NOTIFICATION_ID = 108;
	private final String CHANNEL_ID = "channel_108";
	private final String CHANNEL_HUMAN_READABLE = "Vagalume FM";
	private Context context;
	private Resources resources;
	private String packageName;
	private Media media = new Media();
	private PowerManager.WakeLock wakeLock = null;
 	private WifiManager.WifiLock wifiLock = null;
	private boolean locksHeld = false;

	// Notification
	private final int NOTIFICATION_IMAGE_WIDTH = 250;
	private final int NOTIFICATION_IMAGE_HEIGHT = 210;
	private final RequestOptions notificationRequestOptions = new RequestOptions().override(NOTIFICATION_IMAGE_WIDTH, NOTIFICATION_IMAGE_HEIGHT).centerCrop().placeholder(R.drawable.placeholder);
	private RemoteViews smallRemoteView;
	private RemoteViews bigRemoteView;

	private NotificationTarget bigStationTarget;
	private NotificationTarget smallStationTarget;
	private NotificationTarget artistTarget;

	private Handler stationHandler;
	private Handler artistHandler;
	private Runnable stationRunnable;
	private Runnable artistRunnable;
	private Bitmap placeholder;
	private Bitmap notificationImage;
	private Bitmap metadataImage;
	private BitmapDrawable notificationBitmapDrawable;

	private String notificationURL;
	private String artistURL;
	private NotificationManager notificationManager;
	private Notification notification;
	private NotificationCompat.Builder notificationBuilder;


	// Handlers
	private boolean glideImageNotificationCache = false; // Handle Glide lib cache (notification)
	private boolean glideImageMediaSessionCache = false; // Handle Glide lib cache (metadata)
	private boolean ongoingCall = false; //Handle incoming phone calls
	private boolean isNotificationLoaded = false;

	// Service
	private final IBinder iBinder = new LocalBinder();
	private AudioManager audioManager;
	private PhoneStateListener phoneStateListener;
	private TelephonyManager telephonyManager;

	// Next and play timeout
	private Handler timoutHandler = new Handler();
	private Runnable timeoutAction;
	private long timoutDelay = 300; // 300 ms

	// Media Session / Metadata
	private MediaSessionCompat mediaSessionCompat;
	private BitmapDrawable metadataBitmapDrawable;
	private ComponentName mediaButtonReceiver;
	private MediaControllerCompat.TransportControls transportControls;
	private PlaybackStateCompat.Builder playBackStateBuilder = new PlaybackStateCompat.Builder();
	private final RequestOptions metadataRequestOptions = new RequestOptions().centerCrop();
	private final String MEDIA_SESSION_TAG = "VagalumeFmAudioPlayer";
	public static final String ACTION_PLAY = "br.com.vagalume.playerhandler.ACTION_PLAY";
	public static final String ACTION_PAUSE = "br.com.vagalume.playerhandler.ACTION_PAUSE";
	public static final String ACTION_PREVIOUS = "br.com.vagalume.playerhandler.ACTION_PREVIOUS";
	public static final String ACTION_NEXT = "br.com.vagalume.playerhandler.ACTION_NEXT";
	public static final String ACTION_STOP = "br.com.vagalume.playerhandler.ACTION_STOP";
	public static final String ACTION_RECORDING = "br.com.vagalume.playerhandler.ACTION_RECORDING";

	// Send events to JS
	private void sendEvent(String eventName, String message) {
		try {
			PlayerHandlerModule.ctx
				.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
				.emit(eventName, message);

		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	// Media.class instace
	private void setCurrentMedia(Media media) {
		this.media = media;
	}


	private Media getCurrentMedia() {
		return this.media;
	}


	// Request audio focus
	private boolean requestAudioFocus() {
		if (audioManager == null) audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
		return AudioManager.AUDIOFOCUS_REQUEST_GRANTED == audioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
	}


	// Remove audio focus
	private boolean removeAudioFocus() {
		if (audioManager == null) audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
		return AudioManager.AUDIOFOCUS_REQUEST_GRANTED == audioManager.abandonAudioFocus(this);
	}


	// Remove notification
	private void removeNotification() {
		if (notificationManager == null) notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
		notificationManager.cancel(NOTIFICATION_ID);
		stopForeground(true);
		releaseWakeLock();
	}


	// Becoming noisy
	private BroadcastReceiver becomingNoisyReceiver = new BroadcastReceiver() {
		@Override
		public void onReceive(Context context, Intent intent) {
			//pause audio on ACTION_AUDIO_BECOMING_NOISY
			sendEvent(PLAYER_SERVICE_KEY, "BECOMING_NOISY");
		}
	};

	private void acquireWakeLock() {
		if (!locksHeld) {
			wakeLock.acquire();
			wifiLock.acquire();
			locksHeld = true;
		}
	}

	private void releaseWakeLock() {
		if (locksHeld) {
			wakeLock.release();
			wifiLock.release();
			locksHeld = false;
		}
	}

	public void sendStopAction() {
		sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_STOP");
		removeNotification();
		removeAudioFocus();
		stopSelf();
		if (mediaSessionCompat != null) {
			mediaSessionCompat.release();
		}
		if (notificationManager == null) notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
		notificationManager.cancel(NOTIFICATION_ID);
		stopForeground(true);
		releaseWakeLock();
	}

	// Register after getting audio focus
	private void registerBecomingNoisyReceiver() {
		IntentFilter intentFilter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
		registerReceiver(becomingNoisyReceiver, intentFilter);
	}


	public class LocalBinder extends Binder {
		public MediaPlayerService getService() {
			return MediaPlayerService.this;
		}
	}


	@Override
	public IBinder onBind(Intent intent) {
		return iBinder;
	}


	@Override
	public void onTrimMemory(int level) {
		switch(level) {
			case ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL:
			break;

			default:
			break;
		}
	}

	@Override
	public void onCreate() {
		super.onCreate();

		// Initialize context vars
		initializeContext();

		// Keep Wi-Fi radio awake
		PowerManager pm = (PowerManager)this.context.getSystemService(ReactApplicationContext.POWER_SERVICE);
		wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FMWakeful");

		WifiManager wm = (WifiManager)this.context.getSystemService(ReactApplicationContext.WIFI_SERVICE);
		wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL, "FMWakefulWifi");

		// Manage incoming phone calls during playback.
		callStateListener();

		// ACTION_AUDIO_BECOMING_NOISY -- change in audio outputs -- BroadcastReceiver
		registerBecomingNoisyReceiver();


		// Initialize Media Session
		 initMediaSession();
		 activeMediaSession();
	}


	@Override
	public void onDestroy() {
		super.onDestroy();

		// Send event to js
		sendEvent(PLAYER_SERVICE_KEY, "SERVICE_DESTROY");

		// Remove audio focus
		removeAudioFocus();

		// Disable the PhoneStateListener
		if (phoneStateListener != null) telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_NONE);

		// Disable wifiLock
		releaseWakeLock();

		// Remove notification
		removeNotification();

		// Release metadata - media session
		if (mediaSessionCompat != null) mediaSessionCompat.release();

		// Stop service
		stopSelf();

		// Unregister BroadcastReceivers
		unregisterReceiver(becomingNoisyReceiver);
	}

	//The system calls this method when an activity, requests the service be started
	@Override
	public int onStartCommand(Intent intent, int flags, int startId) {
		try {

			MediaButtonReceiver.handleIntent(mediaSessionCompat, intent);

			//Handle Intent action from MediaSession.TransportControls
			handleIncomingActions(intent);
		} catch (Exception e) {
			e.printStackTrace();
			stopSelf();

		}

		return START_STICKY;
	}


	//Invoked when the audio focus of the system is updated.
	@Override
	public void onAudioFocusChange(int focusState) {
		switch (focusState) {
			case AudioManager.AUDIOFOCUS_GAIN: // 1
				sendEvent(PLAYER_SERVICE_KEY, "AUDIOFOCUS_GAIN");
			break;

			case AudioManager.AUDIOFOCUS_LOSS: // -1
				sendEvent(PLAYER_SERVICE_KEY, "AUDIOFOCUS_LOSS");
			break;

			case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT: // -2
				sendEvent(PLAYER_SERVICE_KEY, "AUDIOFOCUS_LOSS_TRANSIENT");
			break;

			case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK: // -3
				sendEvent(PLAYER_SERVICE_KEY, "AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK");
			break;

			default:
			break;
		}
	}

	// Handle incoming phone calls
	private void callStateListener() {
		// Get the telephony manager
		telephonyManager = (TelephonyManager) getSystemService(Context.TELEPHONY_SERVICE);

		// Starting listening for PhoneState changes
		phoneStateListener = new PhoneStateListener() {
			@Override
			public void onCallStateChanged(int state, String incomingNumber) {

				// If at least one call exists or the phone is ringing
				switch (state) {
					// Pause the MediaPlayer
					case TelephonyManager.CALL_STATE_OFFHOOK:
					case TelephonyManager.CALL_STATE_RINGING:
						sendEvent(PLAYER_SERVICE_KEY, "CALL_STATE_ON");
						ongoingCall = true;
					break;

					// Phone idle. Start playing.
					case TelephonyManager.CALL_STATE_IDLE:
						if (ongoingCall) {
							requestAudioFocus();
							ongoingCall = false;
							sendEvent(PLAYER_SERVICE_KEY, "CALL_STATE_OFF");
						}
					break;
				}
			}
		};

		// Register the listener with the telephony manager
		// Listen for changes to the device call state.
		telephonyManager.listen(phoneStateListener, PhoneStateListener.LISTEN_CALL_STATE);
	}


	// Initialize context
	public void initializeContext() {
		this.context = getApplicationContext();
		this.resources = context.getResources();
		this.packageName = context.getPackageName();
		this.stationHandler = new Handler(Looper.getMainLooper());
		this.artistHandler = new Handler(Looper.getMainLooper());
		this.placeholder = BitmapFactory.decodeResource(context.getResources(), resources.getIdentifier("placeholder", "drawable", packageName));
		if (media == null) media = new Media();
	}

	// Initilialize media session
	private void initMediaSession() {
		try {

			mediaButtonReceiver = new ComponentName(context.getApplicationContext(), MediaPlayerService.class);
			mediaSessionCompat = new MediaSessionCompat(context.getApplicationContext(), MEDIA_SESSION_TAG, mediaButtonReceiver, null);
			if (android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.N) {
				mediaSessionCompat.setFlags(MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS | MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
			}
			mediaSessionCompat.setPlaybackState(new PlaybackStateCompat.Builder()
					.setState(PlaybackStateCompat.STATE_PAUSED, 0, 0)
					.setActions(PlaybackStateCompat.ACTION_PLAY_PAUSE | PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS)
					.build());
			mediaSessionCompat.setMetadata(createMetadata(media).build());
			mediaSessionCompat.setCallback(mediaSessionCallback);

			Intent mediaButtonIntent = new Intent(Intent.ACTION_MEDIA_BUTTON);
			mediaButtonIntent.setClass(this, MediaPlayerService.class);
			PendingIntent pendingIntent = PendingIntent.getService(this, 0, mediaButtonIntent, 0);
			mediaSessionCompat.setMediaButtonReceiver(pendingIntent);

			transportControls = mediaSessionCompat.getController().getTransportControls();

		} catch (OutOfMemoryError warn) {
		}
	}

	private void activeMediaSession() {
		if (mediaSessionCompat == null) return;

		if (requestAudioFocus()) {
			mediaSessionCompat.setActive(true);
		} else {
			mediaSessionCompat.release();
		}
	}

	public void buildNotification(final Media media) {
		boolean isCustomNotification = false;

		/*
		 * Verify if notification Actions is loaded
 		 * Prevent bug: java.util.ConcurrentModificationException
 		 */
		isNotificationLoaded = false;

		// Set current media
		setCurrentMedia(media);

		// Request Audio Focus
		if (media.isPlaying()) {
			requestAudioFocus();
		}

		// Build notification instace
		if (notificationBuilder == null) notificationBuilder = createNotificationInstace();

		// Update Metadata
		updateMetaData(media);

		// Swipe to close notification
		notificationBuilder.setOngoing(media.isPlaying());


		Intent openApp = new Intent(context, getMainActivityClass())
			.setAction(Intent.ACTION_MAIN)
			.addCategory(Intent.CATEGORY_LAUNCHER);

		notificationBuilder.setContentIntent(PendingIntent.getActivity(context, 0, openApp, 0));
		notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
		notificationBuilder.setVisibility(Notification.VISIBILITY_PUBLIC);

		if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
			// Play and pause actions/icons
			int iconPlayPause = media.isPlaying() ? resources.getIdentifier("pause", "drawable", packageName) : resources.getIdentifier("play", "drawable", packageName);
			PendingIntent intentPlayPause = media.isPlaying() ? playbackAction(PlaybackStatus.PAUSE) : playbackAction(PlaybackStatus.PLAY);

			// Rec icon
			int iconRec = media.isRecording() ? resources.getIdentifier("ic_rec_on", "drawable", packageName) : resources.getIdentifier("ic_rec_off", "drawable", packageName);
			String station = media.getInfo() != null && media.isRecording() ? media.getInfo()+" • GRAVANDO" : media.getInfo();

			notificationBuilder.setStyle(new MediaStyle()
			.setMediaSession(mediaSessionCompat.getSessionToken())
			.setShowActionsInCompactView(0, 1, 2));
			notificationBuilder.setColor(0xff222222);

			// Notification texts
			notificationBuilder.setContentTitle(media.getTitle());
			notificationBuilder.setContentText(media.getArtist());
			notificationBuilder.setSubText(station);

			// Clear notification actions
			notificationBuilder.mActions.clear();

			// Set new notification actions
			notificationBuilder.addAction(new NotificationCompat.Action(resources.getIdentifier("backward", "drawable", packageName), "previous", playbackAction(PlaybackStatus.PREV)));
			notificationBuilder.addAction(new NotificationCompat.Action(iconPlayPause, "pause", intentPlayPause));
			notificationBuilder.addAction(new NotificationCompat.Action(resources.getIdentifier("forward", "drawable", packageName), "next", playbackAction(PlaybackStatus.NEXT)));
			if (media.getPlayerType() == PlayerTypes.STREAM.getValue()) notificationBuilder.addAction(new NotificationCompat.Action(iconRec, "rec", playbackAction(PlaybackStatus.REC)));
			notificationBuilder.addAction(new NotificationCompat.Action(resources.getIdentifier("close", "drawable", packageName), "stop", playbackAction(PlaybackStatus.STOP)));

		} else {
			smallRemoteView = getSmallRemoteView(media);
			bigRemoteView = getBigRemoteView(media);
			notificationBuilder.setCustomContentView(smallRemoteView);
			notificationBuilder.setCustomBigContentView(bigRemoteView);

			isCustomNotification = true;
		}

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
			NotificationChannel channel = new NotificationChannel(CHANNEL_ID, CHANNEL_HUMAN_READABLE, NotificationManager.IMPORTANCE_LOW);
			notificationManager.createNotificationChannel(channel);
		}

		notification = notificationBuilder.build();

		if (notificationURL == null || !notificationURL.equals(media.getArtwork())) {
			notificationBuilder.setLargeIcon(placeholder);
			if (smallRemoteView != null && isCustomNotification) smallRemoteView.setImageViewResource(R.id.station_image, R.drawable.placeholder);
			if (bigRemoteView != null && isCustomNotification) bigRemoteView.setImageViewResource(R.id.station_image, R.drawable.placeholder);

			notificationURL = media.getArtwork();
			notificationImage = null;
			glideStationTask(media, isCustomNotification, notification, smallRemoteView, bigRemoteView);
		}

		if (isCustomNotification && (artistURL == null || !artistURL.equals(media.getArtistArtwork()))) {
			if (bigRemoteView != null) bigRemoteView.setImageViewResource(R.id.artist_image, R.drawable.placeholder_round);
			artistURL = media.getArtistArtwork();
			glideArtistTask(media, notification, bigRemoteView);
		}

		if (media.isPlaying()) {
			acquireWakeLock();
			startForeground(NOTIFICATION_ID, notification);
			isNotificationLoaded = true;
			return;
		} else {
			stopForeground(false);
		}

		notificationManager.notify(NOTIFICATION_ID, notification);
		isNotificationLoaded = true;

	}

	/* Set small view for android <= 6.0 */
	private RemoteViews getSmallRemoteView(Media media) {
		RemoteViews smallNotification = new RemoteViews(packageName, R.layout.small_notification);
		smallNotification.setTextViewText(R.id.station_name, media.getInfo());
		smallNotification.setViewVisibility(R.id.rec_content, media.isRecording() ? View.VISIBLE : View.GONE);
		smallNotification.setTextViewText(R.id.music_name, media.getTitle());
		smallNotification.setTextViewText(R.id.artist_name, media.getArtist());
		smallNotification.setViewVisibility(R.id.rec_off, media.isRecording() && media.getPlayerType() == PlayerTypes.STREAM.getValue() ? View.GONE : View.VISIBLE);
		smallNotification.setViewVisibility(R.id.rec_on, media.isRecording() && media.getPlayerType() == PlayerTypes.STREAM.getValue() ? View.VISIBLE : View.GONE);
		smallNotification.setViewVisibility(R.id.play, media.isPlaying() ? View.GONE : View.VISIBLE);
		smallNotification.setViewVisibility(R.id.pause, media.isPlaying() ? View.VISIBLE : View.GONE);
		smallNotification.setViewVisibility(R.id.separator, media.getInfo() != null ? View.VISIBLE : View.GONE);

		smallNotification.setOnClickPendingIntent(R.id.btn_rec_off, playbackAction(PlaybackStatus.REC));
		smallNotification.setOnClickPendingIntent(R.id.btn_rec_on, playbackAction(PlaybackStatus.REC));
		smallNotification.setOnClickPendingIntent(R.id.btn_prev, playbackAction(PlaybackStatus.PREV));
		smallNotification.setOnClickPendingIntent(R.id.btn_play, playbackAction(PlaybackStatus.PLAY));
		smallNotification.setOnClickPendingIntent(R.id.btn_pause, playbackAction(PlaybackStatus.PAUSE));
		smallNotification.setOnClickPendingIntent(R.id.btn_next, playbackAction(PlaybackStatus.NEXT));
		smallNotification.setOnClickPendingIntent(R.id.btn_close, playbackAction(PlaybackStatus.STOP));
		return smallNotification;
	}

	/* Set big view for android <= 6.0 */
	private RemoteViews getBigRemoteView(Media media) {
		RemoteViews bigNotification = new RemoteViews(packageName, R.layout.big_notification);
		bigNotification.setTextViewText(R.id.station_name, media.getInfo());
		bigNotification.setViewVisibility(R.id.rec_content, media.isRecording() ? View.VISIBLE : View.GONE);
		bigNotification.setTextViewText(R.id.music_name, media.getTitle());
		bigNotification.setTextViewText(R.id.artist_name, media.getArtist());
		bigNotification.setViewVisibility(R.id.rec_off, media.isRecording() && media.getPlayerType() == PlayerTypes.STREAM.getValue() ? View.GONE : View.VISIBLE);
		bigNotification.setViewVisibility(R.id.rec_on, media.isRecording() && media.getPlayerType() == PlayerTypes.STREAM.getValue() ? View.VISIBLE : View.GONE);
		bigNotification.setViewVisibility(R.id.pause, media.isPlaying() ? View.VISIBLE : View.GONE);
		bigNotification.setViewVisibility(R.id.play, media.isPlaying() ? View.GONE : View.VISIBLE);
		bigNotification.setViewVisibility(R.id.separator, media.getInfo() != null ? View.VISIBLE : View.GONE);

		bigNotification.setOnClickPendingIntent(R.id.btn_rec_off, playbackAction(PlaybackStatus.REC));
		bigNotification.setOnClickPendingIntent(R.id.btn_rec_on, playbackAction(PlaybackStatus.REC));
		bigNotification.setOnClickPendingIntent(R.id.btn_prev, playbackAction(PlaybackStatus.PREV));
		bigNotification.setOnClickPendingIntent(R.id.btn_play, playbackAction(PlaybackStatus.PLAY));
		bigNotification.setOnClickPendingIntent(R.id.btn_pause, playbackAction(PlaybackStatus.PAUSE));
		bigNotification.setOnClickPendingIntent(R.id.btn_next, playbackAction(PlaybackStatus.NEXT));
		bigNotification.setOnClickPendingIntent(R.id.btn_close, playbackAction(PlaybackStatus.STOP));
		return bigNotification;
	}

	/* Create notifications instances */
	private NotificationCompat.Builder createNotificationInstace() {
		return (NotificationCompat.Builder) new NotificationCompat.Builder(this, CHANNEL_ID)
					.setShowWhen(false)
					.setPriority(NotificationCompat.PRIORITY_MAX)
					.setSmallIcon(resources.getIdentifier("ic_launcher_white", "drawable", packageName))
					.setWhen(0);
	}

	/* Create metadata instances */
	private MediaMetadataCompat.Builder createMetadata(Media media) {
		String title = media.getTitle() != null ?  media.getTitle() : "Vagalume.FM";
		String artist = media.getArtist() != null ? media.getArtist() : " ";
		String station = media.getInfo() != null ? media.getInfo() : "Vagalume.FM";
		long duration =  media.getDuration() != null ? media.getDuration() : 0;

		return new MediaMetadataCompat.Builder()
				.putString(MediaMetadataCompat.METADATA_KEY_TITLE, title)
				.putString(MediaMetadataCompat.METADATA_KEY_ARTIST, artist)
				.putString(MediaMetadataCompat.METADATA_KEY_ALBUM, station)
				.putLong(MediaMetadataCompat.METADATA_KEY_DURATION, duration);
	}

	/* Initialize Glide (bitmap cache) */
	private void glideStationTask(final Media media, final boolean isCustomNotification, final Notification notification, final RemoteViews smallNotificationView, final RemoteViews bigNotificationView) {
		try {
			if (stationRunnable != null && stationHandler != null) stationHandler.removeCallbacksAndMessages(stationRunnable);
			if (bigStationTarget != null) Glide.with(context).clear(bigStationTarget);
			if (smallStationTarget != null) Glide.with(context).clear(smallStationTarget);
			if (notificationTaget != null && !isCustomNotification) Glide.with(context).clear(notificationTaget);

			if (isCustomNotification &&  notification != null
				&& bigNotificationView != null && smallNotificationView != null) {
				bigStationTarget = new NotificationTarget(context, R.id.station_image, bigNotificationView, notification, NOTIFICATION_ID);
				smallStationTarget = new NotificationTarget(context, R.id.station_image, smallNotificationView, notification, NOTIFICATION_ID);
				artistTarget = new NotificationTarget(context, R.id.artist_image, bigNotificationView, notification, NOTIFICATION_ID);
			}

			stationRunnable = new Runnable() {
				@Override
				public void run() {
					if (isCustomNotification && bigStationTarget != null && smallStationTarget != null) {
						Glide.with(context.getApplicationContext())
							.asBitmap()
							.load(media.getArtwork())
							.apply(RequestOptions.overrideOf(NOTIFICATION_IMAGE_WIDTH, NOTIFICATION_IMAGE_HEIGHT).centerCrop().placeholder(R.drawable.placeholder))
							.into(smallStationTarget);
						Glide.with(context.getApplicationContext())
                        	.asBitmap()
                        	.load(media.getArtwork())
                        	.apply(RequestOptions.overrideOf(NOTIFICATION_IMAGE_WIDTH, NOTIFICATION_IMAGE_HEIGHT).centerCrop().placeholder(R.drawable.placeholder))
                        	.into(bigStationTarget);
					} else {
						Glide.with(context)
							.load(media.getArtwork())
							.apply(notificationRequestOptions)
							.into(notificationTaget);
					}
				}
			};

			Runnable glideRunnable = new Runnable() {
				@Override
				public void run() {
					stationHandler.post(stationRunnable);
				}
			};

			new Thread(glideRunnable).start();

		} catch (IllegalStateException e) {
			e.printStackTrace();
			if (bigStationTarget != null) Glide.with(context).clear(bigStationTarget);
			if (smallStationTarget != null) Glide.with(context).clear(smallStationTarget);
			if (notificationTaget != null && !isCustomNotification) Glide.with(context).clear(notificationTaget);
		}
	}

	private void glideArtistTask(final Media media, final Notification notification, final RemoteViews bigNotificationView) {
		try {
			if (artistRunnable != null && artistHandler != null) artistHandler.removeCallbacksAndMessages(artistRunnable);
			if (artistTarget != null) Glide.with(context).clear(artistTarget);

			if (notification != null && bigNotificationView != null) {
				artistTarget = new NotificationTarget(context, R.id.artist_image, bigNotificationView, notification, NOTIFICATION_ID);
			}

			artistRunnable = new Runnable() {
				@Override
				public void run() {
					if (artistTarget != null) {
                    	Glide.with(context.getApplicationContext())
                        	.asBitmap()
                        	.load(media.getArtistArtwork())
                        	.apply(RequestOptions.circleCropTransform().placeholder(R.drawable.placeholder_round))
                        	.into(artistTarget);
					}
				}
			};

			Runnable glideRunnable = new Runnable() {
				@Override
				public void run() {
					artistHandler.post(artistRunnable);
				}
			};

			new Thread(glideRunnable).start();

		} catch (IllegalStateException e) {
			e.printStackTrace();
			if (artistTarget != null) Glide.with(context).clear(artistTarget);
		}
	}

	/*
	 * Callbacks
	 */

	/* Notification Image Callback */
	private SimpleTarget<Drawable> notificationTaget = new SimpleTarget<Drawable>() {
		@Override
		public void onResourceReady(Drawable resource, Transition<? super Drawable> transition) {
			if (resource instanceof BitmapDrawable) {
				notificationBitmapDrawable = (BitmapDrawable) resource;
				notificationImage = notificationBitmapDrawable.getBitmap() != null ? notificationBitmapDrawable.getBitmap() : placeholder;

				if (notificationBuilder != null) {
					notificationBuilder.setLargeIcon(notificationImage);
					if (notificationManager == null) notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
					if (isNotificationLoaded) notificationManager.notify(NOTIFICATION_ID, notificationBuilder.build());

				}

			}
		}
	};

	/* Metadata / Media Session Image Callback */
	private SimpleTarget<Drawable> metadataTarget = new SimpleTarget<Drawable>() {
		@Override
		public void onResourceReady(Drawable resource, Transition<? super Drawable> transition) {
			if (resource instanceof BitmapDrawable) {

				resetMetadata();
				glideImageMediaSessionCache = true;
				metadataBitmapDrawable = (BitmapDrawable) resource;
				metadataImage = metadataBitmapDrawable.getBitmap() != null ? metadataBitmapDrawable.getBitmap() : placeholder;
				updateMetaData(getCurrentMedia());
			}
		}
	};

	/* Playback actions callback */
	private PendingIntent playbackAction(PlaybackStatus action) {
		Intent playbackAction = new Intent(this, MediaPlayerService.class);

		switch (action) {
			case PLAY:
				playbackAction.setAction(ACTION_PLAY);
				return PendingIntent.getService(this, 0, playbackAction, 0);

			case PAUSE:
				playbackAction.setAction(ACTION_PAUSE);
				return PendingIntent.getService(this, 0, playbackAction, 0);

			case NEXT:
				playbackAction.setAction(ACTION_NEXT);
				return PendingIntent.getService(this, 0, playbackAction, 0);


			case PREV:
				playbackAction.setAction(ACTION_PREVIOUS);
				return PendingIntent.getService(this, 0, playbackAction, 0);


			case STOP:
				playbackAction.setAction(ACTION_STOP);
				return PendingIntent.getService(this, 0, playbackAction, 0);

			case REC:
				playbackAction.setAction(ACTION_RECORDING);
				return PendingIntent.getService(this, 0, playbackAction, 0);

			default:
			break;
		}

		return null;
	}


	/* Actions (onStartCommand) callback */
	private void handleIncomingActions(Intent playbackAction) {

		if (playbackAction == null || playbackAction.getAction() == null) return;

		String actionString = playbackAction.getAction();
		if (actionString.equalsIgnoreCase(ACTION_PLAY)) {
			requestAudioFocus();
			transportControls.play();

		} else if (actionString.equalsIgnoreCase(ACTION_PAUSE)) {
			removeAudioFocus();
			transportControls.pause();

		} else if (actionString.equalsIgnoreCase(ACTION_NEXT)) {
			transportControls.skipToNext();

		} else if (actionString.equalsIgnoreCase(ACTION_PREVIOUS)) {
			transportControls.skipToPrevious();

		} else if (actionString.equalsIgnoreCase(ACTION_STOP)) {
			removeAudioFocus();
			removeNotification();
			if (mediaSessionCompat != null) {
				mediaSessionCompat.release();
			}
			transportControls.stop();
		} else if (actionString.equalsIgnoreCase(ACTION_RECORDING)) {
			sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_REC");
		}
	}


	/* Media Session Buttons Callbacks */
	private MediaSessionCompat.Callback mediaSessionCallback = new MediaSessionCompat.Callback() {

		@Override
		public boolean onMediaButtonEvent(Intent button) {
			final String mediaButtonAction = button.getAction();
			if (Intent.ACTION_MEDIA_BUTTON.equals(mediaButtonAction)) {
				final KeyEvent event = button.getParcelableExtra(Intent.EXTRA_KEY_EVENT);
				final int eventRepeatCount = event.getRepeatCount();
				if (event == null) return super.onMediaButtonEvent(button);
				if (eventRepeatCount == 0) mediaKeyCallback(event);
			}

			return super.onMediaButtonEvent(button);
		}

		@Override
		public void onPlay() {
			super.onPlay();
			sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_PLAY");

		}

		@Override
		public void onPause() {
			super.onPause();
			sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_PAUSE");
		}

		@Override
		public void onSkipToNext() {
			super.onSkipToNext();
			sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_NEXT");
		}

		@Override
		public void onSkipToPrevious() {
			super.onSkipToPrevious();
			sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_PREVIOUS");
		}

		@Override
		public void onStop() {
			super.onStop();
			sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_STOP");
			removeNotification();
			removeAudioFocus();
			stopSelf();
			if (mediaSessionCompat != null) {
				mediaSessionCompat.release();
			}
		}

		@Override
		public void onSeekTo(long position) {
			super.onSeekTo(position);
		}
	};


	/* Media Button Callback */
	private void mediaKeyCallback(KeyEvent keyEvent) {
		final int keyCode = keyEvent.getKeyCode();
		final int keyAction = keyEvent.getAction();
		final Media media = getCurrentMedia();
		if (keyAction == KeyEvent.ACTION_DOWN) {
			switch (keyCode) {
				case KeyEvent.KEYCODE_HEADSETHOOK:
					sendEvent(PLAYER_SERVICE_KEY, "MEDIA_BUTTON");
				break;

				case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
					sendEvent(PLAYER_SERVICE_KEY, media.isPlaying() ? "NOTIFICATION_PAUSE" : "NOTIFICATION_PLAY");
				break;

				case KeyEvent.KEYCODE_MEDIA_NEXT:
					sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_NEXT");
				break;

				case KeyEvent.KEYCODE_MEDIA_PREVIOUS:
					sendEvent(PLAYER_SERVICE_KEY, "NOTIFICATION_PREVIOUS");
				break;
			}
		}
	}


	private void resetMetadata() {
		metadataImage = null;
		glideImageMediaSessionCache = false;
	}


	private void updateMetaData(Media media) {
		if (media == null) media = getCurrentMedia();
		Intent intent = new Intent();
		intent.setAction("com.android.music.metachanged");
		Bundle bundle = new Bundle();

		if (media.getInfo() != null && !media.getInfo().equals("")) {
			bundle.putString("track", media.getTitle());
			bundle.putString("artist", media.getArtist());
		}

		bundle.putLong("duration", media.getDuration());
		bundle.putLong("position", media.getPosition());
		bundle.putBoolean("playing", media.isPlaying());
		bundle.putString("scrobbling_source", "br.com.vagalume.fm");
		intent.putExtras(bundle);
		context.sendBroadcast(intent);

		playBackStateBuilder.setExtras(bundle);
		int state = media.isPlaying() ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
		playBackStateBuilder.setState(state, 0, 0); //SystemClock.elapsedRealtime()

		// Update the current metadata
		PlaybackStateCompat playBackState = playBackStateBuilder.build();
		//mediaSessionCompat.setPlaybackState(null);
		if (mediaSessionCompat != null) {
			mediaSessionCompat.setPlaybackState(playBackState);
			mediaSessionCompat.setMetadata(createMetadata(media).build());
		}
	}

	public Class getMainActivityClass() {
		try {
			Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
			String className = launchIntent.getComponent().getClassName();

			if (className == null) return null;

			return Class.forName(className);

		} catch (Exception e) {
			return null;
		}
	}

}
