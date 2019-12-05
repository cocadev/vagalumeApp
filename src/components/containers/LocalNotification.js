import { Platform } from 'react-native';
const PushNotification = Platform.select({
	ios: () => require('PushNotificationIOS'),
	android: () => require('react-native-push-notification')
})();

const LocalNotification = {
	create: ({ title, message, isSilent, date }) => {
		if (typeof title !== 'string' || typeof message !== 'string' || isSilent === null || date === null)  {
			return;
		}

		Platform.OS === 'android' ?
			PushNotification.localNotificationSchedule({
				title,
				message,
				playSound: !isSilent,
				largeIcon: "ic_launcher", // (optional) default: "ic_launcher"
				vibrate: !isSilent,
				date
			}) :
			// ios
			PushNotification.scheduleLocalNotification({
				alertTitle: title,
				alertBody: message,
				fireDate: date,
				isSilent
			});
	},
	cancel: () => {
		PushNotification.cancelAllLocalNotifications();
	}
}

export default LocalNotification;
