'use strict';
import { NativeModules, DeviceEventEmitter } from 'react-native';

const Chromecast = NativeModules.Chromecast;

let session = null;
let availableDevices = null;
let station = null;
let music = null;
let playerState = null;
let currentStation = null;

let ChromecastModule = {
	getAvailableDevices: function(cb){
		Chromecast.getAvailableDevices(cb);
	},
	connectToDevice: function(params) {
		Chromecast.connectToDevice(params);
	},
	disconnectToDevice: function() {
		Chromecast.disconnectToDevice();
	},
	setSessionStatus: function(cb){
		session = cb;
	},
	connectionStatus: function(cb){
		Chromecast.connectionStatus(cb);
	},
	getSelectedDevice: function(cb){
		Chromecast.getSelectedDevice(cb);
	},
	isConnected: function(cb){
		Chromecast.isConnected(cb);
	},
	sendMedia: function(params){
		Chromecast.sendMedia(params);
	},
	pause: function(){
		Chromecast.pause();
	},
	play: function(){
		Chromecast.play();
	},
	getSelectedDeviceId: function(cb) {
		Chromecast.getSelectedDeviceId(cb);
	},
	getStation: function(cb) {
		station = cb;
	},
	getMusic: function(cb) {
		music = cb;
	},
	getPlayerState: function(cb) {
		playerState = cb;
	},
	getCurrentStation: function(cb) {
		Chromecast.fireGetCurrentStation();
		currentStation = cb;
	}
};

DeviceEventEmitter.addListener(
	'chromecast.vagalume.fm.session',
	(event) => {
		if (session) session(event);
	}
);

DeviceEventEmitter.addListener(
	'chromecast.vagalume.fm.music',
	(event) => {
		if (music) music(event);
	}
);

DeviceEventEmitter.addListener(
	'chromecast.vagalume.fm.station',
	(event) => {
		if (station) station(event);
	}
);

DeviceEventEmitter.addListener(
	'chromecast.vagalume.fm.player',
	(event) => {
		if (playerState) playerState(event);
	}
);

DeviceEventEmitter.addListener(
	'chromecast.vagalume.fm.action.station',
	(event) => {
		if (currentStation) currentStation(event);
	}
);


module.exports = ChromecastModule;
