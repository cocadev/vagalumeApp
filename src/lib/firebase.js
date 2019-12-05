import RNFirebase from 'react-native-firebase';

const firebase = RNFirebase.app();

// Verifica se o Play Services está disponivel no device
// https://github.com/invertase/react-native-firebase/releases/tag/v3.0.1 -> Utils -> PlayServices
const playServicesAvailability = firebase.utils().playServicesAvailability;
firebase.playServicesIsAvailable = playServicesAvailability.isAvailable;

export default firebase;
