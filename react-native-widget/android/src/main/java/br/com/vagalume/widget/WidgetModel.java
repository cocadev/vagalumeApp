package br.com.vagalume.widget;

/**
 * Created by rmagalhaes on 31/03/17.
 */

public class WidgetModel {


    private String title;
    private String artist;
    private String info;
    private String artwork;
    private Long duration;
    private Long position;
    private boolean isPlaying;

    public WidgetModel(String title, String artist, String info, String artwork, Long duration, Long position, boolean isPlaying) {
        this.title = title;
        this.artist = artist;
        this.info = info;
        this.artwork = artwork;
        this.duration = duration;
        this.position = position;
        this.isPlaying = isPlaying;
    }

    public WidgetModel() {
    }

    public String getTitle() {
        return title;
    }

    public String getArtist() {
        return artist;
    }

    public String getInfo() {
        return info;
    }

    public String getArtwork() {
        return artwork;
    }

    public Long getDuration() {
        return duration;
    }

    public Long getPosition() {
        return position;
    }

    public boolean isPlaying() {
        return isPlaying;
    }
}
