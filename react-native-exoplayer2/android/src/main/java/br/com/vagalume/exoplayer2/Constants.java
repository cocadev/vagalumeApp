package br.com.vagalume.exoplayer2;

import java.util.HashMap;
import java.util.Map;

public class Constants {

	public static Map<String, Object> getConstants() {
		final Map<String, Object> constants = new HashMap<>();

		/* Status do player */
		constants.put("STATE_STARTING", 1);
		constants.put("STATE_RUNNING", 2);
		constants.put("STATE_STOPPED", 4);

		/* Status de erros */
		constants.put("STREAM_FAIL", 0);
		constants.put("INVALID_STREAM", 15);
		constants.put("TS_FAIL", 20);
		constants.put("M3U8_FAIL", 21);
		constants.put("TS_NOT_FOUND", 22);
		constants.put("AAC_FAIL", 23);
		constants.put("UNKNOWN_HOST", 24);
		constants.put("SOCKET_TIMEOUT", 25);
		constants.put("CONNECT_EXCEPTION", 26);

		/* Eventos */
		constants.put("ON_STATE_CHANGED" , "exoplayer.onStateChanged");
		constants.put("ON_ID3_METADATA" , "exoplayer.onId3Metadata");

		return constants;
	}
}





