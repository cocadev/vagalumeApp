import analytics from '../../lib/analytics';
import firebase from '../../lib/firebase';
import bugsnag from '../../lib/bugsnag';

const EventManager = {
	trackEvent: ({ action, params, category }) => {
		if (action) {
			// Passando parâmetros somente quando necessário
			if (params) {
				if (firebase.playServicesIsAvailable) firebase.analytics().logEvent(action, params);
				bugsnag.leaveBreadcrumb(action, params);
				analytics.trackEvent(category, action, params);
			} else {
				if (firebase.playServicesIsAvailable) firebase.analytics().logEvent(action);
				bugsnag.leaveBreadcrumb(action);
				analytics.trackEvent(category, action);
			}
		}
	},
	trackView: ({ pageName }) => {
		if (pageName) {
			analytics.trackScreenView(pageName);
			// Colocando caixa baixa no nome da página apenas para seguir os padrões do Bugsnag e Firebase
			if (firebase.playServicesIsAvailable) firebase.analytics().setCurrentScreen(pageName.toLowerCase());
			bugsnag.leaveBreadcrumb('view_screen', { page_name: pageName.toLowerCase() });
		}
	}
};

export default EventManager;
