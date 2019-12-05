import { Platform, StatusBar } from 'react-native';

let value = 0;

if (Platform.OS === 'ios') {
	StatusBar.setBarStyle('light-content');
	value = 24;
} else if (Platform.OS === 'android') {
	value = (Platform.OS === 'android' && Platform.Version < 19) ? 0 : StatusBar.currentHeight;
}

export default value;
