import { GoogleAnalyticsTracker } from 'react-native-google-analytics-bridge';

const tracker = new GoogleAnalyticsTracker('UA-72144717-1');

const analytics = {
    trackScreenView: (name) => {
        tracker.trackScreenView(name);
    },
    trackEvent: (category, action, values) => {
        tracker.trackEvent(category, action, values);
    }
};

export default analytics;
