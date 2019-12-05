import RNFirebase from 'react-native-firebase';

const firebase = RNFirebase.app();

const playServicesAvailability = firebase.utils().playServicesAvailability;
firebase.playServicesIsAvailable = playServicesAvailability.isAvailable;

export default firebase;
