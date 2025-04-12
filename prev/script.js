function goToChat() {
    const prompt = document.getElementById("promptInput").value.trim();
    if (prompt) {
      window.location.href = `chat.html?prompt=${encodeURIComponent(prompt)}`;
    }
  }
  
  function goToVideo() {
    window.location.href = "video.html";
  }
  
  function sendMessage() {
    const input = document.getElementById("userMessage");
    const chatBox = document.getElementById("chatBox");
    const message = input.value.trim();
  
    if (message) {
      const userDiv = document.createElement("div");
      userDiv.textContent = `You: ${message}`;
      chatBox.appendChild(userDiv);
  
      const aiDiv = document.createElement("div");
      aiDiv.textContent = `AI: Here's a sample explanation about "${message}".`;
      chatBox.appendChild(aiDiv);
  
      input.value = "";
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }
  
  window.onload = function () {
    const title = document.getElementById("chatTitle");
    const params = new URLSearchParams(window.location.search);
    const prompt = params.get("prompt");
  
    if (prompt && title) {
      title.textContent = `Learning Chat: ${prompt}`;
      const chatBox = document.getElementById("chatBox");
      const intro = document.createElement("div");
      intro.textContent = `AI: Sure! Here's a basic study plan for "${prompt}".`;
      chatBox.appendChild(intro);
    }
  };
  