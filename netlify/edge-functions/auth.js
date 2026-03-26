// Netlify Edge Function — server-side password auth for Command Center
// The HTML is never served unless the correct password cookie is present

const PASS_HASH = "3c5b980d6add5b57636613ea6dc759c38ab098aadd0ab9fd913d4be7e30c7d15";

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Simple login page served by the edge function itself
function loginPage(error = "") {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Merek — Command Center</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    :root { --bg: #0f1117; --bg-card: #1a1d27; --bg-input: #14161f; --border: #2a2d3a; --text: #e8e8ed; --text-muted: #5c5e6e; --accent: #d97757; --red: #f87171; }
    body { font-family:'Inter',-apple-system,sans-serif; background:var(--bg); color:var(--text); height:100vh; display:flex; align-items:center; justify-content:center; }
    .auth-box { background:var(--bg-card); border:1px solid var(--border); border-radius:16px; padding:48px 40px; width:380px; text-align:center; }
    .logo-mark { width:48px; height:48px; font-size:20px; margin:0 auto 18px; border-radius:12px; display:flex; align-items:center; justify-content:center; background:var(--accent); font-weight:700; color:#fff; }
    h2 { font-size:1.1rem; font-weight:700; margin-bottom:6px; letter-spacing:-0.02em; }
    p { font-size:0.72rem; color:var(--text-muted); margin-bottom:24px; }
    input { width:100%; padding:12px 16px; border-radius:8px; border:1px solid var(--border); background:var(--bg-input); color:var(--text); font-size:0.85rem; font-family:inherit; outline:none; }
    input:focus { border-color:var(--accent); }
    button { width:100%; margin-top:14px; padding:12px; border-radius:8px; border:none; background:var(--accent); color:#fff; font-size:0.8rem; font-weight:600; font-family:inherit; cursor:pointer; }
    button:hover { opacity:0.9; }
    .error { color:var(--red); font-size:0.7rem; margin-top:10px; }
  </style>
</head>
<body>
  <form class="auth-box" method="POST" action="/">
    <div class="logo-mark">M</div>
    <h2>Command Center</h2>
    <p>Merek Security Solutions</p>
    <input type="password" name="password" placeholder="Enter password" autocomplete="off" autofocus>
    <button type="submit">Unlock</button>
    ${error ? '<div class="error">' + error + "</div>" : ""}
  </form>
</body>
</html>`,
    { status: error ? 401 : 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

export default async function handler(request, context) {
  const url = new URL(request.url);

  // Check for auth cookie
  const cookies = request.headers.get("cookie") || "";
  const authMatch = cookies.match(/merek_auth=([^;]+)/);

  // Handle POST (login attempt)
  if (request.method === "POST") {
    const formData = await request.formData();
    const password = formData.get("password") || "";
    const hash = await sha256(password);

    if (hash === PASS_HASH) {
      // Set HTTP-only secure cookie and redirect to the page
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.pathname,
          "Set-Cookie": `merek_auth=${hash}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      });
    }
    return loginPage("Incorrect password");
  }

  // Check auth cookie on GET
  if (authMatch && authMatch[1] === PASS_HASH) {
    // Authenticated — serve the page normally
    return context.next();
  }

  // Not authenticated — show login
  return loginPage();
}

export const config = {
  path: "/*",
};
