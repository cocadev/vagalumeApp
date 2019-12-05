package br.com.vagalume.fm;

import android.app.Application;
import android.util.Log;

import com.facebook.react.ReactApplication;
/*import com.dylanvann.fastimage.FastImageViewPackage;*/
import io.invertase.firebase.RNFirebasePackage;
import com.dieam.reactnativepushnotification.ReactNativePushNotificationPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.zmxv.RNSound.RNSoundPackage;
import com.airbnb.android.react.lottie.LottiePackage;
import com.github.yamill.orientation.OrientationPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.idehub.GoogleAnalyticsBridge.GoogleAnalyticsBridgePackage;
import com.rnfs.RNFSPackage;
import com.ocetnik.timer.BackgroundTimerPackage;
import com.bugsnag.BugsnagReactNative;
import com.facebook.FacebookSdk;
import com.facebook.CallbackManager;
import com.facebook.appevents.AppEventsLogger;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import br.com.vagalume.aacplayer.AACPlayerPackage;
import br.com.vagalume.chromecast.ChromecastPackage;
import br.com.vagalume.playerhandler.PlayerHandlerPackage;
import br.com.vagalume.dynamiclinks.DynamicLinksPackage;
import br.com.vagalume.mediaplayer.MediaPlayerPackage;
import br.com.vagalume.exoplayer2.ExoPlayer2Package;
import org.devio.rn.splashscreen.SplashScreenReactPackage;
import br.com.vagalume.widget.WidgetPackage;
import com.facebook.soloader.SoLoader;

import io.invertase.firebase.analytics.RNFirebaseAnalyticsPackage; // Firebase Analytics
import io.invertase.firebase.auth.RNFirebaseAuthPackage; // Firebase Auth
import io.invertase.firebase.config.RNFirebaseRemoteConfigPackage; // Firebase Remote Config
import io.invertase.firebase.crash.RNFirebaseCrashPackage; // Firebase Crash Reporting
import io.invertase.firebase.database.RNFirebaseDatabasePackage; // Firebase Realtime Database
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage; // Firebase Cloud Messaging
import io.invertase.firebase.perf.RNFirebasePerformancePackage; // Firebase Performance
import io.invertase.firebase.storage.RNFirebaseStoragePackage; // Firebase Storage
import io.invertase.firebase.fabric.crashlytics.RNFirebaseCrashlyticsPackage; // Crashlytics

import java.util.Arrays;
import java.util.List;

import android.support.multidex.MultiDex;
import android.content.Context;
import android.os.Build;

public class MainApplication extends Application implements ReactApplication {

    private static CallbackManager mCallbackManager = CallbackManager.Factory.create();

    protected static CallbackManager getCallbackManager() {
        return mCallbackManager;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        FacebookSdk.sdkInitialize(getApplicationContext());
        // If you want to use AppEventsLogger to log events.
        AppEventsLogger.activateApp(this);

		SoLoader.init(this, /* native exopackage */ false);

    }

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {

        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }

        @Override
        protected List<ReactPackage> getPackages() {
            return Arrays.<ReactPackage>asList(
            new MainReactPackage(),
            /*new FastImageViewPackage(),*/
            new ReactNativePushNotificationPackage(),
            new VectorIconsPackage(),
            new RNDeviceInfo(),
            new RNSoundPackage(),
            new LottiePackage(),
            new OrientationPackage(),
            new LinearGradientPackage(),
            new GoogleAnalyticsBridgePackage(),
            new RNFSPackage(),
            new BackgroundTimerPackage(),
            BugsnagReactNative.getPackage(),
            new AACPlayerPackage(),
            new MediaPlayerPackage(),
            new ExoPlayer2Package(),
            new PlayerHandlerPackage(),
			new DynamicLinksPackage(),
            new SplashScreenReactPackage(),
            new WidgetPackage(),
            new ChromecastPackage(),
			new RNFirebasePackage(),
			new RNFirebaseAnalyticsPackage(),
			new RNFirebaseAuthPackage(),
			new RNFirebaseRemoteConfigPackage(),
			new RNFirebaseCrashPackage(),
			new RNFirebaseDatabasePackage(),
			new RNFirebaseMessagingPackage(),
			new RNFirebasePerformancePackage(),
			new RNFirebaseStoragePackage(),
            new RNFirebaseCrashlyticsPackage()
            );
        }
    };

	@Override
    protected void attachBaseContext(Context context) {
		super.attachBaseContext(context);
        MultiDex.install(this);
    }

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }
}
