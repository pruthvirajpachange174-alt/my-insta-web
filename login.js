const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const googleLoginButton = document.getElementById("googleLoginButton");
const message = document.getElementById("message");

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getLoginErrorMessage(error) {
    const errorText = `${error.message || ""} ${error.status || ""}`.toLowerCase();

    if (errorText.includes("email not confirmed")) {
        return "Please confirm your email first, then login again.";
    }

    if (errorText.includes("invalid login credentials")) {
        return "Wrong email or password. Please try again.";
    }

    return error.message || "Login failed. Please try again.";
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!email || !password) {
        showMessage("Please enter your email and password.", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }

    loginButton.disabled = true;
    loginButton.textContent = "Logging in...";
    showMessage("", "");

    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    loginButton.disabled = false;
    loginButton.textContent = "Login";

    if (error) {
        showMessage(getLoginErrorMessage(error), "error");
        console.error("Supabase login error:", error);
        return;
    }

    if (!data.session) {
        showMessage("Login did not create a session. Please try again.", "error");
        return;
    }

    window.location.href = "dashboard.html";
});

googleLoginButton.addEventListener("click", async () => {
    googleLoginButton.disabled = true;
    googleLoginButton.textContent = "Connecting to Google...";
    showMessage("", "");

    const redirectUrl = new URL("dashboard.html", window.location.href).href;

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: redirectUrl
        }
    });

    if (error) {
        googleLoginButton.disabled = false;
        googleLoginButton.textContent = "Continue with Google";
        showMessage(error.message || "Google login failed. Please try again.", "error");
        console.error("Supabase Google login error:", error);
    }
});
