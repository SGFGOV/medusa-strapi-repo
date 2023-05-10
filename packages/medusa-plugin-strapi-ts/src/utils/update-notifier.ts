import updateNotifier from 'update-notifier';
import packageJson from '../../package.json';

// Checks for available update and returns an instance
export function notifyUpdates() {
	const notifier = updateNotifier({ pkg: packageJson });

	// Notify using the built-in convenience method
	notifier.notify();

	// `notifier.update` contains some useful info about the update
	console.log(notifier.update);
	/*
{
	latest: '1.0.1',
	current: '1.0.0',
	type: 'patch', // Possible values: latest, major, minor, patch, prerelease, build
	name: 'pageres'
}
*/
}
