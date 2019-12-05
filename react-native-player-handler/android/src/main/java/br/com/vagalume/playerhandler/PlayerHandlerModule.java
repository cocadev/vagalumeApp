package br.com.vagalume.playerhandler;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.LifecycleEventListener;

import android.os.IBinder;
import android.app.Activity;
import android.content.ServiceConnection;
import android.content.Intent;
import android.content.Context;
import android.content.ComponentName;

import android.util.Log;

public class PlayerHandlerModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

	public static ReactApplicationContext ctx = null;

	private MediaPlayerService player;
	private NotificationUtils notificationUtils;
	boolean serviceBound = false;

	//Binding this Client to the AudioPlayer Service
	private ServiceConnection serviceConnection = new ServiceConnection() {
		@Override
		public void onServiceConnected(ComponentName name, IBinder service) {
			// We've bound to LocalService, cast the IBinder and get LocalService instance
			MediaPlayerService.LocalBinder binder = (MediaPlayerService.LocalBinder) service;
			player = binder.getService();
			serviceBound = true;
		}

		@Override
		public void onServiceDisconnected(ComponentName name) {
			serviceBound = false;
		}
	};

	public PlayerHandlerModule(ReactApplicationContext reactContext) {
		super(reactContext);
		ctx = reactContext;
		notificationUtils = new NotificationUtils(ctx);
		reactContext.addLifecycleEventListener(this);
	}

	@ReactMethod
	public void startService() {
		//Check is service is active
		if (!serviceBound) {
			Activity activity = getCurrentActivity();
			if (activity == null) { return; }

			Intent playerIntent = new Intent(activity, MediaPlayerService.class);
			playerIntent.putExtra("appName", "Vagalume.FM");
			activity.startService(playerIntent);
			activity.bindService(playerIntent, serviceConnection, Context.BIND_AUTO_CREATE | Context.BIND_IMPORTANT);
		}
	}

	@ReactMethod
	public void buildNotification(ReadableMap params) {
		if (serviceBound) {
			String title = params.hasKey("title") ? params.getString("title") : null;
			String artist = params.hasKey("artist") ? params.getString("artist") : null;
			String info = params.hasKey("info") ? params.getString("info") : null;
			String artwork = params.hasKey("artwork") ? params.getString("artwork") : null;
			String artistArtwork = params.hasKey("artistArtwork") ? params.getString("artistArtwork") : null;
			Long duration = params.hasKey("duration") ? (long)params.getDouble("duration") : 0;
			Long position = params.hasKey("position") ? (long)params.getDouble("position") : 0;
			boolean isPlaying = params.hasKey("isPlaying") ? params.getBoolean("isPlaying") : false;
			boolean isRecording = params.hasKey("isRecording") ? params.getBoolean("isRecording") : false;

			// Default: PLAYER_TYPE.STREAM
			int playerType = params.hasKey("playerType") ? params.getInt("playerType") : 1;
			
			try {
				if (player != null) {
					player.buildNotification(new Media(
						title,
						artist,
						info,
						artwork,
						artistArtwork,
						duration,
						position,
						isPlaying,
						isRecording,
						playerType)
					);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}

	@ReactMethod
	public void stopService() {
		removeService();
	}

	@ReactMethod
	public void openNotificationSettings() {
		notificationUtils.openNotificationSettings();
	}

	@ReactMethod
	public void openSettings() {
		notificationUtils.openSettings();
	}

	@ReactMethod
	public void isNotificationEnabled(Callback callback) {
		callback.invoke(notificationUtils.isNotificationEnabled());
	}

	@Override
	public String getName() {
		return "PlayerHandler";
	}

	@Override
	public void onHostResume() {
	}

	@Override
	public void onHostPause() {
	}

	@Override
	public void onHostDestroy() {
		if (player != null) { player.sendStopAction(); }
		removeService();
	}

	private void removeService() {
		try{
			Activity activity = getCurrentActivity();
			if (activity == null || serviceConnection == null) return;

			if (serviceBound && activity != null) {
				activity.unbindService(serviceConnection);
				player.stopSelf();
				serviceBound = false;
			}
		} catch (IllegalArgumentException e) {
			e.printStackTrace();
		}
	}
}
