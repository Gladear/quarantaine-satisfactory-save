try {
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start("#firebaseui-auth-container", {
		signInOptions: [
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
		],
		signInSuccessUrl: "/",
	});
} catch (e) {
	console.error(e);
	messageEl.textContent =
		"Error loading the Firebase SDK, check the console and report to the administrator.";
}
