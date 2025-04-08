// Replace with your actual client ID
const clientId = "YOUR_CLIENT_ID_HERE";

// Get code from URL if present
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

if (!code) {
  redirectToAuthCodeFlow(clientId);
} else {
  // We have a code, so use it to get an access token and fetch profile
  const accessToken = await getAccessToken(clientId, code);
  const profile = await fetchProfile(accessToken);
  populateUI(profile);
}

async function redirectToAuthCodeFlow(clientId: string) {
  // Generate a code verifier and code challenge
  const verifier = generateCodeVerifier(128);
  const challenge = await generateCodeChallenge(verifier);

  // Store the verifier for later
  localStorage.setItem("verifier", verifier);

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("response_type", "code");

  // Make sure this matches what you set in Spotify App Redirect URI
  params.append("redirect_uri", "http://127.0.0.1:5173/callback");

  // Request whatever scopes you need
  params.append("scope", "user-read-private user-read-email");

  // PKCE challenge
  params.append("code_challenge_method", "S256");
  params.append("code_challenge", challenge);

  // Send the user to the Spotify authorisation page
  document.location = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

function generateCodeVerifier(length: number) {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function generateCodeChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function getAccessToken(clientId: string, code: string): Promise<string> {
  // Retrieve your saved verifier
  const verifier = localStorage.getItem("verifier");

  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "http://127.0.0.1:5173/callback");
  params.append("code_verifier", verifier!);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  const { access_token } = await result.json();
  return access_token;
}

async function fetchProfile(token: string) {
  const result = await fetch("https://api.spotify.com/v1/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await result.json();
}

function populateUI(profile: any) {
  document.getElementById("displayName")!.textContent = profile.display_name;

  if (profile.images?.[0]) {
    const profileImage = new Image(200, 200);
    profileImage.src = profile.images[0].url;
    document.getElementById("avatar")!.appendChild(profileImage);
  }

  document.getElementById("id")!.textContent = profile.id;
  document.getElementById("email")!.textContent = profile.email;
  document.getElementById("uri")!.textContent = profile.uri;
  document.getElementById("uri")!.setAttribute("href", profile.external_urls.spotify);
  document.getElementById("url")!.textContent = profile.href;
  document.getElementById("url")!.setAttribute("href", profile.href);
  document.getElementById("imgUrl")!.textContent = profile.images?.[0]?.url ?? "(no image)";
}
