'use strict';

/**
 * `authenticated-routes` policy
 */

module.exports = (policyContext, config, { strapi }) => {
	// Add your own logic here.
	strapi.log.info('In authenticated-routes policy.');

	if (policyContext.state.user) {
		// if a session is open
		// go to next policy or reach the controller's action
		return true;
	}

	return false;
};
