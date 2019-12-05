package br.com.vagalume.chromecast;
import android.net.Uri;
import org.json.JSONObject;
import org.json.JSONException;

/**
 * Created by rmagalhaes on 19/05/17.
 * Model class
 * 
 */

public class Stream {

    private String station;  
    private boolean isPlaying; 
    private String event;

    public Stream(
    	String station,      
    	boolean isPlaying) {

        this.station 			= station;      
        this.isPlaying 			= isPlaying;
        this.event = parseToJSONStringify(station, isPlaying);
    }


    // Parse media info to JSON Object
    private String parseToJSONStringify(String station, boolean isPlaying) {
        JSONObject event = new JSONObject();

        try {
            event.put("station", station);
            event.put("isPlaying", isPlaying);          
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return event.toString();
    }

    public String getEvent() {
        return event;
    }

	public String getStation() {
        return station;
    }
    
    public boolean isPlaying() {
        return isPlaying;
    }

}
