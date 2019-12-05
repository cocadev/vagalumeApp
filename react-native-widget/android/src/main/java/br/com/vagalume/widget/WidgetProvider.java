package br.com.vagalume.widget;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

/**
 * Implementation of App Widget functionality.
 * App Widget Configuration implemented in {@link WidgetConfigureActivity WidgetConfigureActivity}
 */
public class WidgetProvider extends AppWidgetProvider {

    protected static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                                int appWidgetId) {

        // Construct component object
        ComponentName componentName = new ComponentName(context, WidgetProvider.class);

        // Get all widgets 
        int[] getAllWidgetsIds = appWidgetManager.getAppWidgetIds(componentName);
        
        // Intent service
        Intent intent = new Intent(context.getApplicationContext(),
                WidgetService.class);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, getAllWidgetsIds);

        // Update the widgets via service
        context.startService(intent);

    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, 
                        int[] appWidgetIds) {
        
        // Construct component object
        ComponentName componentName = new ComponentName(context, WidgetProvider.class);

        // Get all widgets
        int[] getAllWidgetsIds = appWidgetManager.getAppWidgetIds(componentName);

        // Intent service
        Intent intent = new Intent(context.getApplicationContext(),
                WidgetService.class);
        intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, getAllWidgetsIds);

        // Update the widgets via the service
        context.startService(intent);
    }

    @Override
    public void onDeleted(Context context, int[] appWidgetIds) {
        // When the user deletes the widget, delete the preference associated with it.
        /*for (int appWidgetId : appWidgetIds) {
            WidgetConfigureActivity.deleteTitlePref(context, appWidgetId);
        }*/
    }

    @Override
    public void onEnabled(Context context) {
        // Enter relevant functionality for when the first widget is created
    }

    @Override
    public void onDisabled(Context context) {
        // Enter relevant functionality for when the last widget is disabled
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
    }
}

