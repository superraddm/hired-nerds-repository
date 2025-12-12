(() => {
    const widgetStyle = `
        #hn-chat-launcher {
            position: fixed; bottom: 20px; right: 20px;
            width: 56px; height: 56px;
            border-radius: 50%;
            background: #202020;
            color: #fff;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; z-index: 9999;
            font-size: 24px; user-select: none;
        }
        #hn-chat-window {
            position: fixed; bottom: 90px; right: 20px;
            width: 340px; height: 480px;
            background: #111; color: #fff;
            border: 1px solid #333;
            border-radius: 12px;
            display: none; flex-direction: column;
            z-index: 9999; overflow: hidden;
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
    `;

    const styleEl = document.createElement("style");
    styleEl.textContent = widgetStyle;
    document.head.appendChild(styleEl);

    const launcher = document.createElement("div");
    launcher.id = "hn-chat-launcher";
    launcher.textContent = "💬";
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

    input.addEventListener("keypress", async (ev) => {
        if (ev.key !== "Enter") return;

        const query = input.value.trim();
        if (!query) return;
        input.value = "";

        const userMsg = document.createElement("div");
        userMsg.textContent = "USER: " + query;
        messages.appendChild(userMsg);

        const res = await fetch("https://app.joffad.workers.dev/api/chat", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ question: query })
        });

        const data = await res.json();

        const botMsg = document.createElement("div");
        botMsg.textContent = data.answer;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
    });
})();
