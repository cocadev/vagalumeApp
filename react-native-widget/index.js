'use strict';
import { NativeModules, DeviceEventEmitter } from 'react-native';
const Widget = NativeModules.Widget;

let subscription = null;

const WidgetModule = {
	subscribe: (cb) => {
        subscription = cb;
    },
	buildWidget: (params) => {
		Widget.buildWidget(params);
	},
	updateWidget: () => {
		Widget.updateWidget();
	},
	stopWidget: () => {
		Widget.stopWidget();
	}
};

DeviceEventEmitter.addListener('widgetService',	(event) => {
	if (subscription) subscription(event);
});

module.exports = WidgetModule;
