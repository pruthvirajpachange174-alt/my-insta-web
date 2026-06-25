const messagesList = document.getElementById("messagesList");
const messageStatus = document.getElementById("message");
let currentUser = null;

function getDefaultPhoto() {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Crect width='240' height='240' rx='28' fill='%231f7a8c'/%3E%3Ccircle cx='120' cy='92' r='42' fill='white' opacity='.95'/%3E%3Cpath d='M48 204c11-45 43-70 72-70s61 25 72 70' fill='white' opacity='.95'/%3E%3C/svg%3E";
}

async function loadMessages() {
    const { data, error } = await supabaseClient
        .from("messages")
        .select("id, content, created_at, sender:profiles!messages_sender_id_profiles_id_fkey(name, email, picture)")
        .eq("receiver_id", currentUser.id)
        .order("created_at", { ascending: false });

    if (error) {
        messagesList.innerHTML = '<p class="empty-state">Failed to download messaging records.</p>';
        return;
    }
    renderMessages(data || []);
}

function renderMessages(messages) {
    messagesList.innerHTML = "";
    if (!messages.length) {
        messagesList.innerHTML = '<p class="empty-state">No messages received yet.</p>';
        return;
    }

    messages.forEach((msg) => {
        const card = document.createElement("article");
        card.className = "message-card";

        const header = document.createElement("div");
        header.className = "post-header";

        const avatar = document.createElement("img");
        avatar.src = msg.sender?.picture || getDefaultPhoto();

        const info = document.createElement("div");
        const name = document.createElement("h3");
        name.textContent = msg.sender?.name || msg.sender?.email || "Student Connection";
        
        const time = document.createElement("p");
        time.textContent = new Date(msg.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

        info.append(name, time);
        header.append(avatar, info);

        const body = document.createElement("p");
        body.className = "post-body";
        body.textContent = msg.content;

        card.append(header, body);
        messagesList.appendChild(card);
    });
}

async function init() {
    const { data } = await supabaseClient.auth.getUser();
    if (!data.user) { window.location.href = "login.html"; return; }
    currentUser = data.user;
    await loadMessages();
}
init();