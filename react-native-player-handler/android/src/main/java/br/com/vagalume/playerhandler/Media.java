package br.com.vagalume.playerhandler;
import android.util.Log;

public class Media {

	private String title;
	private String artist; 
	private String info; 
	private String artwork;
	private String artistArtwork;
	private Long duration; 
	private Long position; 
	private boolean isPlaying;
	private boolean isRecording;
	private int playerType;

	public Media(){}

	public Media(String title, String artist, String info, String artwork, String artistArtwork, Long duration, Long position, boolean isPlaying, boolean isRecording, int playerType) {
		this.title = title; 
		this.artist = artist;
		this.info = info;
		this.artwork = artwork; 
		this.duration = duration;
		this.position = position;
		this.isPlaying = isPlaying;
		this.isRecording = isRecording;
		this.playerType = playerType;
		this.artistArtwork = artistArtwork;
	}

	public String getTitle() {
		return title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	public String getArtistArtwork() {
		return artistArtwork;
	}

	public void setArtistArtwork(String artistArtwork) {
		this.artistArtwork = artistArtwork;
	}


	public String getArtist() {
		return artist;
	}

	public void setArtist(String artist) {
		this.artist = artist;
	}

	public String getInfo() {
		return info;
	}

	public void setInfo(String info) {
		this.info = info;
	}

	public String getArtwork() {
		return artwork;
	}

	public void setArtwork(String artwork) {
		this.artwork = artwork;
	}

	public Long getDuration() {
		return duration;
	}

	public void setDuration(Long duration) {
		this.duration = duration;
	}

	public Long getPosition() {
		return position;
	}

	public void setPosition(Long position) {
		this.position = position;
	}

	public boolean isPlaying() {
		return isPlaying;
	}

	public void setPlaying(boolean playing) {
		isPlaying = playing;
	}

	public boolean isRecording() {
		return isRecording;
	}

	public void setIsRecording(boolean isRecording) {
		this.isRecording = isRecording;
	}


	public int getPlayerType() {
		return playerType;
	}

	public void setPlayerType(int playerType) {
		this.playerType = playerType;
	}

}