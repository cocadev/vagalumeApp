package br.com.vagalume.mediaplayer;

import android.net.Uri;

public class FileHelper {

    public static String stripFileProtocol(String uriString) {
        if (uriString.startsWith("file://")) {
            return Uri.parse(uriString).getPath();
        }
        return uriString;
    }
}
