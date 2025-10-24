# Crypto Payments Setup with NowPayments

This document explains how to set up cryptocurrency payments using NowPayments integration.

## Prerequisites

1. **NowPayments Account**: Register at [nowpayments.io](https://nowpayments.io)
2. **API Keys**: Get your API key and public key from NowPayments dashboard
3. **Webhook URL**: Set up webhook endpoint for payment notifications

## Configuration

### 1. Environment Variables

Create a `.env` file or add to your existing environment configuration:

```env
# NowPayments Configuration
NOWPAYMENTS_API_KEY=your-api-key-here
NOWPAYMENTS_PUBLIC_KEY=your-public-key-here
NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1
NOWPAYMENTS_WEBHOOK_URL=https://yourdomain.com/api/v1/webhooks/nowpayments
NOWPAYMENTS_IPN_SECRET=your-ipn-secret-here
```

### 2. Database Migration

Run the crypto payments migration:

```bash
# Run migration script
go run scripts/run-migration/main.go

# Or manually run SQL
psql -h localhost -U postgres -d zootel_dev -f migrations/035_crypto_payments.sql
```

### 3. Webhook Setup

In your NowPayments dashboard:
1. Go to Settings → IPN Settings
2. Set IPN URL to: `https://yourdomain.com/api/v1/webhooks/nowpayments`
3. Set IPN Secret (use the same value as `NOWPAYMENTS_IPN_SECRET`)
4. Enable IPN notifications

## API Endpoints

### Public Endpoints

- `GET /api/v1/crypto/currencies` - Get available crypto currencies
- `GET /api/v1/crypto/currencies/:currency/networks` - Get networks for currency
- `GET /api/v1/crypto/estimate` - Estimate crypto amount
- `GET /api/v1/crypto/payment-methods` - Get payment methods

### Protected Endpoints

- `POST /api/v1/crypto-payments` - Create crypto payment
- `GET /api/v1/crypto-payments/:payment_id/status` - Get payment status

### Webhook Endpoints

- `POST /api/v1/webhooks/nowpayments` - NowPayments webhook

## Frontend Integration

### 1. Payment Method Selection

```jsx
import PaymentMethodSelector from './components/payment/PaymentMethodSelector';

<PaymentMethodSelector
  selectedMethod={paymentMethod}
  onMethodChange={setPaymentMethod}
/>
```

### 2. Crypto Currency Selection

```jsx
import CryptoCurrencySelector from './components/payment/CryptoCurrencySelector';

<CryptoCurrencySelector
  selectedCurrency={selectedCrypto}
  selectedNetwork={selectedNetwork}
  onCurrencyChange={setSelectedCrypto}
  onNetworkChange={setSelectedNetwork}
/>
```

### 3. Complete Payment Form

```jsx
import PaymentForm from './components/payment/PaymentForm';

<PaymentForm
  orderId={orderId}
  amount={totalAmount}
  currency="USD"
  onPaymentCreated={handlePaymentCreated}
  onError={handleError}
/>
```

### 4. Payment Display

```jsx
import CryptoPaymentDisplay from './components/payment/CryptoPaymentDisplay';

<CryptoPaymentDisplay
  paymentId={paymentId}
  onStatusChange={handleStatusChange}
/>
```

## Supported Cryptocurrencies

The system supports the following cryptocurrencies:

- **Bitcoin (BTC)** - Bitcoin network
- **Ethereum (ETH)** - Ethereum network
- **Tether (USDT)** - Ethereum, Polygon, BSC, Solana, Avalanche
- **USD Coin (USDC)** - Ethereum, Polygon, BSC, Solana, Avalanche
- **Binance Coin (BNB)** - BSC network
- **Cardano (ADA)** - Cardano network
- **Solana (SOL)** - Solana network
- **Polygon (MATIC)** - Polygon network
- **Polkadot (DOT)** - Polkadot network
- **Avalanche (AVAX)** - Avalanche network

## Payment Flow

1. **User selects crypto payment** in checkout
2. **User chooses currency and network** from available options
3. **System estimates crypto amount** based on current exchange rate
4. **User confirms payment** and is redirected to payment page
5. **User scans QR code** or copies address to send crypto
6. **System monitors payment** via NowPayments API
7. **Payment is confirmed** when transaction is detected
8. **Order status is updated** to paid

## Security Features

- **Webhook signature verification** using HMAC-SHA256
- **Payment amount validation** to prevent over/under payments
- **Address validation** to ensure correct network
- **Expiration handling** for time-sensitive payments
- **Status monitoring** with automatic updates

## Testing

### Sandbox Mode

For testing, use NowPayments sandbox:
- Set `NOWPAYMENTS_API_URL=https://api-sandbox.nowpayments.io/v1`
- Use sandbox API keys
- Test with small amounts

### Test Payments

1. Create a test order
2. Select crypto payment
3. Use testnet addresses for testing
4. Monitor payment status in logs

## Troubleshooting

### Common Issues

1. **Payment not detected**
   - Check webhook configuration
   - Verify IPN secret matches
   - Check network confirmation requirements

2. **Wrong amount calculated**
   - Verify exchange rate API is working
   - Check currency pair availability
   - Ensure amount is within min/max limits

3. **Payment expired**
   - Check payment timeout settings
   - Verify user completed payment in time
   - Handle expired payments gracefully

### Logs

Check application logs for:
- NowPayments API responses
- Webhook processing
- Payment status updates
- Error messages

## Production Considerations

1. **Rate Limiting**: Implement rate limiting for API calls
2. **Monitoring**: Set up monitoring for payment failures
3. **Backup**: Regular database backups
4. **Security**: Use HTTPS for all webhook endpoints
5. **Compliance**: Ensure compliance with local regulations

## Support

For issues with:
- **NowPayments API**: Contact NowPayments support
- **Integration**: Check this documentation
- **Customization**: Review source code and adapt as needed
