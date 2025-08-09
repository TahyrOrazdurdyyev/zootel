(function() {
    'use strict';
    
    // Zootel Chat Widget
    window.ZootelChat = {
        config: {},
        isOpen: false,
        socket: null,
        chatId: null,
        
        init: function(options) {
            this.config = Object.assign({
                apiKey: '',
                companyId: '',
                position: 'bottom-right',
                apiUrl: 'https://api.zootel.com',
                wsUrl: 'wss://api.zootel.com',
                theme: 'light',
                welcomeMessage: 'Hello! How can we help you today?'
            }, options);
            
            this.validateConfig();
            this.loadCSS();
            this.render();
            this.bindEvents();
        },
        
        validateConfig: function() {
            if (!this.config.apiKey) {
                throw new Error('Zootel Chat Widget: API key is required');
            }
            if (!this.config.companyId) {
                throw new Error('Zootel Chat Widget: Company ID is required');
            }
        },
        
        loadCSS: function() {
            if (document.getElementById('zootel-chat-css')) return;
            
            const css = `
                .zootel-chat-widget {
                    position: fixed;
                    z-index: 10000;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .zootel-chat-widget.bottom-right {
                    bottom: 20px;
                    right: 20px;
                }
                .zootel-chat-widget.bottom-left {
                    bottom: 20px;
                    left: 20px;
                }
                .zootel-chat-trigger {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: #007bff;
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .zootel-chat-trigger:hover {
                    transform: scale(1.1);
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
                }
                .zootel-chat-trigger svg {
                    width: 24px;
                    height: 24px;
                    fill: white;
                }
                .zootel-chat-window {
                    width: 350px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
                    display: none;
                    flex-direction: column;
                    position: absolute;
                    bottom: 80px;
                    right: 0;
                }
                .zootel-chat-window.open {
                    display: flex;
                }
                .zootel-chat-header {
                    background: #007bff;
                    color: white;
                    padding: 15px 20px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .zootel-chat-title {
                    font-weight: 600;
                    font-size: 16px;
                }
                .zootel-chat-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                }
                .zootel-chat-messages {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .zootel-chat-message {
                    max-width: 80%;
                    padding: 12px 16px;
                    border-radius: 18px;
                    word-wrap: break-word;
                }
                .zootel-chat-message.incoming {
                    background: #f1f3f4;
                    color: #333;
                    align-self: flex-start;
                }
                .zootel-chat-message.outgoing {
                    background: #007bff;
                    color: white;
                    align-self: flex-end;
                }
                .zootel-chat-message-time {
                    font-size: 11px;
                    opacity: 0.7;
                    margin-top: 4px;
                }
                .zootel-chat-input-area {
                    padding: 15px 20px;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    gap: 10px;
                }
                .zootel-chat-input {
                    flex: 1;
                    border: 1px solid #ddd;
                    border-radius: 20px;
                    padding: 10px 15px;
                    outline: none;
                    font-size: 14px;
                }
                .zootel-chat-send {
                    background: #007bff;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .zootel-chat-send svg {
                    width: 16px;
                    height: 16px;
                    fill: white;
                }
                .zootel-chat-typing {
                    padding: 12px 16px;
                    background: #f1f3f4;
                    border-radius: 18px;
                    align-self: flex-start;
                    font-style: italic;
                    color: #666;
                }
                .zootel-chat-offline {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 14px;
                }
                @media (max-width: 480px) {
                    .zootel-chat-window {
                        width: calc(100vw - 40px);
                        height: calc(100vh - 100px);
                        bottom: 80px;
                        right: 20px;
                    }
                }
            `;
            
            const style = document.createElement('style');
            style.id = 'zootel-chat-css';
            style.textContent = css;
            document.head.appendChild(style);
        },
        
        render: function() {
            const widget = document.createElement('div');
            widget.className = `zootel-chat-widget ${this.config.position}`;
            widget.innerHTML = `
                <button class="zootel-chat-trigger" id="zootel-chat-trigger">
                    <svg viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97C9.02 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                    </svg>
                </button>
                <div class="zootel-chat-window" id="zootel-chat-window">
                    <div class="zootel-chat-header">
                        <div class="zootel-chat-title">Chat with us</div>
                        <button class="zootel-chat-close" id="zootel-chat-close">✕</button>
                    </div>
                    <div class="zootel-chat-messages" id="zootel-chat-messages">
                        <div class="zootel-chat-message incoming">
                            <div>${this.config.welcomeMessage}</div>
                            <div class="zootel-chat-message-time">${this.formatTime(new Date())}</div>
                        </div>
                    </div>
                    <div class="zootel-chat-input-area">
                        <input type="text" class="zootel-chat-input" id="zootel-chat-input" placeholder="Type your message...">
                        <button class="zootel-chat-send" id="zootel-chat-send">
                            <svg viewBox="0 0 24 24">
                                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(widget);
        },
        
        bindEvents: function() {
            const trigger = document.getElementById('zootel-chat-trigger');
            const window = document.getElementById('zootel-chat-window');
            const close = document.getElementById('zootel-chat-close');
            const input = document.getElementById('zootel-chat-input');
            const send = document.getElementById('zootel-chat-send');
            
            trigger.addEventListener('click', () => this.toggleChat());
            close.addEventListener('click', () => this.closeChat());
            send.addEventListener('click', () => this.sendMessage());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        },
        
        toggleChat: function() {
            if (this.isOpen) {
                this.closeChat();
            } else {
                this.openChat();
            }
        },
        
        openChat: function() {
            const window = document.getElementById('zootel-chat-window');
            window.classList.add('open');
            this.isOpen = true;
            
            if (!this.chatId) {
                this.initializeChat();
            }
            
            document.getElementById('zootel-chat-input').focus();
        },
        
        closeChat: function() {
            const window = document.getElementById('zootel-chat-window');
            window.classList.remove('open');
            this.isOpen = false;
        },
        
        initializeChat: function() {
            this.apiCall('/api/v1/chats', {
                method: 'POST',
                body: JSON.stringify({
                    companyId: this.config.companyId,
                    type: 'website_widget'
                })
            })
            .then(data => {
                this.chatId = data.chat.id;
                this.connectWebSocket();
            })
            .catch(error => {
                this.showOfflineMessage();
            });
        },
        
        connectWebSocket: function() {
            if (!this.chatId) return;
            
            this.socket = new WebSocket(`${this.config.wsUrl}/ws/chat/${this.chatId}`);
            
            this.socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.displayMessage(message.content, 'incoming');
            };
            
            this.socket.onerror = () => {
                this.showOfflineMessage();
            };
        },
        
        sendMessage: function() {
            const input = document.getElementById('zootel-chat-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            this.displayMessage(message, 'outgoing');
            input.value = '';
            
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type: 'message',
                    content: message
                }));
            } else {
                // Fallback to API
                this.apiCall(`/api/v1/chats/${this.chatId}/messages`, {
                    method: 'POST',
                    body: JSON.stringify({
                        content: message,
                        senderType: 'website_visitor'
                    })
                });
            }
        },
        
        displayMessage: function(content, type) {
            const messages = document.getElementById('zootel-chat-messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = `zootel-chat-message ${type}`;
            messageDiv.innerHTML = `
                <div>${this.escapeHtml(content)}</div>
                <div class="zootel-chat-message-time">${this.formatTime(new Date())}</div>
            `;
            
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        },
        
        showOfflineMessage: function() {
            const messages = document.getElementById('zootel-chat-messages');
            const offlineDiv = document.createElement('div');
            offlineDiv.className = 'zootel-chat-offline';
            offlineDiv.textContent = 'We are currently offline. Please leave your message and we will get back to you soon.';
            messages.appendChild(offlineDiv);
        },
        
        apiCall: function(endpoint, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'X-Widget-Source': 'chat-widget'
                }
            };
            
            const finalOptions = Object.assign(defaultOptions, options);
            
            return fetch(this.config.apiUrl + endpoint, finalOptions)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    return response.json();
                });
        },
        
        formatTime: function(date) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },
        
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };
    
    // Auto-initialize if data attributes are present
    document.addEventListener('DOMContentLoaded', function() {
        const widget = document.querySelector('[data-zootel-chat]');
        if (widget) {
            const config = {
                apiKey: widget.dataset.apiKey,
                companyId: widget.dataset.companyId,
                position: widget.dataset.position || 'bottom-right'
            };
            
            if (config.apiKey && config.companyId) {
                ZootelChat.init(config);
            }
        }
    });
})(); 