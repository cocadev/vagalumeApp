package br.com.vagalume.chromecast;

import android.content.Context;
import android.support.v7.media.MediaRouter;
import com.google.android.gms.cast.MediaInfo;
import android.util.Log;
import com.google.android.gms.cast.Cast;
import com.google.android.gms.cast.framework.CastContext;
import com.google.android.gms.cast.framework.CastSession;
import com.google.android.gms.cast.framework.SessionManager;
import android.support.v7.media.MediaRouteSelector;
import com.google.android.gms.cast.framework.SessionManagerListener;
import com.google.android.gms.cast.framework.media.RemoteMediaClient;
import com.google.android.gms.common.images.WebImage;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.google.android.gms.common.api.ResultCallback;
import com.google.android.gms.common.api.Status;
import com.google.android.gms.cast.MediaMetadata;
import org.json.JSONArray;
import org.json.JSONException;
import com.google.android.gms.cast.CastDevice;
import org.json.JSONObject;
import java.util.HashMap;
import java.io.IOException;
import com.google.android.gms.cast.CastMediaControlIntent;
import android.media.AudioManager;
import android.app.Activity;

/**
 * Created by rmagalhaes on 16/05/17.
 */

public class ChromecastManager {

	private static final String LIB_TAG = "chromecast.vagalume.FM";

	// Private variables
	private static Context context;
	private static CastContext castContext;
	private static CastSession castSession;
	private static MediaRouter mediaRouter;
	private static MediaRouteSelector mediaRouteSelector;
	private static CastDevice castDevice;
	private static SessionManager sessionManager;
	private SessionManagerListener<CastSession> castSessionManagerListener = new CastSessionManagerListener();;
	private static MediaRouter.Callback mediaRouterCallback;
	private static HashMap<String, MediaRouter.RouteInfo> routesInfo;
	private static RemoteMediaClient remoteMediaClient;
	private String devicesString;



	// MEDIA PLAYER EVENTS
	private static final String PLAY_MUSIC = "chromecast.PLAY";
	private static final String PAUSE_MUSIC = "chromecast.PAUSE";


	// Content type of HLS/m3u8
	private static final String CONTENT_TYPE = "application/x-mpegurl";


	// Events
	private PlayerChannel playerChannel = new PlayerChannel();
	private MusicChannel musicChannel = new MusicChannel();
	private StationChannel stationChannel = new StationChannel();
	private ActionPlayerChannel actionPlayerChannel = new ActionPlayerChannel();
	private ActionMusicChannel actionMusicChannel = new ActionMusicChannel();
	private ActionStationChannel actionStationChannel = new ActionStationChannel();

	private static final String EVENT_PLAYER_STATUS = "chromecast.vagalume.fm.player";
	private static final String EVENT_MUSIC = "chromecast.vagalume.fm.music";
	private static final String EVENT_STATION = "chromecast.vagalume.fm.station";
	private static final String EVENT_STATUS = "chromecast.vagalume.fm.session";
	private static final String EVENT_CURRENT_STATION = "chromecast.vagalume.fm.action.station";


	// Constructor
	public ChromecastManager(Context context) {
		this.context = context;

		if (context instanceof Activity) {
				try {
						// initialize the CastContext in each Activity’s
						castContext = CastContext.getSharedInstance(context);

						// initialize the SessionManager with CastContext SessionManager
						sessionManager = castContext.getSessionManager();

						// initialize the MediaRouter
						mediaRouter = MediaRouter.getInstance(context);

						// Add SessionManagerListener to SessionManager
						sessionManager.addSessionManagerListener(castSessionManagerListener, CastSession.class);

						// initialize the cast session
						castSession = castContext.getSessionManager().getCurrentCastSession();


						// initialize the MediaRouterCallback
						mediaRouterCallback = new MediaRouterCallBack();

						// Added callback
						addCallback();
				}catch(Exception e) {
						e.printStackTrace();
				}
		}
	}

	// Add callback to show Devices
	private void addCallback() {
		mediaRouter.addCallback(castContext.getMergedSelector(), mediaRouterCallback, MediaRouter.CALLBACK_FLAG_REQUEST_DISCOVERY);

	}

	// Remove callback
	public static void removeCallback() {
		if(mediaRouterCallback != null) {
			mediaRouter.removeCallback(mediaRouterCallback);
		}
	}

