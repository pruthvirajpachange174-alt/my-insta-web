const registerForm = document.getElementById("registerForm");
const registerButton = document.getElementById("registerButton");
const googleRegisterButton = document.getElementById("googleRegisterButton");
const message = document.getElementById("message");

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!email || !password || !confirmPassword) {
        showMessage("Please fill in all fields.", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showMessage("Please enter a valid email address.", "error");
        return;
    }

    if (password.length < 6) {
        showMessage("Password must be at least 6 characters.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMessage("Confirm password must match password.", "error");
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = "Registering...";
    showMessage("", "");

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    registerButton.disabled = false;
    registerButton.textContent = "Register";

    if (error) {
        showMessage(error.message, "error");
        console.error("Supabase registration error:", error);
        return;
    }

    if (!data.session) {
        showMessage("Registration successful. Check your email to confirm your account, then login.", "success");
    } else {
        showMessage("Registration successful. Redirecting to login...", "success");
    }

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1800);
});

googleRegisterButton.addEventListener("click", async () => {
    googleRegisterButton.disabled = true;
    googleRegisterButton.textContent = "Connecting to Google...";
    showMessage("", "");

    const redirectUrl = new URL("dashboard.html", window.location.href).href;

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: redirectUrl
        }
    });

    if (error) {
        googleRegisterButton.disabled = false;
        googleRegisterButton.textContent = "Continue with Google";
        showMessage(error.message || "Google registration failed. Please try again.", "error");
        console.error("Supabase Google registration error:", error);
    }
});
