package br.com.vagalume.chromecast;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import android.util.Log;
import com.facebook.react.bridge.UiThreadUtil;
import android.os.Handler;

/**
 * Created by rmagalhaes on 12/05/17.
 */

public class ChromecastModule extends ReactContextBaseJavaModule implements LifecycleEventListener {
	public static ReactApplicationContext reactContext = null;
	private Handler mainHandler;


	public ChromecastModule(final ReactApplicationContext reactContext) {
		super(reactContext);
		this.reactContext = reactContext;
		final ReactApplicationContext context = reactContext;
		reactContext.addLifecycleEventListener(this);
	}

	@Override
	public String getName() {
		return "Chromecast";
	}

	@Override
	public void onHostResume() {

	}

	@Override
	public void onHostPause() {

	}

	@Override
	public void onHostDestroy() {
		UiThreadUtil.runOnUiThread(new Runnable() {

			public void run() {
				try{
					ChromecastManager.removeCallback();
				} catch (NullPointerException exception) {
					exception.printStackTrace();
				}
			}
		});
	}


	@ReactMethod
	public void connectionStatus(final Callback cb){
		UiThreadUtil.runOnUiThread(new Runnable() {
			public void run() {
				try {
					cb.invoke(ChromecastManager.connectionStatus());
				} catch (NullPointerException exception) {
				}
			}
		});
	}


	@ReactMethod
	public void getAvailableDevices(final Callback cb){
		Handler mainHandler = new Handler(reactContext.getMainLooper());
		Runnable runnable = new Runnable() {
			@Override
			public void run() {
				try {
					cb.invoke(ChromecastManager.getAvailableDevices());
				} catch (NullPointerException exception) {
				}
			}
		};

		mainHandler.post(runnable);
	}

	@ReactMethod
	public void connectToDevice(ReadableMap params) {
		final String deviceId = params.hasKey("id") ? params.getString("id") : null;


		UiThreadUtil.runOnUiThread(new Runnable() {
			public void run() {
				try{
					ChromecastManager.connectToDevice(deviceId);
				} catch (NullPointerException exception) {
				}
			}
		});
	}

	@ReactMethod
	public void disconnectToDevice(){
		UiThreadUtil.runOnUiThread(new Runnable() {
			public void run() {
				try{
					ChromecastManager.disconnectToDevice();
				} catch (NullPointerException exception) {
				}
			}
		});
	}

	@ReactMethod
	public void getSelectedDevice(final Callback cb) {
		UiThreadUtil.runOnUiThread(new Runnable() {
			public void run() {
				try {
					cb.invoke(ChromecastManager.getSelectedDevice());
				} catch (NullPointerException exception) {
				}
			}
		});
	}

	@ReactMethod
	public void getSelectedDeviceId(final Callback cb) {
		UiThreadUtil.runOnUiThread(new Runnable() {
			public void run() {
				try {
					cb.invoke(ChromecastManager.getSelectedDeviceId());
				} catch (NullPointerException exception) {
				}
			}
		});
	}

	@ReactMethod
	public void isConnected(final Callback cb) {
		UiThreadUtil.runOnUiThread(new Runnable() {
			public void run() {
				try {
					cb.invoke(ChromecastManager.isConnected());
				} catch (NullPointerException exception) {
				}
			}
		});
	}

	@ReactMethod
	public void play() {
		UiThreadUtil.runOnUiThread(new Runnable() {
			public void run() {
				try {
					ChromecastManager.play();
				} catch (NullPointerException exception) {
				}
			}
		});
	}

	@ReactMethod
	public void pause() {
		UiThreadUtil.runOnUiThread(new Runnable() {
			public void run() {
				try{
					ChromecastManager.pause();
				} catch (NullPointerException exception) {
				}
			}
		});
	}

	@ReactMethod
	public void sendMedia(ReadableMap params) {

		if(params != null){
			try {
				final String station = params.hasKey("station") ? params.getString("station") : null;
				final boolean isPlaying = params.hasKey("isPlaying") ? params.getBoolean("isPlaying") : false;
				UiThreadUtil.runOnUiThread(new Runnable() {
					public void run() {
						ChromecastManager.castMedia(new Stream(
							  station,
							  isPlaying
							));
					}
				});
			} catch (NumberFormatException error) {
				return;
			} catch (NullPointerException exception) {
			}
		}
	}

	@ReactMethod
	public void fireGetCurrentStation() {
		try {
			UiThreadUtil.runOnUiThread(new Runnable() {
				public void run() {
					ChromecastManager.fireGetCurrentStation();
				}
			});
		} catch (NullPointerException exc) {
			exc.printStackTrace();
		}

	}


}