	// Return available devices in array of JSONstringify format
	public static String getAvailableDevices() {
		JSONArray devicesJSONArray = new JSONArray();
		routesInfo = new HashMap<>();

		if (routesInfo != null) {
			// Check if have devices added previously
			if (routesInfo.isEmpty()) {
				for (MediaRouter.RouteInfo media : mediaRouter.getRoutes()) {
					devicesJSONArray.put(parseMediaToJSON(media));
					routesInfo.put(media.getId(), media);
				}

			} else {
				for (String id : routesInfo.keySet()) {
					MediaRouter.RouteInfo media = routesInfo.get(id);
					devicesJSONArray.put(parseMediaToJSON(media));
				}
			}

		}

		return devicesJSONArray.toString();
	}


	// Parse media info to JSON Object
	private static JSONObject parseMediaToJSON(MediaRouter.RouteInfo media) {
		JSONObject deviceInfo = new JSONObject();

		try {
			deviceInfo.put("id", media.getId());
			deviceInfo.put("name", media.getName());
			deviceInfo.put("description", media.getDescription());
			deviceInfo.put("iconUri", media.getIconUri());
			deviceInfo.put("connecting", media.isConnecting());
			deviceInfo.put("enabled", media.isEnabled());
			deviceInfo.put("connectionState", media.getConnectionState());
			deviceInfo.put("canDisconnect", media.canDisconnect());
			deviceInfo.put("playbackType", media.getPlaybackType());
			deviceInfo.put("playbackStream", media.getPlaybackStream());
			deviceInfo.put("deviceType", media.getDeviceType());
			deviceInfo.put("volumeHandling", media.getVolumeHandling());
			deviceInfo.put("volume", media.getVolume());
			deviceInfo.put("volumeMax", media.getVolumeMax());
			deviceInfo.put("presentationDisplayId", media.getPresentationDisplay());
			deviceInfo.put("settingsIntent", media.getSettingsIntent());
			deviceInfo.put("providerPackageName", media.getProvider().getPackageName());
			deviceInfo.put("extras", media.getExtras());
		} catch (JSONException e) {
			e.printStackTrace();
		}

		return deviceInfo;
	}

	// Connections
	public static void connectToDevice(String deviceID) {
		mediaRouter.selectRoute(routesInfo.get(deviceID));
	}

	public static void disconnectToDevice() {
		castContext.getSessionManager().endCurrentSession(true);
		mediaRouter.unselect(0);
		mediaRouter.selectRoute(MediaRouter.getInstance(context).getDefaultRoute());
	}

	public static String connectionStatus() {
		String status = "NO_DEVICES_AVAILABLE";
		//final int NO_DEVICES_AVAILABLE = 1; (Default)
		final int NOT_CONNECTED = 2;
		final int CONNECTING = 3;
		final int CONNECTED = 4;
		switch (castContext.getCastState()) {
			case NOT_CONNECTED:
				status = "NOT_CONNECTED";
				break;
			case CONNECTING:
				status = "CONNECTING";
				break;
			case CONNECTED:
				fireOnSenderConnected("CONNECTED");
				status = "CONNECTED";
				break;
			default:
				break;
		}

		return status;
	}

	//Return true if cast is online
	public static boolean isConnected() {
		final int CONNECTED = 4;
		return castContext.getCastState() == CONNECTED ? true : false;
	}

	// Return name of device connected
	public static String getSelectedDevice() {
		return mediaRouter.getSelectedRoute().getName();
	}

	// Return id of device connected
	public static String getSelectedDeviceId() {
		return mediaRouter.getSelectedRoute().getId();
	}

	// Cast Media
	public static void castMedia(Stream stream){
		// If device is not connected return statement
		if (!(isConnected())) { return; }
		if (stream.getEvent() == null) { return; }

		sendStationEvent(stream.getEvent());
	}

	private static void requestAudioFocus() {
		AudioManager mAudioManager;
  		mAudioManager = (AudioManager) context.getSystemService(context.AUDIO_SERVICE);
        mAudioManager.adjustSuggestedStreamVolume(AudioManager.ADJUST_SAME,
                AudioManager.STREAM_MUSIC, AudioManager.FLAG_SHOW_UI);
	}

	public static void sendStationEvent(String event) {
		final String customChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.event.station";

		try {
			castSession.sendMessage(customChannelNamespace, event)
				.setResultCallback(
					new ResultCallback<Status>() {
						@Override
						public void onResult(Status result) {
							if (!result.isSuccess()) {
							}
						}
					});
		} catch(Exception error) {
		}

	}

	public static void sendPlayerEvent(String event){
		final String customChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.event.player";

		try {
			castSession.sendMessage(customChannelNamespace, event)
				.setResultCallback(
					new ResultCallback<Status>() {
						@Override
						public void onResult(Status result) {
							if (!result.isSuccess()) {
							}
						}
					});
		} catch(Exception error) {
		}
	}

