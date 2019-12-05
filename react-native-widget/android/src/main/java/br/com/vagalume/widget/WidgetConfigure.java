package br.com.vagalume.widget;

import android.appwidget.AppWidgetManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/**
 * The configuration class for the {@link Widget Widget} Vagalume Widget.
 */

public class WidgetConfigure {

	// Set preferences strings
 	public static final String PREFS_NAME = "br.com.vagalume.widget.Widget";
    private static final String PREF_PREFIX_KEY_TITLE = "appwidget_title";
    private static final String PREF_PREFIX_KEY_ARTIST = "appwidget_artist";
    private static final String PREF_PREFIX_KEY_INFO = "appwidget_info";
    private static final String PREF_PREFIX_KEY_ARTWORK = "appwidget_artwork";
    private static final String PREF_PREFIX_KEY_DURATION = "appwidget_duration";
    private static final String PREF_PREFIX_KEY_POSITION = "appwidget_position";
    public static final String PREF_PREFIX_KEY_IS_PLAYING = "appwidget_isPlaying";
    public static final String PREF_PREFIX_CLOSE_APP = "appwidget_close_app";


    protected static void buildWidget(Context context, WidgetModel widgetModel) {

    	// Save infos (cache)
    	savePrefs(context, widgetModel);

    	// Construct the AppWidgetManager
    	AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);

    	// Call Widget.class. Force update widgets
    	WidgetProvider.updateAppWidget(context, appWidgetManager, 0);

    }

    protected static void updateWidget(Context context) {
        // Create AppWidgetManager object
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);

        // Force update widget
        WidgetProvider.updateAppWidget(context, appWidgetManager, 0);
    }

    protected static void onDestroy(Context context) {

    	// Delete all infos (cache)
        deletePref(context);

    }

    // Write the prefix to the SharedPreferences object for this widget
    // SharedPreferences: Interface for accessing and modifying preference data (set info cache in cellphone)
    protected static void savePrefs(Context context, WidgetModel widgetModel) {

    	// Construct SharedPreferences object
        SharedPreferences.Editor prefs = context.getSharedPreferences(PREFS_NAME, 0).edit();

        // Put infos in SharedPreferences object
        prefs.putString(PREF_PREFIX_KEY_TITLE, widgetModel.getTitle());
        prefs.putString(PREF_PREFIX_KEY_ARTIST, widgetModel.getArtist());
        prefs.putString(PREF_PREFIX_KEY_INFO, widgetModel.getInfo());
        prefs.putString(PREF_PREFIX_KEY_ARTWORK, widgetModel.getArtwork());
        prefs.putLong(PREF_PREFIX_KEY_DURATION, widgetModel.getDuration());
        prefs.putLong(PREF_PREFIX_KEY_POSITION, widgetModel.getPosition());
        prefs.putBoolean(PREF_PREFIX_KEY_IS_PLAYING, widgetModel.isPlaying());

        // Save changes
        prefs.apply();
    }


    // Read the prefix from the SharedPreferences object for this widget.
    // If there is no preference saved, get the default from a resource
    protected static WidgetModel loadPref(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, 0);

        // Set previous preferences in WidgetModel object, if not exists set default values (Second param)
        WidgetModel widgetModel = new WidgetModel(
            prefs.getString(PREF_PREFIX_KEY_TITLE, null),
            prefs.getString(PREF_PREFIX_KEY_ARTIST, null),
            prefs.getString(PREF_PREFIX_KEY_INFO, null),
            prefs.getString(PREF_PREFIX_KEY_ARTWORK, null),
            prefs.getLong(PREF_PREFIX_KEY_DURATION, 0),
            prefs.getLong(PREF_PREFIX_KEY_POSITION, 0),
            prefs.getBoolean(PREF_PREFIX_KEY_IS_PLAYING, false)
        );

        // Check if widgetModel have title and return the WidgetModel object
        if (widgetModel.getTitle() != null) {
            return widgetModel;
        } else {
            return null;
        }
    }

	// Delete the SharedPreferences data
	protected static void deletePref(Context context) {
        SharedPreferences.Editor prefs = context.getSharedPreferences(PREFS_NAME, 0).edit();

        // Remove all preferences
        prefs.remove(PREF_PREFIX_KEY_TITLE);
        prefs.remove(PREF_PREFIX_KEY_ARTIST);
        prefs.remove(PREF_PREFIX_KEY_INFO);
        prefs.remove(PREF_PREFIX_KEY_ARTWORK);
        prefs.remove(PREF_PREFIX_KEY_DURATION);
        prefs.remove(PREF_PREFIX_KEY_POSITION);
        prefs.remove(PREF_PREFIX_KEY_IS_PLAYING);

        // Save changes
        prefs.apply();

        // Update widgets to set empty values
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        WidgetProvider.updateAppWidget(context, appWidgetManager, 0);
    }

}
