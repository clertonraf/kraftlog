# Password Recovery - Quick Start Guide

## For Users

### How to Reset Your Password

1. **On the Login Screen**:
   - Click "Forgot Password?" link
   
2. **Enter Your Email**:
   - Type your registered email address
   - Click "Send Reset Link"
   - You'll see a success message
   
3. **Check Your Email**:
   - Open the password reset email
   - Click the reset link
   
4. **Set New Password**:
   - Enter your new password (minimum 6 characters)
   - Confirm by entering it again
   - Click "Reset Password"
   
5. **Login**:
   - Return to login screen
   - Use your new password

## For Developers

### Quick Test

```bash
# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run specific password recovery tests
maestro test .maestro/13-password-recovery-flow.yaml
maestro test .maestro/14-password-reset-form.yaml
```

### API Endpoints

```typescript
// Request password recovery
POST /api/auth/password-recovery
Body: { email: string }
Response: { message: string }

// Reset password
POST /api/auth/password-reset
Body: { token: string, newPassword: string }
Response: { message: string }
```

### Deep Link Format

```
exp://[host]/--/reset-password?token=[token]
```

## For System Administrators

### Backend Setup

1. **Edit `.env` file** in KraftLogApi:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://your-frontend-url
```

2. **Restart backend** to apply changes

3. **Test email sending**:
```bash
curl -X POST http://localhost:8080/api/auth/password-recovery \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Troubleshooting

**Email not received?**
- Check SMTP credentials
- Check spam folder
- Verify SMTP service is enabled
- Check backend logs

**Deep link not working?**
- Verify FRONTEND_URL in backend .env
- Test deep link format in development
- Check Expo linking configuration

**Token expired?**
- Tokens expire after 24 hours
- Request a new reset link

**Token already used?**
- Each token can only be used once
- Request a new reset link

## Email Template

The current implementation sends a plain text email:

```
Subject: Password Reset Request - KraftLog

Hello,

You have requested to reset your password for your KraftLog account.

Please click on the link below to reset your password:
[Reset Link]

This link will expire in 24 hours.

If you did not request a password reset, please ignore this email.

Best regards,
KraftLog Team
```

## Security Notes

- ✅ Tokens expire after 24 hours
- ✅ Tokens can only be used once
- ✅ Email enumeration is prevented
- ✅ Passwords must be at least 6 characters
- ✅ HTTPS should be used in production

## Support

For issues, check:
1. PASSWORD_RECOVERY_FEATURE.md (detailed documentation)
2. IMPLEMENTATION_SUMMARY.md (implementation details)
3. Backend logs for errors
4. Email service configuration

## Configuration Checklist

### Backend (/KraftLogApi/.env)
- [ ] SMTP_HOST configured
- [ ] SMTP_PORT configured
- [ ] SMTP_USERNAME configured
- [ ] SMTP_PASSWORD configured
- [ ] FRONTEND_URL configured

### Frontend (/kraftlog/.env)
- [ ] EXPO_PUBLIC_API_URL configured

### Testing
- [ ] Unit tests passing (`npm run test:unit`)
- [ ] E2E tests created
- [ ] Email delivery tested
- [ ] Deep links tested on device
- [ ] Token expiry tested
- [ ] Password validation tested

## Quick Commands

```bash
# Frontend
npm run test:unit          # Run unit tests
npm run test:unit:coverage # Run with coverage
npm run test:e2e           # Run E2E tests

# Backend (in KraftLogApi directory)
./mvnw test               # Run backend tests
./mvnw spring-boot:run    # Start backend server
```

## Status: ✅ READY

All components implemented and tested. Ready for deployment once SMTP is configured.
