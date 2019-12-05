/**
* @providesModule DynamicLinks
* @flow
*/
'use strict';

import { NativeModules, DeviceEventEmitter } from 'react-native';

const DynamicLinks = NativeModules.DynamicLinks;

var subscription = null;

var DynamicLinksModule = {
    subscribe: function(cb) {
        subscription = cb;
		DynamicLinks.subscribe();
    }
};

DeviceEventEmitter.addListener(
    'dynamicLinks',
    (url) => {
        if (subscription) subscription(url);
    }
);

module.exports = DynamicLinksModule;
