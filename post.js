const postForm = document.getElementById("postForm");
const postText = document.getElementById("postText");
const postPhoto = document.getElementById("postPhoto");
const postPhotoPreview = document.getElementById("postPhotoPreview");
const publishPostButton = document.getElementById("publishPostButton");
const statusMessage = document.getElementById("message");

let currentUser = null;
let selectedPostPhoto = "";

function showMessage(text, type) {
    statusMessage.textContent = text;
    statusMessage.className = `message ${type}`;
}

postPhoto.addEventListener("change", () => {
    const file = postPhoto.files[0];
    if (!file) {
        selectedPostPhoto = "";
        postPhotoPreview.classList.add("hidden");
        return;
    }
    if (file.size > 900 * 1024 || !file.type.startsWith("image/")) {
        showMessage("Please select a valid image element smaller than 900 KB.", "error");
        postPhoto.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        selectedPostPhoto = reader.result;
        postPhotoPreview.src = selectedPostPhoto;
        postPhotoPreview.classList.remove("hidden");
        showMessage("", "");
    };
    reader.readAsDataURL(file);
});

postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = postText.value.trim();

    if (!content && !selectedPostPhoto) {
        showMessage("Please provide textual context entries or insert an image to compile.", "error");
        return;
    }

    publishPostButton.disabled = true;
    publishPostButton.textContent = "Uploading payload content...";

    const { error } = await supabaseClient
        .from("posts")
        .insert({
            user_id: currentUser.id,
            email: currentUser.email,
            content,
            photo: selectedPostPhoto || null
        });

    publishPostButton.disabled = false;
    publishPostButton.textContent = "Publish Post Update";

    if (error) {
        showMessage(`Database composition rejected: ${error.message}`, "error");
    } else {
        showMessage("Post successfully routed and shared to profile metrics!", "success");
        setTimeout(() => { window.location.href = "dashboard.html"; }, 1000);
    }
});

async function init() {
    const { data } = await supabaseClient.auth.getUser();
    if (!data.user) { window.location.href = "login.html"; return; }
    currentUser = data.user;
}
init();