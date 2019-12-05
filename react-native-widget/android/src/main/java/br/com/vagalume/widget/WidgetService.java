package br.com.vagalume.widget;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import android.app.PendingIntent;
import android.app.Service;
import android.appwidget.AppWidgetManager;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioManager;
import android.os.AsyncTask;
import android.os.Binder;
import android.os.IBinder;
import android.support.annotation.Nullable;
import android.widget.RemoteViews;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import static android.view.View.GONE;
import static android.view.View.VISIBLE;
import android.content.Context;
import android.support.v4.media.session.MediaControllerCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.os.RemoteException;
import android.content.ComponentName;
import android.support.v4.media.session.MediaButtonReceiver;
import android.media.AudioManager;
import android.content.SharedPreferences;

public class WidgetService extends Service implements AudioManager.OnAudioFocusChangeListener {

    // Intent (get obj in onStart)
    Intent intent = null;

    // Load artwork
    private Bitmap artworkImage;
    private String artworkString;
    private LoadBitmap loadBitmap;

    // Actions for intent
    public static final String ACTION_PLAY = "br.com.vagalume.widget.ACTION_PLAY";
    public static final String ACTION_PAUSE = "br.com.vagalume.widget.ACTION_PAUSE";
    public static final String ACTION_PREVIOUS = "br.com.vagalume.widget.ACTION_PREVIOUS";
    public static final String ACTION_NEXT = "br.com.vagalume.widget.ACTION_NEXT";
    public static final String ACTION_STOP = "br.com.vagalume.widget.ACTION_STOP";

    // Transport actions to js
    private MediaControllerCompat.TransportControls transportControls;
    private MediaSessionCompat mediaSession;

    // Audio Manager obj
    private AudioManager audioManager;

    //Control if is first time running app
    private boolean runningApp = true;

    private final IBinder iBinder = new LocalBinder();

    public class LocalBinder extends Binder {
        public WidgetService getService() {
            return WidgetService.this;
        }
    }


    /**
    * Override methods *
    */
	@Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onAudioFocusChange(int focusChange) {

    }

    @SuppressWarnings("deprecation")
    @Override
    public void onStart(Intent intent, int startId) {
    	// Construct the AppWidgetManager
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(this.getApplicationContext());

        // Construct the RemoteViews object
        RemoteViews widgetView = new RemoteViews(this.getApplicationContext().getPackageName(),
                R.layout.widget);

        setIntent(intent);

		try {
			// Get all widgets references
            int[] allWidgetsIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS);

           
            // Call method updateWidgetService
            updateWidgetService(allWidgetsIds,widgetView, appWidgetManager);

        } catch (Exception exception) {
           
            // If report exception, return
            return;
        }

