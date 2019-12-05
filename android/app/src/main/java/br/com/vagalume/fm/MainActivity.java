package br.com.vagalume.fm;

import android.content.Intent;
import android.content.res.Configuration;
import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.modules.storage.ReactDatabaseSupplier;
import org.devio.rn.splashscreen.SplashScreen;

import android.util.Log;
import android.app.Service;
import android.content.ServiceConnection;
import android.content.ComponentName;
import android.os.IBinder;
import android.os.Binder;
import com.bugsnag.BugsnagReactNative;
import br.com.vagalume.chromecast.ChromecastManager;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;
import android.content.Context;

public class MainActivity extends ReactActivity {
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */

    /*
     * 30MB em bytes
     * O padrão é 6MB: https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/modules/storage/ReactDatabaseSupplier.java#L48
     */
    private long mMaximumDatabaseSize =  30000000;

    @Override
    protected String getMainComponentName() {
        return "VagalumeFM";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.show(this);
        super.onCreate(savedInstanceState);
        BugsnagReactNative.start(this);

        try {
          if (isPlayServicesAvailable(this)) new ChromecastManager(this);
          ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(mMaximumDatabaseSize);
        } catch(Exception e) {
          e.printStackTrace();
        }
    }

    @Override
      public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        Intent intent = new Intent("onConfigurationChanged");
        intent.putExtra("newConfig", newConfig);
        this.sendBroadcast(intent);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        MainApplication.getCallbackManager().onActivityResult(requestCode, resultCode, data);
    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    @Override
    protected void onRestart() {
        super.onRestart();
    }

    @Override
    protected void onPause() {
        SplashScreen.hide(this);
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
    }

    @Override
    protected void onPostResume() {
        super.onPostResume();
    }

    @Override
    public void onDestroy() {
      super.onDestroy();
    }

	@Override
	public void invokeDefaultOnBackPressed() {
		moveTaskToBack(true);
	}

    private boolean isPlayServicesAvailable(Context context) {
        return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS;
    }

}
