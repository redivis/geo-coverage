export default function () {
	let authResponse = sessionStorage.getItem('redivis_oauth_token');
	if (!authResponse) {
		return null;
	}
	authResponse = JSON.parse(authResponse);
	if (authResponse.expires_at < Date.now() / 1000 + 300) {
		sessionStorage.removeItem('redivis_oauth_token');
		return null;
	}
	return authResponse.access_token;
}
