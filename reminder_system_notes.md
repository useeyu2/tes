# Reminder System Documentation

## Current Implementation

The reminder system is currently implemented as a **simulated service** for development purposes.

### Location
- **Route**: `/api/v1/admin/trigger-reminders` (POST)
- **File**: `routes/admin.js` (line 136-140)
- **Service**: `services/reminderService.js`

### Current Behavior
When the "🔔 Send Reminders" button is clicked on the admin dashboard:
1. The system calls the reminder service
2. The service simulates sending reminders
3. Returns a count of members who would receive reminders
4. Displays message: "Reminders sent to X members (Simulated)"

### Code Reference
```javascript
router.post('/trigger-reminders', async (req, res) => {
    const reminderService = require('../services/reminderService');
    const count = await reminderService.sendReminders();
    res.json({ message: `Reminders sent to ${count} members (Simulated)` });
});
```

## Future Plans

### Email Integration
- Use a service like SendGrid, Mailgun, or AWS SES
- Send HTML-formatted reminder emails to members with outstanding dues
- Include payment details and direct link to contribution page

### SMS Integration
- Use a service like Twilio, Africa's Talking, or Termii
- Send SMS reminders to members' registered phone numbers
- Keep messages concise with payment amount and due date

### Recommended Implementation Steps
1. Choose email/SMS service providers
2. Set up API credentials in `.env` file
3. Update `reminderService.js` to use actual APIs
4. Add email/SMS templates
5. Implement error handling and logging
6. Test with small batch before full deployment

### Target Recipients
Members should receive reminders if they have:
- Contributions with status 'Due' (unpaid generated dues)
- Contributions past their due_date
- No pending or verified payment for the month

## Notes
- Current system is intentionally left as simulated until email/SMS providers are selected
- User will implement this feature in a future update
- No changes needed to the UI - button already exists and works
