const userMessage = document.getElementById("userMessage");
const profileForm = document.getElementById("profileForm");
const profilePhoto = document.getElementById("profilePhoto");
const photoPreview = document.getElementById("photoPreview");
const fullName = document.getElementById("fullName");
const dob = document.getElementById("dob");
const currentStudy = document.getElementById("currentStudy");
const skills = document.getElementById("skills");
const saveProfileButton = document.getElementById("saveProfileButton");
const profileCard = document.getElementById("profileCard");
const profileImage = document.getElementById("profileImage");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileDob = document.getElementById("profileDob");
const profileStudy = document.getElementById("profileStudy");
const profileSkills = document.getElementById("profileSkills");
const editProfileButton = document.getElementById("editProfileButton");
const openMessagesButton = document.getElementById("openMessagesButton");
const logoutButton = document.getElementById("logoutButton");
const messagesPanel = document.getElementById("messagesPanel");
const closeMessagesButton = document.getElementById("closeMessagesButton");
const messagesList = document.getElementById("messagesList");
const profileDirectory = document.getElementById("profileDirectory");
const profileSearch = document.getElementById("profileSearch");
const profilesList = document.getElementById("profilesList");
const refreshProfilesButton = document.getElementById("refreshProfilesButton");
const selectedProfilePanel = document.getElementById("selectedProfilePanel");
const selectedProfileName = document.getElementById("selectedProfileName");
const selectedProfileEmail = document.getElementById("selectedProfileEmail");
const selectedProfileImage = document.getElementById("selectedProfileImage");
const selectedProfileDob = document.getElementById("selectedProfileDob");
const selectedProfileStudy = document.getElementById("selectedProfileStudy");
const selectedProfileSkills = document.getElementById("selectedProfileSkills");
const selectedProfilePosts = document.getElementById("selectedProfilePosts");
const closeSelectedProfileButton = document.getElementById("closeSelectedProfileButton");
const selectedProfileActions = document.getElementById("selectedProfileActions");
const followButton = document.getElementById("followButton");
const messageForm = document.getElementById("messageForm");
const messageText = document.getElementById("messageText");
const sendMessageButton = document.getElementById("sendMessageButton");
const postSection = document.getElementById("postSection");
const postForm = document.getElementById("postForm");
const postText = document.getElementById("postText");
const postPhoto = document.getElementById("postPhoto");
const postPhotoPreview = document.getElementById("postPhotoPreview");
const publishPostButton = document.getElementById("publishPostButton");
const message = document.getElementById("message");

// Added selectors for Profile stats counters
const profileFollowerCount = document.getElementById("profileFollowerCount");
const profilePostCount = document.getElementById("profilePostCount");

let currentUser = null;
let selectedPhoto = "";
let selectedPostPhoto = "";
let directoryProfiles = [];
let selectedProfileId = null;
let selectedProfileIsFollowed = false;

function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
}

function getDefaultPhoto() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Crect width='240' height='240' rx='28' fill='%231f7a8c'/%3E%3Ccircle cx='120' cy='92' r='42' fill='white' opacity='.95'/%3E%3Cpath d='M48 204c11-45 43-70 72-70s61 25 72 70' fill='white' opacity='.95'/%3E%3C/svg%3E";
}