	public static void fireOnSenderConnected(String event) {
		final String customChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.event.onSenderConnected";

		try {
			castSession.sendMessage(customChannelNamespace, event)
				.setResultCallback(
					new ResultCallback<Status>() {
						@Override
						public void onResult(Status result) {
							if (!result.isSuccess()) {
							}
						}
					});
		} catch(Exception error) {
		}

	}

	private static void fireGetStation(String event) {
		final String customChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.action.station";

		try {
			castSession.sendMessage(customChannelNamespace, event)
				.setResultCallback(
					new ResultCallback<Status>() {
						@Override
						public void onResult(Status result) {
							if (!result.isSuccess()) {
							}
						}
					});
		} catch(Exception error) {
		}
	}

	private static void fireGetMusic(String event) {
		final String customChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.action.music";

		try {
			castSession.sendMessage(customChannelNamespace, event)
				.setResultCallback(
					new ResultCallback<Status>() {
						@Override
						public void onResult(Status result) {
							if (!result.isSuccess()) {
							}
						}
					});
		} catch(Exception error) {
		}
	}

	private static void fireGetPlayer(String event) {
		final String customChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.action.player";

		try {
			castSession.sendMessage(customChannelNamespace, event)
				.setResultCallback(
					new ResultCallback<Status>() {
						@Override
						public void onResult(Status result) {
							if (!result.isSuccess()) {
							}
						}
					});
		} catch(Exception error) {
		}
	}


	public static void fireGetCurrentStation() {
		if (!(isConnected())) { return; }

		fireGetStation("station");
	}

	public static void play(){
		// If device is not connected return statement
		if (!(isConnected())) { return; }

		// Send event via custom channel
		sendPlayerEvent(PLAY_MUSIC);
	}

	public static void pause(){
		// If device is not connected return statement
		if (!(isConnected())) { return; }

		// Send event via custom channel
		sendPlayerEvent(PAUSE_MUSIC);

	}

   	private static void setCastSession(CastSession session) {
        castSession = session;
    }

	// Send events to react
	private static void sendEventToReact(String eventName, String eventResponse) {
		try {
			ChromecastModule.reactContext
				.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
				.emit(eventName, eventResponse);
		} catch (Exception e) {
		}
	}


	/**
	 * (non-Javadoc)
	 * Internal class
	 * CastSessionManagerListener
	 */
	private class MediaRouterCallBack extends MediaRouter.Callback {
		@Override
		public void onRouteSelected(MediaRouter router, MediaRouter.RouteInfo route) {
			castDevice = CastDevice.getFromBundle(route.getExtras());
			sendEventToReact(EVENT_STATUS, "onRouteSelected");
		}

		@Override
		public void onRouteUnselected(MediaRouter router, MediaRouter.RouteInfo route, int reason) {
			castDevice = null;
			sendEventToReact(EVENT_STATUS, "onRouteUnselected");
		}

		@Override
		public void onRouteAdded(MediaRouter router, MediaRouter.RouteInfo route) {
			synchronized (this) {
				sendEventToReact(EVENT_STATUS, "onRouteAdded");
			}
		}

		@Override
		public void onRouteRemoved(MediaRouter router, MediaRouter.RouteInfo route) {
			synchronized (this) {
				if (routesInfo != null) {
					if(routesInfo.containsKey(route.getId())) {
						routesInfo.remove(route.getId());
						sendEventToReact(EVENT_STATUS, "onRouteRemoved");
						Log.e(LIB_TAG, "onRouteRemoved: "+route.getName()+" ID: "+route.getId());
						return;
					}
				}
			}
		}
	}


	public class CastSessionManagerListener implements SessionManagerListener<CastSession> {

		private void setMusicMessageCallback(CastSession castSession) {
			try {
				castSession.setMessageReceivedCallbacks(musicChannel.getNamespace(), musicChannel);

			} catch (IOException io) {
				sendEventToReact(EVENT_MUSIC, io.getMessage());
			}
		}

		private void setStationMessageCallback(CastSession castSession) {
			try {
				castSession.setMessageReceivedCallbacks(stationChannel.getNamespace(), stationChannel);

			} catch (IOException io) {
				sendEventToReact(EVENT_STATION, io.getMessage());
			}
		}

		private void setPlayerMessageCallback(CastSession castSession) {
			try {
				castSession.setMessageReceivedCallbacks(playerChannel.getNamespace(), playerChannel);

			} catch (IOException io) {
				sendEventToReact(EVENT_PLAYER_STATUS, io.getMessage());
			}
		}

