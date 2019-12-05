/**
* @providesModule PlayerHandler
* @flow
*/
'use strict';

import { NativeModules, DeviceEventEmitter } from 'react-native';

const PlayerHandler = NativeModules.PlayerHandler;

var subscription = null;
var memory = null;

var PlayerHandlerModule = {
    subscribe: function(cb) {
        subscription = cb;
    },
    startService: function() {
        PlayerHandler.startService();
    },
    buildNotification: function(params) {
        PlayerHandler.buildNotification(params);
    },
    stopService: function() {
        PlayerHandler.stopService();
    },
    isNotificationEnabled: function(cb) {
        PlayerHandler.isNotificationEnabled(cb);
    },
    openNotificationSettings: function() {
        PlayerHandler.openNotificationSettings();
    },
    openSettings: function() {
        PlayerHandler.openSettings();
    }
};

DeviceEventEmitter.addListener(
    'playerService',
    (event) => {
        if (subscription) subscription(event);
    }
);

module.exports = PlayerHandlerModule;