function formatDob(value) {
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

async function readSavedProfile() {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("name, dob, picture, current_study, skills")
        .eq("id", currentUser.id)
        .maybeSingle();

    if (error) {
        showMessage(`Could not load profile: ${error.message}`, "error");
        console.error("Supabase profile load error:", error);
        return null;
    }

    return data;
}

function showProfileForm(profile = null) {
    profileCard.classList.add("hidden");
    profileForm.classList.remove("hidden");
    userMessage.textContent = "Please upload your profile pic, name, and date of birth.";

    fullName.value = profile?.name || "";
    dob.value = profile?.dob || "";
    currentStudy.value = profile?.current_study || "";
    skills.value = Array.isArray(profile?.skills) ? profile.skills.join(", ") : "";
    selectedPhoto = profile?.picture || "";
    photoPreview.src = selectedPhoto || getDefaultPhoto();
    saveProfileButton.textContent = profile ? "Update Profile" : "Create Profile";
}

// Added count tracking logic using Supabase Head Aggregators
async function fetchProfileStats(userId) {
    const { count: followerCount, error: followError } = await supabaseClient
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

    const { count: postCount, error: postError } = await supabaseClient
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

    if (followError) console.error("Error fetching follower count:", followError);
    if (postError) console.error("Error fetching post count:", postError);

    return {
        followers: followerCount || 0,
        posts: postCount || 0
    };
}

// Made async to fetch live database totals upon render
async function showProfileCard(profile) {
    profileForm.classList.add("hidden");
    profileCard.classList.remove("hidden");
    userMessage.textContent = `Login successful: ${currentUser.email}`;

    profileImage.src = profile.picture || getDefaultPhoto();
    profileName.textContent = profile.name;
    profileEmail.textContent = currentUser.email;
    profileDob.textContent = formatDob(profile.dob);
    profileStudy.textContent = profile.current_study || "Not added";
    profileSkills.textContent = Array.isArray(profile.skills) && profile.skills.length
        ? profile.skills.join(", ")
        : "Not added";

    // Request and insert metrics dynamically
    const stats = await fetchProfileStats(currentUser.id);
    profileFollowerCount.textContent = stats.followers;
    profilePostCount.textContent = stats.posts;

    profileDirectory.classList.remove("hidden");
    postSection.classList.remove("hidden");
}

function normalizeSkills(value) {
    return value
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
}

function profileMatchesSearch(profile, searchText) {
    const haystack = [
        profile.name,
        profile.email,
        profile.current_study,
        ...(profile.skills || [])
    ].join(" ").toLowerCase();

    return haystack.includes(searchText.toLowerCase());
}

function renderProfiles(profiles) {
    profilesList.innerHTML = "";

    if (!profiles.length) {
        profilesList.innerHTML = '<p class="empty-state">No matching profiles found.</p>';
        return;
    }

    profiles.forEach((profile) => {
        const card = document.createElement("article");
        card.className = "directory-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Open ${profile.name} profile`);

        const skillsText = Array.isArray(profile.skills) && profile.skills.length
            ? profile.skills.join(", ")
            : "No skills added";

        const image = document.createElement("img");
        image.src = profile.picture || getDefaultPhoto();
        image.alt = `${profile.name} profile photo`;

        const content = document.createElement("div");
        const name = document.createElement("h3");
        const email = document.createElement("p");
        const study = document.createElement("span");
        const profileSkills = document.createElement("strong");

        name.textContent = profile.name;
        email.textContent = profile.email;
        study.textContent = profile.current_study || "Study not added";
        profileSkills.textContent = skillsText;

        content.append(name, email, study, profileSkills);
        card.append(image, content);
        card.addEventListener("click", () => openStudentProfile(profile.id));
        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openStudentProfile(profile.id);
            }
        });

        profilesList.appendChild(card);
    });
}

async function loadProfileDirectory() {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id, email, name, dob, picture, current_study, skills")
        .order("updated_at", { ascending: false });

    if (error) {
        showMessage(`Could not load student profiles: ${error.message}`, "error");
        console.error("Supabase directory load error:", error);
        return;
    }

    directoryProfiles = data || [];
    renderProfiles(directoryProfiles);
}

