# Zootel Website Integration Widgets

This directory contains JavaScript widgets that can be embedded on company websites to integrate with the Zootel platform.

## Available Widgets

### 1. Booking Widget (`booking-widget.js`)
Allows customers to book services directly from the company website.

**Features:**
- Service selection
- Date and time picker
- Pet information form
- Real-time availability checking
- Booking confirmation

**Usage:**
```html
<div id="zootel-booking-widget"></div>
<script src="https://api.zootel.com/widgets/booking-widget.js"></script>
<script>
  ZootelBooking.init({
    apiKey: 'your-api-key',
    container: '#zootel-booking-widget',
    companyId: 'your-company-id'
  });
</script>
```

### 2. Chat Widget (`chat-widget.js`)
Provides real-time chat functionality on company websites.

**Features:**
- Live chat with company representatives
- AI-powered responses
- File and image sharing
- Chat history
- Offline message support

**Usage:**
```html
<script src="https://api.zootel.com/widgets/chat-widget.js"></script>
<script>
  ZootelChat.init({
    apiKey: 'your-api-key',
    companyId: 'your-company-id',
    position: 'bottom-right'
  });
</script>
```

### 3. Analytics Widget (`analytics-widget.js`)
Tracks visitor interactions and provides analytics data.

**Features:**
- Page view tracking
- User interaction tracking
- Conversion tracking
- Custom event tracking

**Usage:**
```html
<script src="https://api.zootel.com/widgets/analytics-widget.js"></script>
<script>
  ZootelAnalytics.init({
    apiKey: 'your-api-key',
    companyId: 'your-company-id'
  });
</script>
```

## Implementation Examples

See `examples.html` for complete implementation examples of all widgets.

## API Integration

All widgets communicate with the Zootel API using the company's API key. Make sure to:

1. Enable website integration in your Zootel company settings
2. Add your website domain to the allowed domains list
3. Use the provided API key in widget configuration

## Customization

Widgets can be customized using CSS and configuration options. See individual widget documentation for styling guidelines and available options.

## Support

For technical support and implementation assistance, contact the Zootel development team. 