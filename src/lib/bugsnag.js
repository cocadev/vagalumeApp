import { Client, Configuration } from 'bugsnag-react-native';

const config = new Configuration('6b72162240cb5dbea6828c5409a2ea73');
config.codeBundleId = '2.3.46';
config.appVersion = '2.3.46';
const bugsnag = new Client(config);

export default bugsnag;