function renderPosts(posts, targetElement) {
    targetElement.innerHTML = "";

    if (!posts.length) {
        targetElement.innerHTML = '<p class="empty-state">No posts yet.</p>';
        return;
    }

    posts.forEach((post) => {
        const card = document.createElement("article");
        card.className = "post-card";

        const header = document.createElement("div");
        header.className = "post-header";

        const avatar = document.createElement("img");
        avatar.src = post.author?.picture || getDefaultPhoto();
        avatar.alt = `${post.author?.name || "Student"} profile photo`;

        const author = document.createElement("div");
        const authorName = document.createElement("h3");
        const createdAt = document.createElement("p");

        authorName.textContent = post.author?.name || post.email;
        createdAt.textContent = new Date(post.created_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short"
        });

        author.append(authorName, createdAt);
        header.append(avatar, author);

        const body = document.createElement("p");
        body.className = "post-body";
        body.textContent = post.content;

        card.append(header, body);

        if (post.photo) {
            const image = document.createElement("img");
            image.className = "post-image";
            image.src = post.photo;
            image.alt = "Student post photo";
            card.appendChild(image);
        }

        targetElement.appendChild(card);
    });
}

async function openStudentProfile(profileId) {
    const profile = directoryProfiles.find((studentProfile) => studentProfile.id === profileId);

    if (!profile) {
        showMessage("Could not open this profile. Refresh and try again.", "error");
        return;
    }

    selectedProfileId = profileId;
    selectedProfileName.textContent = profile.name;
    selectedProfileEmail.textContent = profile.email;
    selectedProfileImage.src = profile.picture || getDefaultPhoto();
    selectedProfileImage.alt = `${profile.name} profile photo`;
    selectedProfileDob.textContent = formatDob(profile.dob);
    selectedProfileStudy.textContent = profile.current_study || "Not added";
    selectedProfileSkills.textContent = Array.isArray(profile.skills) && profile.skills.length
        ? profile.skills.join(", ")
        : "Not added";
    selectedProfilePanel.classList.remove("hidden");
    selectedProfilePosts.innerHTML = '<p class="empty-state">Loading posts...</p>';
    await updateSelectedProfileFollowState();

    const { data, error } = await supabaseClient
        .from("posts")
        .select("id, user_id, email, content, photo, created_at, author:profiles!posts_user_id_profiles_id_fkey(name, picture)")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false });

    if (error) {
        selectedProfilePosts.innerHTML = "";
        showMessage(`Could not load this student's posts: ${error.message}`, "error");
        console.error("Supabase selected profile posts error:", error);
        return;
    }

    renderPosts(data || [], selectedProfilePosts);
    selectedProfilePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function updateSelectedProfileFollowState() {
    messageText.value = "";

    if (selectedProfileId === currentUser.id) {
        selectedProfileActions.classList.add("hidden");
        return;
    }

    selectedProfileActions.classList.remove("hidden");
    followButton.disabled = true;
    followButton.textContent = "Checking...";

    const { data, error } = await supabaseClient
        .from("follows")
        .select("follower_id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", selectedProfileId)
        .maybeSingle();

    followButton.disabled = false;

    if (error) {
        selectedProfileIsFollowed = false;
        followButton.textContent = "Follow";
        showMessage(`Could not check follow status: ${error.message}`, "error");
        console.error("Supabase follow status error:", error);
        return;
    }

    selectedProfileIsFollowed = Boolean(data);
    followButton.textContent = selectedProfileIsFollowed ? "Following" : "Follow";
}

async function loadMessages() {
    messagesList.innerHTML = '<p class="empty-state">Loading messages...</p>';
    messagesPanel.classList.remove("hidden");

    const { data, error } = await supabaseClient
        .from("messages")
        .select("id, content, created_at, sender:profiles!messages_sender_id_profiles_id_fkey(name, email, picture)")
        .eq("receiver_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        messagesList.innerHTML = "";
        showMessage(`Could not load messages: ${error.message}`, "error");
        console.error("Supabase messages load error:", error);
        return;
    }

    renderMessages(data || []);
}

