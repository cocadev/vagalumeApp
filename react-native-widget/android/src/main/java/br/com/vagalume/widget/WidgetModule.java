package br.com.vagalume.widget;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactMethod;
import android.content.ServiceConnection;
import android.util.Log;


/**
 * Created by rmagalhaes on 30/03/17.
 */
public class WidgetModule extends ReactContextBaseJavaModule implements LifecycleEventListener {

    public static ReactApplicationContext reactContext = null;
    private WidgetService widgetService;
    private WidgetConfigure widgetConfigure;
    private WidgetModel widgetModel;



    public WidgetModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        reactContext.addLifecycleEventListener(this);
    }

    @Override
    public String getName() {
        return "Widget";
    }

    @Override
    public void onHostResume() {

    }

    @Override
    public void onHostPause() {

    }

    @Override
    public void onHostDestroy() {
        WidgetConfigure.onDestroy(reactContext);
    }


    @ReactMethod
    public void buildWidget(ReadableMap params) {

            String title = params.hasKey("title") ? params.getString("title") : null;
            String artist = params.hasKey("artist") ? params.getString("artist") : null;
            String info = params.hasKey("info") ? params.getString("info") : null;
            String artwork = params.hasKey("artwork") ? params.getString("artwork") : null;
            Long duration = params.hasKey("duration") ? (long)params.getDouble("duration") : 0;
            Long position = params.hasKey("position") ? (long)params.getDouble("position") : 0;
            boolean isPlaying = params.hasKey("isPlaying") ? params.getBoolean("isPlaying") : false;
            try {
                widgetModel = new WidgetModel (
                    title,
                    artist,
                    info,
                    artwork,
                    duration,
                    position,
                    isPlaying
                    );
                WidgetConfigure.buildWidget(reactContext, widgetModel);
            } catch (Exception exception) {
                 widgetModel = new WidgetModel (
                    title,
                    artist,
                    info,
                    artwork,
                    duration,
                    position,
                    isPlaying
                    );
                WidgetConfigure.buildWidget(reactContext, widgetModel);
            }
    }

    @ReactMethod
    public void updateWidget(){
        WidgetConfigure.updateWidget(reactContext);
    }

    @ReactMethod
    public void stopWidget(){
        WidgetConfigure.onDestroy(reactContext);
    }

}