        super.onStart(intent, startId);

    }


    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Override
    public void onDestroy() {
        stopSelf();
        super.onDestroy();
    }

    // On destroy main, change widget view
    @Override
    public void onTaskRemoved(Intent rootIntent) {
       
        updateClosePreferences(true);
        if (getIntent() != null) {
            // Construct the AppWidgetManager
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(this.getApplicationContext());

            // Construct the RemoteViews object
            RemoteViews widgetView = new RemoteViews(this.getApplicationContext().getPackageName(),
                    R.layout.widget);

            try {
                // Get ids
                int[] getAllWidgetsIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS);
                destroyWidgetService(getAllWidgetsIds, widgetView,  appWidgetManager);

            } catch (Exception exception) {
               
            }

        }
        stopSelf();

    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
       

        // If onTaskRemoved called before
        if (readClosePreferences()) {
             // Construct the AppWidgetManager
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(this.getApplicationContext());

            // Construct the RemoteViews object
            RemoteViews widgetView = new RemoteViews(this.getApplicationContext().getPackageName(),
                    R.layout.widget);

            try {
                // Get ids
                int[] getAllWidgetsIds = intent.getIntArrayExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS);
                destroyWidgetService(getAllWidgetsIds, widgetView,  appWidgetManager);

            } catch (Exception exception) {
                

            }

            // Delete shared prefs
            deleteClosePreferences();

            // Stop service
            stopSelf();

            // Do not recreate the service
            return START_NOT_STICKY;
        }


        // Start media session
        try {
            initMediaSession();
            MediaButtonReceiver.handleIntent(mediaSession, intent);

        } catch (RemoteException e) {
            e.printStackTrace();
            stopSelf();

        }

        handleIncomingActions(intent);
        return super.onStartCommand(intent, flags, startId);

    }

    // Shared prefs to control play pause button (except for Motorola brand)
    private void deleteClosePreferences() {
        SharedPreferences.Editor deletePrefs = this.getApplicationContext().getSharedPreferences(WidgetConfigure.PREFS_NAME, 0).edit();
        deletePrefs.remove(WidgetConfigure.PREF_PREFIX_CLOSE_APP);
        deletePrefs.apply();
    }

    private boolean readClosePreferences() {
        SharedPreferences prefs = this.getApplicationContext().getSharedPreferences(WidgetConfigure.PREFS_NAME, 0);
        return prefs.getBoolean(WidgetConfigure.PREF_PREFIX_CLOSE_APP, false);
    }

    private void updateClosePreferences(boolean param) {
        // Construct SharedPreferences object
        SharedPreferences.Editor prefs = this.getApplicationContext().getSharedPreferences(WidgetConfigure.PREFS_NAME, 0).edit();
        prefs.putBoolean(WidgetConfigure.PREF_PREFIX_CLOSE_APP, param);
        prefs.putBoolean(WidgetConfigure.PREF_PREFIX_KEY_IS_PLAYING, !param);
        prefs.apply();
    }




    // Called by method "public void onStart"
    private void updateWidgetService(int[] allWidgetsIds, RemoteViews views, AppWidgetManager appWidgetManager) {
		// Update all widgets
		for (int widgetId : allWidgetsIds) {
			try {

                // Check if is first run (After power off), if true, change widget to play button and clear onClick options
                if(runningApp) {
                    destroyWidgetService(allWidgetsIds, views, appWidgetManager);

                } else {
    				WidgetModel widgetModel = WidgetConfigure.loadPref(this.getApplicationContext());

    				Bitmap artworkIcon;


                    if (loadBitmap != null) {
                        loadBitmap.cancel();
                        loadBitmap = null;
                    }

                    if (artworkString == null || !(artworkString.equals(widgetModel.getArtwork()))) {
                        artworkImage = null;
                        loadBitmap = new LoadBitmap(widgetModel.getArtwork());
                        loadBitmap.execute();
                    }


    				// Set music, artist, artwork, play and pause buttons in view
    			    if(widgetModel.isPlaying()) {
                        views.setViewVisibility(R.id.status_bar_pause, VISIBLE);
                        views.setViewVisibility(R.id.status_bar_play, GONE);

                    } else {
                        views.setViewVisibility(R.id.status_bar_pause, GONE);
                        views.setViewVisibility(R.id.status_bar_play, VISIBLE);
                    }


                    views.setTextViewText(R.id.widget_title, widgetModel.getTitle());
                    views.setTextViewText(R.id.widget_artist, widgetModel.getArtist());
                    views.setTextViewText(R.id.widget_radio, widgetModel.getInfo());

                    // Get the layout for the App Widget and attach an on-click listener to the view
                    views.setOnClickPendingIntent(R.id.widget_view, returnToMainActivity());
                    views.setOnClickPendingIntent(R.id.status_bar_play, playbackAction(0));
                    views.setOnClickPendingIntent(R.id.status_bar_pause, playbackAction(1));
                    views.setOnClickPendingIntent(R.id.status_bar_next, playbackAction(2));
                    views.setOnClickPendingIntent(R.id.status_bar_prev, playbackAction(3));

                    artworkIcon = artworkImage;
                    if (artworkIcon == null) {
                        artworkIcon = BitmapFactory.decodeResource(getResources(),
                        R.drawable.placeholder);
                    }
                    views.setImageViewBitmap(R.id.widget_album_art, artworkIcon);


    				// Instruct the widget manager to update the widget
                    appWidgetManager.updateAppWidget(widgetId, views);
                }

			} catch (Exception exception) {

                // Set default view
                views = defaultWidgetView(views);

				// Instruct the Widget Manager to update the widget
                appWidgetManager.updateAppWidget(widgetId, views);
			}
		}
        runningApp = false;

    }

    private void destroyWidgetService(int[] allWidgetsIds, RemoteViews views, AppWidgetManager appWidgetManager) {
        // UPdate all widgets
        for (int widgetId : allWidgetsIds) {
            try {
                // Change to play button visible
                views.setViewVisibility(R.id.status_bar_pause, GONE);
                views.setViewVisibility(R.id.status_bar_play, VISIBLE);

                // Change onClick
                views.setOnClickPendingIntent(R.id.widget_view, returnToMainActivity());
                views.setOnClickPendingIntent(R.id.status_bar_pause, returnToMainActivity());
                views.setOnClickPendingIntent(R.id.status_bar_play, returnToMainActivity());
                views.setOnClickPendingIntent(R.id.status_bar_next, returnToMainActivity());
                views.setOnClickPendingIntent(R.id.status_bar_prev, returnToMainActivity());

                appWidgetManager.updateAppWidget(widgetId, views);
            } catch (Exception e) {

                // Set default view
                views = defaultWidgetView(views);

                // Instruct the Widget Manager to update the widget
                appWidgetManager.updateAppWidget(widgetId, views);

            }
        }

    }

    private RemoteViews defaultWidgetView(RemoteViews views) {
       // If widgetModel cause exception (example: nullException caused by getTitle), set empty texts and placeholder in artwork
        views.setTextViewText(R.id.widget_title, "Vagalume.FM");
        views.setTextViewText(R.id.widget_artist, "");
        views.setTextViewText(R.id.widget_radio, "");
        views.setImageViewResource(R.id.widget_album_art, R.drawable.placeholder);
        views.setViewVisibility(R.id.status_bar_pause, GONE);
        views.setViewVisibility(R.id.status_bar_play, VISIBLE);

       // Get the layout for the App Widget and attach an on-click listener to the view
        views.setOnClickPendingIntent(R.id.widget_view, returnToMainActivity());
        views.setOnClickPendingIntent(R.id.status_bar_pause, returnToMainActivity());
        views.setOnClickPendingIntent(R.id.status_bar_play, returnToMainActivity());
        views.setOnClickPendingIntent(R.id.status_bar_next, returnToMainActivity());
        views.setOnClickPendingIntent(R.id.status_bar_prev, returnToMainActivity());

        return views;
    }

    /**
    * Return Pending Intent to mainActivity
    * @return PendingIntent pendingIntent
    */
    private PendingIntent returnToMainActivity() {
        // Set intents to main
        Intent intent =  new Intent(this.getApplicationContext(), getMainActivityClass());
        intent.setAction(Intent.ACTION_MAIN);
        intent.addCategory(Intent.CATEGORY_LAUNCHER);
        PendingIntent pendingIntent = PendingIntent.getActivity(this.getApplicationContext(), 0, intent, 0);

        return pendingIntent;
    }


    private void setIntent(Intent intent) {
        this.intent = intent;
    }

    private Intent getIntent() {
        return this.intent;
    }

    // Widgets button options
    private PendingIntent playbackAction(int action) {

        Intent playbackAction = new Intent(this, WidgetService.class);

        switch (action) {

            // Play
            case 0:
            playbackAction.setAction(ACTION_PLAY);
            return PendingIntent.getService(this, action, playbackAction, 0);

            // Pause
            case 1:
            playbackAction.setAction(ACTION_PAUSE);
            return PendingIntent.getService(this, action, playbackAction, 0);

            // Next track
            case 2:
            playbackAction.setAction(ACTION_NEXT);
            return PendingIntent.getService(this, action, playbackAction, 0);

            // Previous track
            case 3:
            playbackAction.setAction(ACTION_PREVIOUS);
            return PendingIntent.getService(this, action, playbackAction, 0);

            // Stop
            case 4:
            playbackAction.setAction(ACTION_STOP);
            return PendingIntent.getService(this, action, playbackAction, 0);

            // Invalid option
            default:
            break;
        }

        return null;
    }

    // Transport actions
    private void handleIncomingActions(Intent playbackAction) {
        if(playbackAction == null || playbackAction.getAction() == null) {
            return;
        }

        String actionString = playbackAction.getAction();

        if (actionString.equalsIgnoreCase(ACTION_PLAY)) {
            transportControls.play();

        } else if (actionString.equalsIgnoreCase(ACTION_PAUSE)) {
            transportControls.pause();

        } else if (actionString.equalsIgnoreCase(ACTION_NEXT)) {
            transportControls.skipToNext();

        } else if (actionString.equalsIgnoreCase(ACTION_PREVIOUS)) {
            transportControls.skipToPrevious();

        } else if (actionString.equalsIgnoreCase(ACTION_STOP)) {
            transportControls.stop();

        }
    }

    // Send actions to js
    private void initMediaSession() throws RemoteException {
        // Create a new
        ComponentName mediaButtonReceiver = new ComponentName(getApplicationContext(), MediaButtonReceiver.class);
        mediaSession = new MediaSessionCompat(getApplicationContext(), "AudioPlayer", mediaButtonReceiver, null);
        //Get MediaSessions transport controls
        transportControls = mediaSession.getController().getTransportControls();
        //set MediaSession -> ready to receive media commands
        mediaSession.setActive(true);
        // Indicate that the MediaSession handles transport control commands
        // through its MediaSessionCompat.Callback.
        mediaSession.setFlags(MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS);
        Intent mediaButtonIntent = new Intent(Intent.ACTION_MEDIA_BUTTON);
        mediaButtonIntent.setClass(this, MediaButtonReceiver.class);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(this, 0, mediaButtonIntent, 0);
        mediaSession.setMediaButtonReceiver(pendingIntent);
        // Attach Callback to receive MediaSession updates
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            // Implement callbacks
            @Override
            public void onPlay() {
                super.onPlay();
                sendEvent("widgetService", "WIDGET_PLAY_MUSIC");

            }
            @Override
            public void onPause() {
                super.onPause();
                sendEvent("widgetService", "WIDGET_PAUSE_MUSIC");

            }
            @Override
            public void onSkipToNext() {
                super.onSkipToNext();
                sendEvent("widgetService", "WIDGET_NEXT_MUSIC");

            }
            @Override
            public void onSkipToPrevious() {
                super.onSkipToPrevious();
                sendEvent("widgetService", "WIDGET_PREVIOUS_MUSIC");

            }
            @Override
            public void onStop() {
                super.onStop();
                sendEvent("widgetService", "WIDGET_STOP_MUSIC");
                stopSelf();
            }
            @Override
            public void onSeekTo(long position) {
                super.onSeekTo(position);
            }
        });
    }


    private void sendEvent(String eventName, String message) {
        try {
          WidgetModule.reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, message);
        } catch (Exception e) {
           
        }
    }

    /**
    * The configuration class for the {@link WidgetService updateWidgetService} WidgetService.
    * Class to get Main Activity
    * @return Class.forName(className)
    */
    public Class getMainActivityClass() {
      Context context = getApplicationContext();
      String packageName = context.getPackageName();
      Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(packageName);
      String className = launchIntent.getComponent().getClassName();
        try {
            if (className!=null) {
            return Class.forName(className);

            } else {
            return null;

            }

        } catch (Exception e){
            return null;

        }
    }


    /**
    * The configuration class for the {@link WidgetService updateWidgetService} WidgetService.
    * Load artwork image asynchronous
    * @param WidgetModel.getArtwork() - ArtWork url
    * @return artworkString (String) and artworkImage (Bitmap)
    */
    public class LoadBitmap extends AsyncTask<String, Void, Bitmap> {
        private String mUrl;
        private HttpURLConnection connection;
        public LoadBitmap(String url) {
            mUrl = url;
        }
        public void cancel() {
            this.cancel(true);
            if (connection != null) {
                connection.disconnect();
            }
        }
        @Override
        protected Bitmap doInBackground(String... params) {
            final String src = mUrl;
            Bitmap myBitmap = null;
            try {
                URL url = new URL(src);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setDoInput(true);
                connection.connect();
                InputStream input = connection.getInputStream();

                if (!isCancelled()) {
                    myBitmap = BitmapFactory.decodeStream(input);
                    connection.disconnect();
                }
                return myBitmap;

            } catch (IOException e) {
                return myBitmap;

            }
        }
        @Override
        protected void onCancelled() {
        }
        @Override
        protected void onPostExecute(Bitmap result) {
            if (result != null) {
                artworkString = mUrl;
                artworkImage = result;
            }
        }
    }


}
