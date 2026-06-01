const chatToggleBtn = document.getElementById('chat-toggle-btn');
const chatWindow = document.getElementById('chat-window');
const chatCloseBtn = document.getElementById('chat-close-btn');
const chatInput = document.getElementById('chat-input');
const chatSendBtn = document.getElementById('chat-send-btn');
const chatMessages = document.getElementById('chat-messages');
const chatHeader = document.querySelector('.chat-header');
const chatSuggestions = document.getElementById('chat-suggestions');

const API_URL = window.SEARCH_CHAT_API_URL || window.CHAT_API_URL || '';

const BOT_SPARKLE_SVG = `<svg class="chat-sparkle" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" /></svg>`;

/** Bumped when a new send starts so in-flight streams stop updating the UI. */
let streamGeneration = 0;

function syncComposerSendState() {
    const empty = chatInput.value.trim().length === 0;
    chatSendBtn.disabled = chatInput.disabled || empty;
}

function setChatBusy(busy) {
    chatInput.disabled = busy;
    if (busy) {
        chatSendBtn.disabled = true;
    } else {
        syncComposerSendState();
    }
}

function appendBotTurnShell() {
    const turn = document.createElement('div');
    turn.classList.add('chat-turn', 'chat-turn--bot');

    const avatar = document.createElement('div');
    avatar.className = 'chat-turn__avatar chat-turn__avatar--bot';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = BOT_SPARKLE_SVG;

    const body = document.createElement('div');
    body.className = 'chat-turn__body';

    const content = document.createElement('div');
    content.className = 'chat-turn__content';

    const feedback = document.createElement('div');
    feedback.className = 'chat-turn__feedback';
    feedback.innerHTML =
        '<button type="button" class="chat-feedback-btn" title="Good response" aria-label="Thumbs up"><i class="far fa-thumbs-up"></i></button>' +
        '<button type="button" class="chat-feedback-btn" title="Poor response" aria-label="Thumbs down"><i class="far fa-thumbs-down"></i></button>';

    body.appendChild(content);
    body.appendChild(feedback);
    turn.appendChild(avatar);
    turn.appendChild(body);
    chatMessages.appendChild(turn);
    return content;
}

function addUserTurn(text) {
    const turn = document.createElement('div');
    turn.classList.add('chat-turn', 'chat-turn--user');

    const avatar = document.createElement('div');
    avatar.className = 'chat-turn__avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = '<i class="fas fa-user"></i>';

    const body = document.createElement('div');
    body.className = 'chat-turn__body';

    const content = document.createElement('div');
    content.className = 'chat-turn__content chat-turn__content--user';
    content.textContent = text;

    body.appendChild(content);
    turn.appendChild(avatar);
    turn.appendChild(body);
    chatMessages.appendChild(turn);
}

// Toggle Chat Window
function toggleChat() {
    chatWindow.classList.toggle('active');
    if (chatWindow.classList.contains('active')) {
        chatInput.focus();
    }
}

chatToggleBtn.addEventListener('click', toggleChat);
chatCloseBtn.addEventListener('click', toggleChat);

chatMessages.addEventListener('click', (e) => {
    const btn = e.target.closest('.chat-feedback-btn');
    if (!btn) return;
    const row = btn.closest('.chat-turn__feedback');
    if (!row) return;
    row.querySelectorAll('.chat-feedback-btn').forEach((b) => b.classList.remove('is-active'));
    btn.classList.add('is-active');
});

if (chatSuggestions) {
    chatSuggestions.addEventListener('click', (e) => {
        const chip = e.target.closest('.chat-suggestion-chip');
        if (!chip) return;
        const q = chip.getAttribute('data-suggestion');
        if (q) {
            chatInput.value = q;
            syncComposerSendState();
            chatInput.focus();
        }
    });
}

chatInput.addEventListener('input', syncComposerSendState);

// Drag
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

chatHeader.addEventListener('mousedown', dragStart);

function dragStart(e) {
    if (window.innerWidth <= 576) return;
    if (e.target === chatCloseBtn || e.target.closest('.chat-close-btn')) return;

    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === chatHeader || chatHeader.contains(e.target)) {
        isDragging = true;
    }
}

function drag(e) {
    if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        xOffset = currentX;
        yOffset = currentY;

        setTranslate(currentX, currentY, chatWindow);
    }
}

