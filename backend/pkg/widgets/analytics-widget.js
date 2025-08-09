/**
 * Zootel Analytics Widget
 * Tracks visitor interactions and provides analytics data
 * Version: 1.0.0
 */

(function(window) {
    'use strict';

    // Widget constructor
    function ZootelAnalytics(config) {
        this.config = {
            apiKey: '',
            companyId: '',
            apiUrl: 'https://api.zootel.com',
            trackPageViews: true,
            trackClicks: true,
            trackScrolling: true,
            trackFormSubmissions: true,
            sessionTimeout: 30, // minutes
            debug: false,
            ...config
        };

        this.sessionId = null;
        this.visitorId = null;
        this.pageStartTime = Date.now();
        this.scrollDepth = 0;
        this.maxScrollDepth = 0;
        this.eventQueue = [];
        this.isInitialized = false;

        this.init();
    }

    ZootelAnalytics.prototype = {
        init: function() {
            if (!this.config.apiKey || !this.config.companyId) {
                this.log('Error: API key and company ID are required');
                return;
            }

            this.generateVisitorId();
            this.generateSessionId();
            this.setupEventListeners();
            this.trackPageView();
            this.startSession();
            this.isInitialized = true;

            this.log('Analytics widget initialized');
        },

        generateVisitorId: function() {
            // Check if visitor ID exists in localStorage
            this.visitorId = localStorage.getItem('zootel_visitor_id');
            
            if (!this.visitorId) {
                this.visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('zootel_visitor_id', this.visitorId);
            }
        },

        generateSessionId: function() {
            // Check if session is still valid
            const lastActivity = localStorage.getItem('zootel_last_activity');
            const sessionTimeout = this.config.sessionTimeout * 60 * 1000; // Convert to milliseconds
            
            if (lastActivity && (Date.now() - parseInt(lastActivity)) < sessionTimeout) {
                this.sessionId = sessionStorage.getItem('zootel_session_id');
            }

            if (!this.sessionId) {
                this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                sessionStorage.setItem('zootel_session_id', this.sessionId);
            }

            localStorage.setItem('zootel_last_activity', Date.now().toString());
        },

        setupEventListeners: function() {
            const self = this;

            // Track page unload
            window.addEventListener('beforeunload', function() {
                self.trackPageUnload();
            });

            // Track clicks
            if (this.config.trackClicks) {
                document.addEventListener('click', function(event) {
                    self.trackClick(event);
                });
            }

            // Track scrolling
            if (this.config.trackScrolling) {
                let scrollTimeout;
                window.addEventListener('scroll', function() {
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(function() {
                        self.trackScroll();
                    }, 100);
                });
            }

            // Track form submissions
            if (this.config.trackFormSubmissions) {
                document.addEventListener('submit', function(event) {
                    self.trackFormSubmission(event);
                });
            }

            // Update last activity timestamp
            ['click', 'scroll', 'keypress', 'mousemove'].forEach(function(eventType) {
                document.addEventListener(eventType, function() {
                    localStorage.setItem('zootel_last_activity', Date.now().toString());
                });
            });
        },

        trackEvent: function(eventType, eventData, immediate = false) {
            const event = {
                type: eventType,
                timestamp: Date.now(),
                visitorId: this.visitorId,
                sessionId: this.sessionId,
                url: window.location.href,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
                screenResolution: screen.width + 'x' + screen.height,
                viewportSize: window.innerWidth + 'x' + window.innerHeight,
                ...eventData
            };

            if (immediate) {
                this.sendEvent(event);
            } else {
                this.eventQueue.push(event);
                this.flushEventQueue();
            }

            this.log('Event tracked:', event);
        },

        trackPageView: function() {
            this.trackEvent('page_view', {
                title: document.title,
                path: window.location.pathname,
                search: window.location.search,
                hash: window.location.hash
            });
        },

        trackPageUnload: function() {
            const timeOnPage = Date.now() - this.pageStartTime;
            
            this.trackEvent('page_unload', {
                timeOnPage: timeOnPage,
                maxScrollDepth: this.maxScrollDepth
            }, true); // Send immediately
        },

        trackClick: function(event) {
            const element = event.target;
            const elementInfo = this.getElementInfo(element);

            this.trackEvent('click', {
                element: elementInfo,
                coordinates: {
                    x: event.clientX,
                    y: event.clientY
                }
            });
        },

        trackScroll: function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercentage = Math.round((scrollTop / documentHeight) * 100);

            if (scrollPercentage > this.maxScrollDepth) {
                this.maxScrollDepth = scrollPercentage;

                // Track milestone scroll depths
                const milestones = [25, 50, 75, 90, 100];
                for (let milestone of milestones) {
                    if (scrollPercentage >= milestone && this.scrollDepth < milestone) {
                        this.trackEvent('scroll_depth', {
                            depth: milestone
                        });
                        break;
                    }
                }
            }

            this.scrollDepth = scrollPercentage;
        },

        trackFormSubmission: function(event) {
            const form = event.target;
            const formInfo = this.getFormInfo(form);

            this.trackEvent('form_submission', {
                form: formInfo
            });
        },

        trackCustomEvent: function(eventName, properties = {}) {
            this.trackEvent('custom_event', {
                eventName: eventName,
                properties: properties
            });
        },

        trackConversion: function(conversionType, value = null, currency = 'USD') {
            this.trackEvent('conversion', {
                conversionType: conversionType,
                value: value,
                currency: currency
            });
        },

        trackBookingIntent: function(serviceId, companyId) {
            this.trackEvent('booking_intent', {
                serviceId: serviceId,
                companyId: companyId
            });
        },

        trackServiceView: function(serviceId, companyId) {
            this.trackEvent('service_view', {
                serviceId: serviceId,
                companyId: companyId
            });
        },

        startSession: function() {
            this.trackEvent('session_start', {
                isNewVisitor: !localStorage.getItem('zootel_returning_visitor'),
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            // Mark as returning visitor
            localStorage.setItem('zootel_returning_visitor', 'true');
        },

        getElementInfo: function(element) {
            return {
                tagName: element.tagName.toLowerCase(),
                id: element.id || null,
                className: element.className || null,
                text: element.textContent ? element.textContent.substring(0, 100) : null,
                href: element.href || null,
                type: element.type || null
            };
        },

        getFormInfo: function(form) {
            const fields = Array.from(form.elements).map(function(field) {
                return {
                    name: field.name || null,
                    type: field.type || null,
                    required: field.required || false
                };
            });

            return {
                id: form.id || null,
                className: form.className || null,
                method: form.method || 'get',
                action: form.action || null,
                fieldCount: fields.length,
                fields: fields
            };
        },

        flushEventQueue: function() {
            if (this.eventQueue.length === 0) return;

            const events = [...this.eventQueue];
            this.eventQueue = [];

            this.sendEvents(events);
        },

        sendEvent: function(event) {
            this.sendEvents([event]);
        },

        sendEvents: function(events) {
            const payload = {
                apiKey: this.config.apiKey,
                companyId: this.config.companyId,
                events: events
            };

            // Use sendBeacon for reliable delivery
            if (navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify(payload)], {
                    type: 'application/json'
                });
                navigator.sendBeacon(this.config.apiUrl + '/api/analytics/track', blob);
            } else {
                // Fallback to fetch with keepalive
                fetch(this.config.apiUrl + '/api/analytics/track', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                    keepalive: true
                }).catch(function(error) {
                    console.error('Analytics tracking failed:', error);
                });
            }

            this.log('Events sent:', events);
        },

        // Public API methods
        track: function(eventName, properties) {
            this.trackCustomEvent(eventName, properties);
        },

        identify: function(userId, traits) {
            this.trackEvent('identify', {
                userId: userId,
                traits: traits
            });
        },

        page: function(pageName, properties) {
            this.trackEvent('page_view', {
                pageName: pageName,
                properties: properties
            });
        },

        conversion: function(type, value, currency) {
            this.trackConversion(type, value, currency);
        },

        // Utility methods
        getVisitorId: function() {
            return this.visitorId;
        },

        getSessionId: function() {
            return this.sessionId;
        },

        isReturningVisitor: function() {
            return !!localStorage.getItem('zootel_returning_visitor');
        },

        log: function() {
            if (this.config.debug && console && console.log) {
                console.log.apply(console, ['[Zootel Analytics]'].concat(Array.prototype.slice.call(arguments)));
            }
        }
    };

    // Auto-initialization if config is provided via data attributes
    function autoInit() {
        const scripts = document.getElementsByTagName('script');
        let config = {};

        for (let i = 0; i < scripts.length; i++) {
            const script = scripts[i];
            if (script.src && script.src.indexOf('analytics-widget.js') !== -1) {
                // Extract config from data attributes
                const apiKey = script.getAttribute('data-api-key');
                const companyId = script.getAttribute('data-company-id');
                const apiUrl = script.getAttribute('data-api-url');
                const debug = script.getAttribute('data-debug');

                if (apiKey && companyId) {
                    config = {
                        apiKey: apiKey,
                        companyId: companyId,
                        apiUrl: apiUrl || undefined,
                        debug: debug === 'true'
                    };
                    break;
                }
            }
        }

        if (config.apiKey && config.companyId) {
            window.ZootelAnalytics = new ZootelAnalytics(config);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    // Expose to global scope
    window.ZootelAnalytics = window.ZootelAnalytics || ZootelAnalytics;

})(window); 