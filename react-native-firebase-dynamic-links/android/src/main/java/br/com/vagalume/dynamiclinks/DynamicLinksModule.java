package br.com.vagalume.dynamiclinks;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.LifecycleEventListener;

import com.google.firebase.appinvite.FirebaseAppInvite;
import com.google.firebase.dynamiclinks.FirebaseDynamicLinks;
import com.google.firebase.dynamiclinks.PendingDynamicLinkData;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import android.support.annotation.NonNull;
import android.net.Uri;

import android.os.IBinder;
import android.app.Activity;
import android.content.ServiceConnection;
import android.content.Intent;
import android.content.Context;
import android.content.ComponentName;

import android.util.Log;

public class DynamicLinksModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

	public static ReactApplicationContext ctx = null;

	public DynamicLinksModule(ReactApplicationContext reactContext) {
		super(reactContext);
		ctx = reactContext;
		reactContext.addLifecycleEventListener(this);
	}

	@ReactMethod
	public void subscribe() {
		final Activity activity = getCurrentActivity();

		if (activity != null) {
			FirebaseDynamicLinks.getInstance()
	        .getDynamicLink(activity.getIntent())
	        .addOnSuccessListener(activity, new OnSuccessListener<PendingDynamicLinkData>() {
	            @Override
	            public void onSuccess(PendingDynamicLinkData pendingDynamicLinkData) {
	                Uri deepLink = null;
	                if (pendingDynamicLinkData != null) {
	                    deepLink = pendingDynamicLinkData.getLink();

						Intent intent = activity.getIntent();
						Uri data = intent.getData();

						if (data == null) {
							ctx
							.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
							.emit("dynamicLinks", String.valueOf(deepLink));
						}
	                }

	            }
	        })
	        .addOnFailureListener(activity, new OnFailureListener() {
	            @Override
	            public void onFailure(@NonNull Exception e) {
	                Log.w("Dynamic Links", "getDynamicLink:onFailure", e);
	            }
	        });
		}
	}

	@Override
	public String getName() {
		return "DynamicLinks";
	}

	@Override
	public void onHostResume() {
	}

	@Override
	public void onHostPause() {
	}

	@Override
	public void onHostDestroy() {
	}
}
