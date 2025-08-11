# Trial System Setup Guide

## Overview

The trial system in Zootel automatically manages free trial periods for companies, handles expiration notifications, and provides manual control for SuperAdmins.

## Features

### 1. **Automatic Trial Management**
- Companies get a free trial when they register
- Trial periods are configurable per plan (default: 14-30 days)
- Automatic expiration check and status updates
- No automatic billing - companies are moved to read-only mode when trial expires

### 2. **Trial Status Tracking**
- `trial_expired` flag in companies table
- `trial_ends_at` timestamp for precise tracking
- `subscription_status` field for subscription state management
- Real-time trial status API for frontend

### 3. **Notification System**
- Email and push notifications for trial expiring (7 days, 3 days)
- Trial expired notifications
- Subscription activation confirmations
- In-app notification banners

### 4. **SuperAdmin Controls**
- Manual trial extension for specific companies
- Bulk trial management
- View companies with expired or expiring trials
- Manual subscription activation
- Trial analytics and reporting

## API Endpoints

### Company Endpoints
```
GET /api/companies/trial-status - Get current company trial status
```

### SuperAdmin Endpoints
```
POST /api/admin/companies/:company_id/extend-trial - Extend trial for specific company
POST /api/admin/companies/activate-subscription - Activate paid subscription
POST /api/admin/process-expired-trials - Run expired trial check manually
GET /api/admin/companies/trial-expiring?days=7 - Get companies with trials expiring
GET /api/admin/companies/expired-trials - Get companies with expired trials
GET /api/admin/companies/on-trial - Get companies currently on trial
```

## Database Schema

### Companies Table Updates
```sql
-- New fields added:
trial_ends_at TIMESTAMP NULL
subscription_expires_at TIMESTAMP NULL  
subscription_status VARCHAR(20) DEFAULT 'trial'

-- Existing fields:
trial_expired BOOLEAN DEFAULT false
plan_id UUID REFERENCES plans(id)
```

### Plans Table
```sql
-- Trial configuration:
free_trial_enabled BOOLEAN DEFAULT true
free_trial_days INTEGER DEFAULT 30
```

## Frontend Integration

### Trial Status Display
- Header indicator showing trial status
- Banner notifications for expired/expiring trials
- Upgrade prompts and calls-to-action
- Read-only mode restrictions

### Components Added
- `TrialStatusIndicator` - Header status badge
- `TrialExpiredBanner` - Expired trial warning
- `TrialExpiringSoonBanner` - Expiring trial warning

## Middleware Protection

### TrialStatusMiddleware
- Checks trial status for all company operations
- Blocks write operations for expired trials
- Allows read-only access to essential data
- Returns HTTP 402 (Payment Required) for blocked actions

Protected endpoints return:
```json
{
  "error": "trial_expired",
  "message": "Your free trial has expired. Please upgrade your plan to continue using the service.",
  "trial_expired": true,
  "company_id": "uuid"
}
```

## Cron Job Setup

### Automated Trial Checking
Located at: `backend/cmd/trial-checker/main.go`

**Build and run:**
```bash
cd backend
go build -o trial-checker ./cmd/trial-checker
./trial-checker
```

**Schedule recommended:** Every 6 hours
```bash
# Add to crontab
0 */6 * * * cd /path/to/zootel/backend && ./trial-checker >> /var/log/trial-checker.log 2>&1
```

**What it does:**
1. Checks for expired trials and updates database
2. Sends notifications to companies with expired trials
3. Sends warning notifications (7 days, 3 days before expiry)
4. Logs all activities for monitoring

## SuperAdmin Workflow

### 1. **Monitor Trial Status**
```bash
GET /api/admin/companies/trial-expiring?days=7
```
- View companies with trials expiring soon
- Proactive outreach for renewals

### 2. **Extend Trials Manually**
```bash
POST /api/admin/companies/:company_id/extend-trial
{
  "additional_days": 14
}
```
- Grant additional trial time
- Good for customer service cases

### 3. **Activate Paid Subscriptions**
```bash
POST /api/admin/companies/activate-subscription
{
  "company_id": "uuid",
  "plan_id": "uuid", 
  "billing_cycle": "monthly"
}
```
- Manually activate when payment is confirmed outside system
- Restores full access immediately

### 4. **Process Expired Trials**
```bash
POST /api/admin/process-expired-trials
```
- Manually trigger trial expiration check
- Useful for testing or immediate processing

## Configuration

### Plan Settings
In SuperAdmin panel (`/admin/plans`):
- Enable/disable free trials per plan
- Set trial duration (days)
- Configure plan features and pricing

### Payment Settings
- `stripe_enabled: false` - No automatic billing
- Companies stay in read-only mode until manual activation
- Future: Can enable automatic billing when ready

## Notification Templates

### Trial Expiring (7 days)
- **Subject:** "Your free trial expires in 7 days"
- **Action:** Upgrade prompt with plan selection

### Trial Expiring (3 days)  
- **Subject:** "Your free trial expires in 3 days"
- **Action:** Urgent upgrade prompt

### Trial Expired
- **Subject:** "Your free trial has expired" 
- **Action:** Account in read-only mode, upgrade required

### Subscription Activated
- **Subject:** "Subscription activated successfully"
- **Action:** Welcome back message with full access restored

## Testing

### Test Trial Expiration
1. Create test company with short trial (1 day)
2. Wait for trial to expire or manually set `trial_ends_at` to past date
3. Run cron job or manual processing
4. Verify notifications sent and access restricted

### Test Manual Extension
1. Use SuperAdmin panel to extend trial
2. Verify `trial_ends_at` updated correctly
3. Verify `trial_expired` flag reset to false

### Test Subscription Activation
1. Use activation endpoint with test company
2. Verify full access restored
3. Verify subscription expiry date set correctly

## Monitoring

### Key Metrics to Track
- Companies on trial vs paid subscriptions
- Trial conversion rates
- Average trial duration before conversion
- Trial extension frequency
- Notification delivery rates

### Log Monitoring
- Cron job execution logs
- Failed notification deliveries
- API endpoint usage for trial management
- Middleware blocking events

## Troubleshooting

### Common Issues

**Trial not expiring automatically**
- Check cron job is running
- Verify database connectivity
- Check trial_ends_at timestamps

**Notifications not sending**
- Verify email service configuration
- Check Firebase credentials for push notifications
- Review notification service logs

**Middleware blocking valid users**
- Check trial status in database
- Verify special_partner flag for exempt companies
- Review middleware skip paths

**Manual activation not working**
- Verify plan_id exists and is active
- Check billing_cycle parameter
- Ensure company_id is correct

## Future Enhancements

### Planned Features
1. **Automatic Billing Integration**
   - Stripe subscription management
   - Automatic renewal handling
   - Payment failure management

2. **Advanced Trial Analytics**
   - Conversion funnel tracking
   - Trial usage patterns
   - Predictive renewal scoring

3. **Flexible Trial Types**
   - Feature-limited trials
   - Usage-based trials (e.g., 100 bookings)
   - Multi-tier trial progression

4. **Enhanced Notifications**
   - SMS notifications
   - In-app notification center
   - Personalized upgrade recommendations 