		private void setActionStationCallback(CastSession castSession) {
			try {
				castSession.setMessageReceivedCallbacks(actionStationChannel.getNamespace(), actionStationChannel);

			} catch (IOException io) {
				sendEventToReact(EVENT_PLAYER_STATUS, io.getMessage());
			}
		}

		@Override
		public void onSessionStarting(CastSession castSession) {
			setCastSession(castSession);
			sendEventToReact(EVENT_STATUS, "onSessionStarting");
		}

		@Override
		public void onSessionStarted(CastSession castSession, String s) {
			Log.e(LIB_TAG, "onSessionStarted: "+s);
			setMusicMessageCallback(castSession);
			setStationMessageCallback(castSession);
			setPlayerMessageCallback(castSession);
			setActionStationCallback(castSession);
			setCastSession(castSession);
			fireOnSenderConnected("onSessionStarted");
			sendEventToReact(EVENT_STATUS, "onSessionStarted");
		}

		@Override
		public void onSessionStartFailed(CastSession castSession, int i) {
			sendEventToReact(EVENT_STATUS, "onSessionStartFailed");
			setCastSession(castSession);
		}

		@Override
		public void onSessionEnding(CastSession castSession) {
			sendEventToReact(EVENT_STATUS, "onSessionEnding");
			setCastSession(castSession);
		}

		@Override
		public void onSessionEnded(CastSession castSession, int i) {
			castDevice = null;
			sendEventToReact(EVENT_STATUS, "onSessionEnded");
			setCastSession(castSession);
		}

		@Override
		public void onSessionResuming(CastSession castSession, String s) {
			setCastSession(castSession);
			sendEventToReact(EVENT_STATUS, "onSessionResuming");
		}

		@Override
		public void onSessionResumed(CastSession castSession, boolean b) {
			setMusicMessageCallback(castSession);
			setStationMessageCallback(castSession);
			setPlayerMessageCallback(castSession);
			setActionStationCallback(castSession);
			setCastSession(castSession);
			fireOnSenderConnected("onSessionResumed");
			sendEventToReact(EVENT_STATUS, "onSessionResumed");
		}

		@Override
		public void onSessionResumeFailed(CastSession castSession, int i) {
			sendEventToReact(EVENT_STATUS, "onSessionResumeFailed");
			setCastSession(castSession);
		}

		@Override
		public void onSessionSuspended(CastSession castSession, int i) {
			sendEventToReact(EVENT_STATUS, "onSessionSuspended");
			setCastSession(castSession);
		}


	}

	/**
	 * Set listen for Media Status
	 *
	 */
	public class MusicChannel implements Cast.MessageReceivedCallback {

		private String musicChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.event.music";

		public String getNamespace() {
			return musicChannelNamespace;
		}

		@Override
		public void onMessageReceived(CastDevice castDevice, String namespace, String message) {

			sendEventToReact(EVENT_MUSIC, message);
		}
	}

	public class StationChannel implements Cast.MessageReceivedCallback {

		private String stationChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.event.station";

		public String getNamespace() {
			return stationChannelNamespace;
		}

		@Override
		public void onMessageReceived(CastDevice castDevice, String namespace, String message) {

			sendEventToReact(EVENT_STATION, message);
		}
	}

	public class PlayerChannel implements Cast.MessageReceivedCallback {

		private String playerChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.event.player";

		public String getNamespace() {
			return playerChannelNamespace;
		}

		@Override
		public void onMessageReceived(CastDevice castDevice, String namespace, String message) {

			sendEventToReact(EVENT_PLAYER_STATUS, message);
		}
	}

	//
	public class ActionPlayerChannel implements Cast.MessageReceivedCallback {

		private String actionPlayerChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.action.player";

		public String getNamespace() {
			return actionPlayerChannelNamespace;
		}

		@Override
		public void onMessageReceived(CastDevice castDevice, String namespace, String message) {

		}
	}

	public class ActionMusicChannel implements Cast.MessageReceivedCallback {

		private String actionMusicChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.action.music";

		public String getNamespace() {
			return actionMusicChannelNamespace;
		}

		@Override
		public void onMessageReceived(CastDevice castDevice, String namespace, String message) {

		}
	}

	public class ActionStationChannel implements Cast.MessageReceivedCallback {

		private String actionStationChannelNamespace = "urn:x-cast:fm.vagalume.chromecast.action.station";

		public String getNamespace() {
			return actionStationChannelNamespace;
		}

		@Override
		public void onMessageReceived(CastDevice castDevice, String namespace, String message) {
			sendEventToReact(EVENT_CURRENT_STATION, message);
		}
	}

}
