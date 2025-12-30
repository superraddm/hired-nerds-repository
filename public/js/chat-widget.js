(() => {
    const widgetStyle = `
        #hn-chat-launcher {
            position: fixed; bottom: 20px; right: 20px;
            width: 120px; height: 80px;
            border-radius: 15%;
            background: #202020;
            color: #fff;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 9999;
            font-size: 24px; user-select: none;
            z-index: 2000;
        }
        #hn-chat-window {
            position: fixed; bottom: 90px; right: 20px;
            width: 340px; height: 480px;
            background: #111; color: #fff;
            border: 1px solid #333;
            border-radius: 12px;
            display: none; flex-direction: column;
            z-index: 9999; overflow: hidden;
            z-index: 2000;
        }
        #hn-chat-messages {
            flex: 1; padding: 12px; overflow-y: auto;
        }
        #hn-chat-input-wrap {
            padding: 8px; background: #222;
        }
        #hn-chat-input {
            width: 100%; padding: 8px;
            border: none; border-radius: 6px;
        }
        .hn-user-message {
            background: #2a2a2a;
            color: #e0e0e0;
            padding: 8px 10px;
            border-radius: 6px;
            margin-bottom: 6px;
            font-size: 14px;
        }

        .hn-bot-message {
            background: #1f1f1f;
            color: #d6d6d6;
            padding: 8px 10px;
            border-radius: 6px;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .hn-thinking {
            background: #1f1f1f;
            color: #a8a8a8;
            padding: 8px 10px;
            border-radius: 6px;
            margin-bottom: 10px;
            font-size: 14px;
            font-style: italic;
        }

        .hn-ellipsis::after {
            content: "";
            animation: hn-ellipsis 1.4s infinite;
        }

        @keyframes hn-ellipsis {
            0%   { content: ""; }
            25%  { content: "."; }
            50%  { content: ".."; }
            75%  { content: "..."; }
            100% { content: ""; }
        }
    `;

    const styleEl = document.createElement("style");
    styleEl.textContent = widgetStyle;
    document.head.appendChild(styleEl);

    const launcher = document.createElement("div");
    launcher.id = "hn-chat-launcher";
    launcher.textContent = "💬 Ask the AI";
    document.body.appendChild(launcher);

    const win = document.createElement("div");
    win.id = "hn-chat-window";
    win.innerHTML = `
        <div id="hn-chat-messages"></div>
        <div id="hn-chat-input-wrap">
            <input id="hn-chat-input" placeholder="Ask literally anything about Jof's career…" />
        </div>`;
    document.body.appendChild(win);

    launcher.onclick = () => {
        win.style.display = win.style.display === "flex" ? "none" : "flex";
    };

    const input = win.querySelector("#hn-chat-input");
    const messages = win.querySelector("#hn-chat-messages");
    const introMsg = document.createElement("div");
            introMsg.className = "hn-bot-message";
            introMsg.textContent =
            "AI Bot: This assistant answers questions about Jof Davies using a curated reference archive built from his documented career, projects, and technical work. I do not guess, embellish, or invent—if something is not in my dataset, I simply do not know. Please ask me something about Jof.";
            messages.appendChild(introMsg);

    input.addEventListener("keypress", async (ev) => {
    if (ev.key !== "Enter") return;

    const query = input.value.trim();
    if (!query) return;
    input.value = "";

    // USER message
    const userMsg = document.createElement("div");
    userMsg.className = "hn-user-message";
    userMsg.textContent = "USER: " + query;
    messages.appendChild(userMsg);

    // THINKING indicator (NEW)
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "hn-thinking";
    thinkingMsg.innerHTML = 'AI Bot is thinking<span class="hn-ellipsis"></span>';

    messages.appendChild(thinkingMsg);
    messages.scrollTop = messages.scrollHeight;
    try {
        const res = await fetch("https://jofdavies.com/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: query }),
        });

        const data = await res.json();

        // Remove thinking indicator
        thinkingMsg.remove();

        if (data.action === "open-contact-form") {
            const botMsg = document.createElement("div");
            botMsg.className = "hn-bot-message";
            botMsg.textContent =
                "You can use this popup contact form. If you close it, click below to open it again.";
            messages.appendChild(botMsg);
        } else {
            const botMsg = document.createElement("div");
            botMsg.className = "hn-bot-message";
            botMsg.textContent = "AI Bot: " + data.answer;
            messages.appendChild(botMsg);
        }


        // --- ACTION: OPEN CONTACT MODAL ---
if (data.action === "open-contact-form") {
    // Attempt immediate open
    const tryOpen = () => {
        if (typeof window.openContactModal === "function") {
            window.openContactModal();
            return true;
        }
        if (typeof openContactModal === "function") {
            openContactModal();
            return true;
        }
        return false;
    };

    // Modal HTML is injected on DOMContentLoaded; if not ready, retry briefly.
        if (!tryOpen()) {
            let attempts = 0;
            const timer = setInterval(() => {
                attempts++;
                if (tryOpen() || attempts >= 10) {
                    clearInterval(timer);
                    if (attempts >= 10) {
                        console.error("Contact modal not available (openContactModal missing or modal not loaded).");
                    }
                }
            }, 150);
        }

        // Optional: still show a manual button as fallback
        const contactBtn = document.createElement("button");
        contactBtn.textContent = "Contact Jof";
        contactBtn.style.marginTop = "6px";
        contactBtn.style.padding = "6px 10px";
        contactBtn.style.borderRadius = "6px";
        contactBtn.style.border = "1px solid #444";
        contactBtn.style.background = "#222";
        contactBtn.style.color = "#fff";
        contactBtn.style.cursor = "pointer";
        contactBtn.style.fontSize = "13px";

        contactBtn.addEventListener("click", () => {
            if (!tryOpen()) {
                console.error("Contact modal not available on click.");
            }
        });

        messages.appendChild(contactBtn);
    }


    } catch (err) {
        thinkingMsg.remove();

        const errorMsg = document.createElement("div");
        errorMsg.className = "hn-bot-message";
        errorMsg.textContent =
            "AI Bot: An error occurred while processing your request.";
        messages.appendChild(errorMsg);
    }

    messages.scrollTop = messages.scrollHeight;
});

})();