function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px) scale(1)`;
}

function dragEnd() {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
}

// Resize
const resizers = document.querySelectorAll('.resizer');
let isResizing = false;
let currentResizer;

resizers.forEach((resizer) => {
    resizer.addEventListener('mousedown', (e) => {
        if (window.innerWidth <= 576) return;
        e.preventDefault();
        isResizing = true;
        currentResizer = resizer;
        document.addEventListener('mousemove', resize);
        document.addEventListener('mouseup', stopResize);
    });
});

function resize(e) {
    if (!isResizing) return;

    if (currentResizer.classList.contains('resizer-t')) {
        const rect = chatWindow.getBoundingClientRect();
        const bottom = rect.bottom;
        const newHeight = bottom - e.clientY;
        if (newHeight > 400 && newHeight < window.innerHeight * 0.8) {
            chatWindow.style.height = newHeight + 'px';
        }
    } else if (currentResizer.classList.contains('resizer-l')) {
        const rect = chatWindow.getBoundingClientRect();
        const right = rect.right;
        const newWidth = right - e.clientX;
        if (newWidth > 300 && newWidth < window.innerWidth * 0.9) {
            chatWindow.style.width = newWidth + 'px';
        }
    } else if (currentResizer.classList.contains('resizer-tl')) {
        const rect = chatWindow.getBoundingClientRect();
        const bottom = rect.bottom;
        const right = rect.right;

        const newHeight = bottom - e.clientY;
        const newWidth = right - e.clientX;

        if (newHeight > 400 && newHeight < window.innerHeight * 0.8) {
            chatWindow.style.height = newHeight + 'px';
        }
        if (newWidth > 300 && newWidth < window.innerWidth * 0.9) {
            chatWindow.style.width = newWidth + 'px';
        }
    }
}

function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
}

document.addEventListener('mousemove', drag);
document.addEventListener('mouseup', dragEnd);

/**
 * Progressive render when the API returns JSON.
 */
function streamRevealMarkdown(fullText, gen) {
    return new Promise((resolve) => {
        const contentEl = appendBotTurnShell();
        contentEl.classList.add('streaming');

        let i = 0;
        const n = fullText.length;
        const minStep = 2;
        const maxStep = 14;

        function tick() {
            if (gen !== streamGeneration) {
                contentEl.classList.remove('streaming');
                resolve();
                return;
            }
            const left = n - i;
            const step = Math.min(maxStep, Math.max(minStep, Math.ceil(left / 24)));
            i = Math.min(n, i + step);
            contentEl.innerHTML = marked.parse(fullText.slice(0, i));
            scrollToBottom();
            if (i < n) {
                requestAnimationFrame(tick);
            } else {
                contentEl.classList.remove('streaming');
                resolve();
            }
        }

        requestAnimationFrame(tick);
    });
}

/**
 * Server-Sent Events (text/event-stream).
 */
async function consumeSseStream(response, gen) {
    const contentEl = appendBotTurnShell();
    contentEl.classList.add('streaming');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let carry = '';
    let acc = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (gen !== streamGeneration) {
                reader.cancel().catch(() => {});
                contentEl.classList.remove('streaming');
                return;
            }

            carry += decoder.decode(value, { stream: true });
            const lines = carry.split('\n');
            carry = lines.pop() ?? '';

            for (const raw of lines) {
                const line = raw.trim();
                if (!line.startsWith('data:')) continue;
                const payload = line.slice(5).trim();
                if (!payload || payload === '[DONE]') continue;

                let delta = '';
                try {
                    const j = JSON.parse(payload);
                    const piece = j.answer ?? j.token ?? j.delta ?? j.content ?? j.text;
                    delta = typeof piece === 'string' ? piece : '';
                } catch {
                    delta = payload;
                }
                if (!delta) continue;
                acc += delta;
                contentEl.innerHTML = marked.parse(acc);
                scrollToBottom();
            }
        }
    } finally {
        try {
            reader.releaseLock();
        } catch {
            /* already released or cancelled */
        }
        if (gen === streamGeneration) {
            contentEl.classList.remove('streaming');
        }
    }
}

async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || chatSendBtn.disabled) return;

    const myGen = ++streamGeneration;

    addUserTurn(message);
    chatInput.value = '';
    syncComposerSendState();

    const loadingId = addLoadingIndicator();
    setChatBusy(true);

    try {
        if (!API_URL) {
            throw new Error('Chat API URL is not configured');
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'text/event-stream, application/json'
            },
            body: JSON.stringify({ question: message })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        removeLoadingIndicator(loadingId);

        const contentType = (response.headers.get('content-type') || '').toLowerCase();

        if (contentType.includes('text/event-stream') && response.body) {
            await consumeSseStream(response, myGen);
        } else {
            const data = await response.json();
            const botResponse = data.answer || data.response || data.result || JSON.stringify(data);
            await streamRevealMarkdown(botResponse, myGen);
        }
    } catch (error) {
        console.error('Error:', error);
        removeLoadingIndicator(loadingId);
        if (myGen === streamGeneration) {
            const contentEl = appendBotTurnShell();
            contentEl.innerHTML = marked.parse('Sorry, something went wrong. Please try again later.');
        }
    } finally {
        if (myGen === streamGeneration) {
            setChatBusy(false);
        }
    }
}

chatSendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!chatSendBtn.disabled) sendMessage();
    }
});

function addMessage(text, sender) {
    if (sender === 'user') {
        addUserTurn(text);
    } else {
        const contentEl = appendBotTurnShell();
        contentEl.innerHTML = marked.parse(text);
    }
    scrollToBottom();
}

function addLoadingIndicator() {
    const id = 'loading-' + Date.now();
    const turn = document.createElement('div');
    turn.classList.add('chat-turn', 'chat-turn--bot', 'chat-turn--typing');

    const avatar = document.createElement('div');
    avatar.className = 'chat-turn__avatar chat-turn__avatar--bot';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.innerHTML = BOT_SPARKLE_SVG;

    const body = document.createElement('div');
    body.className = 'chat-turn__body';

    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('typing-indicator');
    loadingDiv.id = id;
    loadingDiv.innerHTML = `
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
    `;

    body.appendChild(loadingDiv);
    turn.appendChild(avatar);
    turn.appendChild(body);
    chatMessages.appendChild(turn);
    scrollToBottom();
    return id;
}

function removeLoadingIndicator(id) {
    const element = document.getElementById(id);
    if (element) {
        const turn = element.closest('.chat-turn');
        if (turn) turn.remove();
        else element.remove();
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

syncComposerSendState();
