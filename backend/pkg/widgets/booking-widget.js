(function() {
    'use strict';
    
    // Zootel Booking Widget
    window.ZootelBooking = {
        config: {},
        
        init: function(options) {
            this.config = Object.assign({
                apiKey: '',
                companyId: '',
                container: '#zootel-booking-widget',
                apiUrl: 'https://api.zootel.com',
                theme: 'light'
            }, options);
            
            this.validateConfig();
            this.loadCSS();
            this.render();
            this.bindEvents();
        },
        
        validateConfig: function() {
            if (!this.config.apiKey) {
                throw new Error('Zootel Booking Widget: API key is required');
            }
            if (!this.config.companyId) {
                throw new Error('Zootel Booking Widget: Company ID is required');
            }
        },
        
        loadCSS: function() {
            if (document.getElementById('zootel-booking-css')) return;
            
            const css = `
                .zootel-booking-widget {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 500px;
                    margin: 0 auto;
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 20px;
                    background: white;
                }
                .zootel-booking-title {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                    color: #333;
                }
                .zootel-booking-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .zootel-booking-field {
                    display: flex;
                    flex-direction: column;
                }
                .zootel-booking-label {
                    font-weight: 500;
                    margin-bottom: 5px;
                    color: #555;
                }
                .zootel-booking-input,
                .zootel-booking-select {
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .zootel-booking-button {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 4px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .zootel-booking-button:hover {
                    background: #0056b3;
                }
                .zootel-booking-button:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                .zootel-booking-loading {
                    text-align: center;
                    padding: 20px;
                }
                .zootel-booking-error {
                    color: #dc3545;
                    background: #f8d7da;
                    border: 1px solid #f5c6cb;
                    padding: 10px;
                    border-radius: 4px;
                    margin-bottom: 15px;
                }
                .zootel-booking-success {
                    color: #155724;
                    background: #d4edda;
                    border: 1px solid #c3e6cb;
                    padding: 15px;
                    border-radius: 4px;
                    text-align: center;
                }
            `;
            
            const style = document.createElement('style');
            style.id = 'zootel-booking-css';
            style.textContent = css;
            document.head.appendChild(style);
        },
        
        render: function() {
            const container = document.querySelector(this.config.container);
            if (!container) {
                throw new Error('Zootel Booking Widget: Container not found');
            }
            
            container.innerHTML = `
                <div class="zootel-booking-widget">
                    <h3 class="zootel-booking-title">Book a Service</h3>
                    <div id="zootel-booking-content">
                        <div class="zootel-booking-loading">Loading services...</div>
                    </div>
                </div>
            `;
            
            this.loadServices();
        },
        
        loadServices: function() {
            this.apiCall(`/api/v1/marketplace/companies/${this.config.companyId}/services`)
                .then(data => {
                    this.renderBookingForm(data.services || []);
                })
                .catch(error => {
                    this.showError('Failed to load services. Please try again.');
                });
        },
        
        renderBookingForm: function(services) {
            const content = document.getElementById('zootel-booking-content');
            
            content.innerHTML = `
                <form class="zootel-booking-form" id="zootel-booking-form">
                    <div class="zootel-booking-field">
                        <label class="zootel-booking-label">Service</label>
                        <select class="zootel-booking-select" name="serviceId" required>
                            <option value="">Select a service</option>
                            ${services.map(service => 
                                `<option value="${service.id}">${service.name} - $${service.price}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="zootel-booking-field">
                        <label class="zootel-booking-label">Date</label>
                        <input type="date" class="zootel-booking-input" name="date" required min="${this.getTomorrowDate()}">
                    </div>
                    
                    <div class="zootel-booking-field">
                        <label class="zootel-booking-label">Time</label>
                        <select class="zootel-booking-select" name="time" required>
                            <option value="">Select time</option>
                            ${this.generateTimeSlots().map(time => 
                                `<option value="${time}">${time}</option>`
                            ).join('')}
                        </select>
                    </div>
                    
                    <div class="zootel-booking-field">
                        <label class="zootel-booking-label">Your Name</label>
                        <input type="text" class="zootel-booking-input" name="customerName" required>
                    </div>
                    
                    <div class="zootel-booking-field">
                        <label class="zootel-booking-label">Email</label>
                        <input type="email" class="zootel-booking-input" name="customerEmail" required>
                    </div>
                    
                    <div class="zootel-booking-field">
                        <label class="zootel-booking-label">Phone</label>
                        <input type="tel" class="zootel-booking-input" name="customerPhone" required>
                    </div>
                    
                    <div class="zootel-booking-field">
                        <label class="zootel-booking-label">Pet Name</label>
                        <input type="text" class="zootel-booking-input" name="petName" required>
                    </div>
                    
                    <div class="zootel-booking-field">
                        <label class="zootel-booking-label">Special Notes</label>
                        <textarea class="zootel-booking-input" name="notes" rows="3" placeholder="Any special requirements or notes..."></textarea>
                    </div>
                    
                    <button type="submit" class="zootel-booking-button">Book Now</button>
                </form>
            `;
        },
        
        bindEvents: function() {
            document.addEventListener('submit', (e) => {
                if (e.target.id === 'zootel-booking-form') {
                    e.preventDefault();
                    this.submitBooking(e.target);
                }
            });
        },
        
        submitBooking: function(form) {
            const formData = new FormData(form);
            const data = {};
            for (let [key, value] of formData.entries()) {
                data[key] = value;
            }
            
            // Combine date and time
            data.dateTime = `${data.date}T${data.time}:00.000Z`;
            delete data.date;
            delete data.time;
            
            const button = form.querySelector('button[type="submit"]');
            button.disabled = true;
            button.textContent = 'Booking...';
            
            this.apiCall('/api/v1/bookings', {
                method: 'POST',
                body: JSON.stringify(data)
            })
            .then(response => {
                this.showSuccess('Booking successful! You will receive a confirmation email shortly.');
                form.reset();
            })
            .catch(error => {
                this.showError('Booking failed. Please try again or contact us directly.');
            })
            .finally(() => {
                button.disabled = false;
                button.textContent = 'Book Now';
            });
        },
        
        apiCall: function(endpoint, options = {}) {
            const defaultOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'X-Widget-Source': 'booking-widget'
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
        
        showError: function(message) {
            const content = document.getElementById('zootel-booking-content');
            content.innerHTML = `
                <div class="zootel-booking-error">${message}</div>
                ${content.innerHTML}
            `;
        },
        
        showSuccess: function(message) {
            const content = document.getElementById('zootel-booking-content');
            content.innerHTML = `<div class="zootel-booking-success">${message}</div>`;
        },
        
        getTomorrowDate: function() {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            return tomorrow.toISOString().split('T')[0];
        },
        
        generateTimeSlots: function() {
            const slots = [];
            for (let hour = 9; hour <= 17; hour++) {
                slots.push(`${hour.toString().padStart(2, '0')}:00`);
                if (hour < 17) {
                    slots.push(`${hour.toString().padStart(2, '0')}:30`);
                }
            }
            return slots;
        }
    };
    
    // Auto-initialize if data attributes are present
    document.addEventListener('DOMContentLoaded', function() {
        const widget = document.querySelector('[data-zootel-booking]');
        if (widget) {
            const config = {
                apiKey: widget.dataset.apiKey,
                companyId: widget.dataset.companyId,
                container: widget
            };
            
            if (config.apiKey && config.companyId) {
                ZootelBooking.init(config);
            }
        }
    });
})(); 