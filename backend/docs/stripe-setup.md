# Stripe Setup Guide for Zootel

This guide explains how to set up Stripe for payment processing in the Zootel platform.

## Overview

Zootel supports flexible payment configurations:
- **Offline Payments**: Manual processing without Stripe
- **Direct Payments**: Stripe charges directly to business accounts
- **Platform Fees**: Commission-based revenue model
- **Free Trial**: Trial periods without automatic charges

## Prerequisites

- Stripe account ([Create one here](https://stripe.com))
- Stripe CLI installed (optional, for webhooks)
- Understanding of Stripe Connect for multi-party payments

## Step 1: Create Stripe Account

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up or log in
3. Complete account verification
4. Note down your account ID (starts with `acct_`)

## Step 2: Get API Keys

### Development Keys

1. In Stripe Dashboard, go to "Developers" → "API keys"
2. Copy the following keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Production Keys

1. Toggle to "View live data" in Stripe Dashboard
2. Copy the live keys:
   - **Publishable key** (starts with `pk_live_`)
   - **Secret key** (starts with `sk_live_`)

## Step 3: Configure Environment Variables

### Backend Configuration

Add to `backend/.env.development`:

```env
STRIPE_ENABLED=true
COMMISSION_ENABLED=true
COMMISSION_PERCENTAGE=10
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
```

Add to `backend/.env.production`:

```env
STRIPE_ENABLED=true
COMMISSION_ENABLED=true
COMMISSION_PERCENTAGE=10
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
```

### Frontend Configuration

Add to `frontend/.env.development`:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

Add to `frontend/.env.production`:

```env
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
```

## Step 4: Set Up Stripe Connect (for Commission Model)

If using commission-based payments, set up Stripe Connect:

1. In Stripe Dashboard, go to "Connect" → "Settings"
2. Choose "Standard accounts" for easier onboarding
3. Configure your application:
   - **Application name**: "Zootel"
   - **Logo**: Upload Zootel logo
   - **Website**: `https://zootel.shop`

## Step 5: Configure Webhooks

### Create Webhook Endpoint

1. In Stripe Dashboard, go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Enter endpoint URL:
   - **Development**: `https://your-ngrok-url.ngrok.io/webhooks/stripe`
   - **Production**: `https://zootel.shop/webhooks/stripe`

### Select Events

Add the following events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `account.updated` (for Connect)
- `checkout.session.completed`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Get Webhook Secret

1. After creating the webhook, click on it
2. Copy the "Signing secret" (starts with `whsec_`)
3. Add to environment variables:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Step 6: Payment Flow Configuration

### Payment Methods

The platform supports multiple payment flows:

#### 1. Offline Payments (Default)

```env
STRIPE_ENABLED=false
```

- Shows "Offline Payment" button
- Displays manual payment instructions
- No automatic charging

#### 2. Direct Payments

```env
STRIPE_ENABLED=true
COMMISSION_ENABLED=false
```

- Payments go directly to business accounts
- No platform commission
- Businesses manage their own Stripe accounts

#### 3. Platform Commission

```env
STRIPE_ENABLED=true
COMMISSION_ENABLED=true
COMMISSION_PERCENTAGE=10
```

- Platform takes a percentage of each transaction
- Requires Stripe Connect setup
- Automatic fee collection

## Step 7: Free Trial Configuration

### Company Plans

Set up plans with free trials:

```sql
INSERT INTO plans (name, price, free_trial_enabled, free_trial_days) VALUES
('Starter', 29.99, true, 14),
('Professional', 79.99, true, 14),
('Enterprise', 199.99, true, 30);
```

### Trial Logic

- `trial_expired=false`: Company in trial period
- `trial_expired=true`: Trial ended, payment required
- No automatic charges during trial
- Manual activation after trial

## Step 8: Test Payments

### Test Card Numbers

Use Stripe's test cards:

- **Visa**: `4242424242424242`
- **Mastercard**: `5555555555554444`
- **Declined**: `4000000000000002`
- **Insufficient funds**: `4000000000009995`

### Test Scenarios

1. **Successful booking payment**:
   ```bash
   curl -X POST http://localhost:4000/api/v1/payments/create-intent \
     -H "Authorization: Bearer your_token" \
     -H "Content-Type: application/json" \
     -d '{"amount": 5000, "currency": "usd", "booking_id": "booking_123"}'
   ```

2. **Order payment with commission**:
   ```bash
   curl -X POST http://localhost:4000/api/v1/payments/create-intent \
     -H "Authorization: Bearer your_token" \
     -H "Content-Type: application/json" \
     -d '{"amount": 10000, "currency": "usd", "order_id": "order_123", "application_fee": 1000}'
   ```

## Step 9: Production Deployment

### Security Checklist

- [ ] Use HTTPS for all payment endpoints
- [ ] Validate webhook signatures
- [ ] Store sensitive data encrypted
- [ ] Implement rate limiting
- [ ] Log all payment events
- [ ] Set up monitoring and alerts

### Go Live Checklist

1. **Complete Stripe account verification**
2. **Test all payment flows**
3. **Verify webhook endpoints**
4. **Update to live API keys**
5. **Enable live mode in Stripe Dashboard**
6. **Monitor payment logs**

## Step 10: Monitoring and Analytics

### Stripe Dashboard

Monitor payments in Stripe Dashboard:
- **Payments**: Track successful/failed transactions
- **Connect**: Monitor connected accounts
- **Radar**: Fraud detection and prevention
- **Reports**: Financial reporting

### Custom Analytics

The platform tracks:
- Payment success/failure rates
- Commission revenue
- Trial conversion rates
- Popular payment methods

## Payment Types Supported

### 1. Service Bookings

```go
type BookingPayment struct {
    BookingID   string  `json:"booking_id"`
    ServiceID   string  `json:"service_id"`
    Amount      float64 `json:"amount"`
    Currency    string  `json:"currency"`
    CompanyID   string  `json:"company_id"`
}
```

### 2. Product Orders

```go
type OrderPayment struct {
    OrderID     string  `json:"order_id"`
    Items       []Item  `json:"items"`
    Total       float64 `json:"total"`
    Shipping    float64 `json:"shipping"`
    Tax         float64 `json:"tax"`
    CompanyID   string  `json:"company_id"`
}
```

### 3. Subscription Plans

```go
type PlanPayment struct {
    PlanID      string  `json:"plan_id"`
    CompanyID   string  `json:"company_id"`
    Amount      float64 `json:"amount"`
    Interval    string  `json:"interval"` // monthly, yearly
}
```

## Error Handling

### Common Errors

1. **Card declined**:
   ```json
   {
     "error": "Your card was declined.",
     "code": "card_declined",
     "decline_code": "generic_decline"
   }
   ```

2. **Insufficient funds**:
   ```json
   {
     "error": "Your card has insufficient funds.",
     "code": "card_declined",
     "decline_code": "insufficient_funds"
   }
   ```

3. **Authentication required**:
   ```json
   {
     "error": "Your card requires authentication.",
     "code": "authentication_required"
   }
   ```

### Error Recovery

- Show user-friendly error messages
- Suggest alternative payment methods
- Provide customer support contact
- Log errors for analysis

## Compliance and Security

### PCI Compliance

- Use Stripe Elements for card collection
- Never store card data on your servers
- Implement HTTPS everywhere
- Regular security audits

### GDPR Compliance

- Customer data retention policies
- Right to be forgotten implementation
- Privacy policy updates
- Consent management

## Troubleshooting

### Common Issues

1. **Webhooks not receiving events**:
   - Check endpoint URL accessibility
   - Verify webhook signature validation
   - Check firewall/security settings

2. **Payments failing in production**:
   - Verify live API keys
   - Check account activation status
   - Review Stripe account limits

3. **Connect account issues**:
   - Verify business verification status
   - Check payout settings
   - Review account capabilities

### Debugging Tools

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:4000/webhooks/stripe

# Test webhook delivery
stripe trigger payment_intent.succeeded

# View webhook logs
stripe logs tail
```

## Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Connect Guide](https://stripe.com/docs/connect)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Guide](https://stripe.com/docs/testing)

## Support

For Stripe-related issues:
- [Stripe Support](https://support.stripe.com/)
- [Community Forum](https://community.stripe.com/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/stripe-payments) 