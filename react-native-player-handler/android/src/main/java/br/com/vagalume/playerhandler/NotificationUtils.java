package br.com.vagalume.playerhandler;

import android.support.v4.app.NotificationManagerCompat;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.net.Uri; 
import android.util.Log;
import android.provider.Settings;

public class NotificationUtils {

	Context context;

	public NotificationUtils(Context context) {
		this.context = context;
	}

	public boolean isNotificationEnabled() {
		return NotificationManagerCompat.from(context).areNotificationsEnabled();
	}

	public void openNotificationSettings() {
		Intent intent;

		try {
			intent = new Intent();
			intent.setAction("android.settings.APP_NOTIFICATION_SETTINGS");
			intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS); 

			if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP && 
				android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.N) {
				
				intent.putExtra("app_package", context.getPackageName());
				intent.putExtra("app_uid", context.getApplicationInfo().uid);

			} else if (android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.KITKAT) {
				intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, 
					Uri.fromParts("package", context.getPackageName(), null));

			} else {
				intent.putExtra("android.provider.extra.APP_PACKAGE", context.getPackageName());

			}

			context.startActivity(intent);

		} catch (Exception e) {

			intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, 
				Uri.fromParts("package", context.getPackageName(), null));
			intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS); 
  			context.startActivity(intent); 
		}
	}

	public void openSettings() {
		Intent intent;

		try {
			intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, 
				Uri.fromParts("package", context.getPackageName(), null));
			intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS); 
  			context.startActivity(intent); 
  			
		} catch (Exception e) {
			
		}
	}

}