function renderMessages(messages) {
    messagesList.innerHTML = "";

    if (!messages.length) {
        messagesList.innerHTML = '<p class="empty-state">No messages yet.</p>';
        return;
    }

    messages.forEach((messageItem) => {
        const card = document.createElement("article");
        card.className = "message-card";

        const header = document.createElement("div");
        header.className = "post-header";

        const avatar = document.createElement("img");
        avatar.src = messageItem.sender?.picture || getDefaultPhoto();
        avatar.alt = `${messageItem.sender?.name || "Student"} profile photo`;

        const senderInfo = document.createElement("div");
        const senderName = document.createElement("h3");
        const sentAt = document.createElement("p");

        senderName.textContent = messageItem.sender?.name || messageItem.sender?.email || "Student";
        sentAt.textContent = new Date(messageItem.created_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short"
        });

        const body = document.createElement("p");
        body.className = "post-body";
        body.textContent = messageItem.content;

        senderInfo.append(senderName, sentAt);
        header.append(avatar, senderInfo);
        card.append(header, body);
        messagesList.appendChild(card);
    });
}

async function loadUser() {
    const { data, error } = await supabaseClient.auth.getUser();

    if (error || !data.user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = data.user;

    const savedProfile = await readSavedProfile();

    if (savedProfile) {
        await showProfileCard(savedProfile);
        await loadProfileDirectory();
        return;
    }

    profileDirectory.classList.add("hidden");
    postSection.classList.add("hidden");
    showProfileForm();
}

profilePhoto.addEventListener("change", () => {
    const file = profilePhoto.files[0];

    if (!file) {
        return;
    }

    if (file.size > 750 * 1024) {
        showMessage("Please upload an image smaller than 750 KB.", "error");
        profilePhoto.value = "";
        return;
    }

    if (!file.type.startsWith("image/")) {
        showMessage("Please upload an image file.", "error");
        profilePhoto.value = "";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        selectedPhoto = reader.result;
        photoPreview.src = selectedPhoto;
        showMessage("", "");
    };

    reader.readAsDataURL(file);
});

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const nameValue = fullName.value.trim();
    const dobValue = dob.value;
    const currentStudyValue = currentStudy.value.trim();
    const skillsValue = normalizeSkills(skills.value);

    if (!nameValue || !dobValue || !currentStudyValue || !skillsValue.length) {
        showMessage("Please enter your name, date of birth, study, and skills.", "error");
        return;
    }

    const profile = {
        id: currentUser.id,
        email: currentUser.email,
        name: nameValue,
        dob: dobValue,
        picture: selectedPhoto || getDefaultPhoto(),
        current_study: currentStudyValue,
        skills: skillsValue
    };

    const buttonText = saveProfileButton.textContent;
    saveProfileButton.disabled = true;
    saveProfileButton.textContent = "Saving...";

    const { data, error } = await supabaseClient
        .from("profiles")
        .upsert(profile, { onConflict: "id" })
        .select("name, dob, picture, current_study, skills")
        .single();

    saveProfileButton.disabled = false;
    saveProfileButton.textContent = buttonText;

    if (error) {
        showMessage(`Could not save profile: ${error.message}`, "error");
        console.error("Supabase profile save error:", error);
        return;
    }

    showMessage("Profile saved in Supabase successfully.", "success");
    await showProfileCard(data);
    await loadProfileDirectory();
});

editProfileButton.addEventListener("click", async () => {
    showMessage("", "");
    profileDirectory.classList.add("hidden");
    selectedProfilePanel.classList.add("hidden");
    messagesPanel.classList.add("hidden");
    showProfileForm(await readSavedProfile());
});

profileSearch.addEventListener("input", () => {
    const searchText = profileSearch.value.trim();
    const profiles = searchText
        ? directoryProfiles.filter((profile) => profileMatchesSearch(profile, searchText))
        : directoryProfiles;

    renderProfiles(profiles);
});

refreshProfilesButton.addEventListener("click", async () => {
    await loadProfileDirectory();
});

closeSelectedProfileButton.addEventListener("click", () => {
    selectedProfilePanel.classList.add("hidden");
});

