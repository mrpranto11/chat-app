const socket = new WebSocket("wss://chat-app-nw1v.onrender.com");

const messagesBox = document.getElementById("messages");
const input = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const typingIndicator = document.getElementById("typing-indicator");
const imageInput = document.getElementById("imageInput");
const imageBtn = document.getElementById("imageBtn");

// Message received
socket.onmessage = async function(event) {
  const data = event.data instanceof Blob ? await event.data.text() : event.data;

  if (data.startsWith("data:image/")) {
    addImageMessage(data, "you");
  } else if (data === "...typing") {
    typingIndicator.textContent = "Someone is typing...";
  } else if (data === "stop_typing") {
    typingIndicator.textContent = "";
  } else {
    addMessage(data, "you");
  }
};

// Typing indicator
let typingTimeout;
input.addEventListener("input", () => {
  socket.send("...typing");
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.send("stop_typing");
  }, 1000);
});

// Send text
sendBtn.onclick = () => {
  if (input.value.trim()) {
    addMessage(input.value, "me");
    socket.send(input.value.trim());
    input.value = '';
  }
};

// Open image selector
imageBtn.onclick = () => imageInput.click();

// Image selected
imageInput.onchange = () => {
  const file = imageInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result;
    addImageMessage(base64, "me");
    socket.send(base64);
  };
  reader.readAsDataURL(file);
};

// Add text message
function addMessage(text, sender) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  div.textContent = text;
  messagesBox.appendChild(div);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

// Add image message
function addImageMessage(base64, sender) {
  const div = document.createElement("div");
  div.classList.add("message", sender);
  const img = document.createElement("img");
  img.src = base64;
  img.className = "image-msg";
  div.appendChild(img);
  messagesBox.appendChild(div);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}