followButton.addEventListener("click", async () => {
    if (!selectedProfileId || selectedProfileId === currentUser.id) {
        return;
    }

    followButton.disabled = true;
    followButton.textContent = selectedProfileIsFollowed ? "Unfollowing..." : "Following...";

    const request = selectedProfileIsFollowed
        ? supabaseClient
            .from("follows")
            .delete()
            .eq("follower_id", currentUser.id)
            .eq("following_id", selectedProfileId)
        : supabaseClient
            .from("follows")
            .insert({
                follower_id: currentUser.id,
                following_id: selectedProfileId
            });

    const { error } = await request;

    followButton.disabled = false;

    if (error) {
        showMessage(`Could not update follow: ${error.message}`, "error");
        console.error("Supabase follow update error:", error);
        await updateSelectedProfileFollowState();
        return;
    }

    selectedProfileIsFollowed = !selectedProfileIsFollowed;
    followButton.textContent = selectedProfileIsFollowed ? "Following" : "Follow";
    showMessage(selectedProfileIsFollowed ? "You are now following this student." : "Unfollowed this student.", "success");
    
    // Auto-refresh metrics inside current user profile card instantly if following actions occur
    const savedProfile = await readSavedProfile();
    if (savedProfile) await showProfileCard(savedProfile);
});

messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = messageText.value.trim();

    if (!content) {
        showMessage("Please write a message first.", "error");
        return;
    }

    sendMessageButton.disabled = true;
    sendMessageButton.textContent = "Sending...";

    const { error } = await supabaseClient
        .from("messages")
        .insert({
            sender_id: currentUser.id,
            receiver_id: selectedProfileId,
            content
        });

    sendMessageButton.disabled = false;
    sendMessageButton.innerHTML = '<span class="paper-plane-icon"></span> Send Message';

    if (error) {
        showMessage(`Could not send message: ${error.message}`, "error");
        console.error("Supabase message send error:", error);
        return;
    }

    messageText.value = "";
    showMessage("Message sent successfully.", "success");
});

openMessagesButton.addEventListener("click", async () => {
    await loadMessages();
});

closeMessagesButton.addEventListener("click", () => {
    messagesPanel.classList.add("hidden");
});

postPhoto.addEventListener("change", () => {
    const file = postPhoto.files[0];

    if (!file) {
        selectedPostPhoto = "";
        postPhotoPreview.classList.add("hidden");
        return;
    }

    if (file.size > 900 * 1024) {
        showMessage("Please upload a post photo smaller than 900 KB.", "error");
        postPhoto.value = "";
        return;
    }

    if (!file.type.startsWith("image/")) {
        showMessage("Please upload an image file for your post.", "error");
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

postForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const content = postText.value.trim();

    if (!content && !selectedPostPhoto) {
        showMessage("Please write blog text or upload a photo before posting.", "error");
        return;
    }

    const buttonText = publishPostButton.textContent;
    publishPostButton.disabled = true;
    publishPostButton.textContent = "Publishing...";

    const { error } = await supabaseClient
        .from("posts")
        .insert({
            user_id: currentUser.id,
            email: currentUser.email,
            content,
            photo: selectedPostPhoto || null
        });

    publishPostButton.disabled = false;
    publishPostButton.textContent = buttonText;

    if (error) {
        showMessage(`Could not publish post: ${error.message}`, "error");
        console.error("Supabase post publish error:", error);
        return;
    }

    postForm.reset();
    selectedPostPhoto = "";
    postPhotoPreview.src = "";
    postPhotoPreview.classList.add("hidden");
    showMessage("Post published successfully.", "success");

    // Auto-refresh post count metric on current profile container instantly
    const savedProfile = await readSavedProfile();
    if (savedProfile) await showProfileCard(savedProfile);
});

logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;
    logoutButton.textContent = "Logging out...";

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        logoutButton.disabled = false;
        logoutButton.textContent = "Logout";
        showMessage(error.message, "error");
        return;
    }

    window.location.href = "login.html";
});

loadUser();