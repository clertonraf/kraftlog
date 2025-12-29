# Password Recovery Feature

## Overview
This document describes the password recovery feature implementation for the KraftLog frontend application.

## Backend Implementation
The backend already has complete password recovery functionality:
- **Endpoint**: `POST /api/auth/password-recovery` - Initiates password recovery
- **Endpoint**: `POST /api/auth/password-reset` - Resets password with token
- **Email Service**: Configured via SMTP settings in `.env`
- **Token Expiry**: 24 hours
- **Database**: Password reset tokens stored in database

### Backend Configuration
The backend requires SMTP configuration in the `.env` file:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000
```

## Frontend Implementation

### Files Created
1. **app/forgot-password.tsx** - Screen for requesting password reset
2. **app/reset-password.tsx** - Screen for resetting password with token
3. **services/authService.ts** - Added password recovery methods
4. **.maestro/13-password-recovery-flow.yaml** - E2E test for forgot password flow
5. **.maestro/14-password-reset-form.yaml** - E2E test for reset password form

### Files Modified
1. **app/login.tsx** - Added "Forgot Password?" link
2. **services/authService.ts** - Added `requestPasswordRecovery()` and `resetPassword()` methods

### Features Implemented

#### 1. Forgot Password Screen (`/forgot-password`)
- Accessible from login screen via "Forgot Password?" link
- User enters their email address
- Validates email format
- Shows success message regardless of whether email exists (security best practice)
- Navigates back to login after success

#### 2. Reset Password Screen (`/reset-password`)
- Accessed via deep link with token parameter: `exp://[host]/--/reset-password?token=xxx`
- User enters new password and confirms it
- Validates password length (minimum 6 characters)
- Validates password match
- Shows success message and navigates to login on success
- Handles expired/invalid token errors

#### 3. Auth Service Methods
```typescript
// Request password recovery email
async requestPasswordRecovery(email: string): Promise<{ message: string }>

// Reset password with token
async resetPassword(token: string, newPassword: string): Promise<{ message: string }>
```

## Testing

### E2E Tests (Maestro)
Two test flows were created:

#### 13-password-recovery-flow.yaml
Tests the forgot password flow:
- Navigation to forgot password screen
- Empty email validation
- Invalid email format validation
- Valid email submission
- Back button functionality

#### 14-password-reset-form.yaml
Tests the reset password form:
- Empty password validation
- Password length validation
- Password mismatch validation
- Valid password submission
- Invalid token error handling
- Back to login functionality

### Running E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific password recovery tests
maestro test .maestro/13-password-recovery-flow.yaml
maestro test .maestro/14-password-reset-form.yaml
```

### Unit Tests
Unit tests were prepared in `__tests__/services/passwordRecovery.test.ts` covering:
- Request password recovery success
- Request password recovery with non-existent email
- Request password recovery network error
- Reset password success
- Reset password with invalid token
- Reset password with expired token
- Reset password with used token
- Integration with existing auth methods

**Note**: Unit tests require additional setup of testing dependencies. Run with:
```bash
npm run test:unit
```

## User Flow

### Password Recovery Flow
1. User clicks "Forgot Password?" on login screen
2. User enters email address
3. User receives email with reset link
4. User clicks link in email (opens app with token)
5. User enters new password (twice)
6. User confirms and password is reset
7. User returns to login screen to login with new password

### Deep Link Format
The email contains a link in the format:
```
{FRONTEND_URL}/reset-password?token={UUID_TOKEN}
```

For the mobile app, this translates to:
```
exp://{host}/--/reset-password?token={UUID_TOKEN}
```

## Security Considerations

1. **Email Enumeration Protection**: Success message is shown regardless of whether email exists
2. **Token Expiry**: Reset tokens expire after 24 hours
3. **One-Time Use**: Tokens can only be used once
4. **Secure Token Generation**: UUIDs used for tokens
5. **Password Validation**: Minimum length enforced
6. **HTTPS**: Production should use HTTPS for all communications

## Integration with Backend

The frontend communicates with the backend via two endpoints:

### 1. Request Password Recovery
```typescript
POST /api/auth/password-recovery
Body: { email: string }
Response: { message: string }
```

### 2. Reset Password
```typescript
POST /api/auth/password-reset
Body: { token: string, newPassword: string }
Response: { message: string }
```

## Error Handling

The implementation handles various error scenarios:
- Invalid email format
- Network errors
- Invalid/expired tokens
- Password validation errors
- Password mismatch

All errors are displayed to the user via Alert dialogs with appropriate messages.

## Future Enhancements

Potential improvements:
1. Add password strength indicator
2. Add rate limiting on frontend
3. Add email verification before password reset
4. Add 2FA support
5. Add password history to prevent reuse
6. Implement HTML email templates (currently plain text)
7. Add forgot password link expiry countdown
8. Add resend email functionality

## Testing Checklist

- [ ] User can navigate to forgot password screen from login
- [ ] Email validation works correctly
- [ ] User receives password reset email
- [ ] Deep link opens reset password screen with token
- [ ] Password validation works correctly  
- [ ] Password mismatch is detected
- [ ] Token expiry is handled correctly
- [ ] Used token is rejected
- [ ] Invalid token shows error
- [ ] Success flow completes and user can login
- [ ] Back buttons work correctly
- [ ] E2E tests pass
- [ ] Unit tests pass (once dependencies configured)

## Environment Setup

### Backend (.env)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:3000  # or your production URL
```

### Frontend (.env)
```bash
EXPO_PUBLIC_API_URL=http://localhost:8080/api  # or your backend URL
```

## Troubleshooting

### Email not received
- Check SMTP configuration in backend `.env`
- Check spam folder
- Verify email service credentials
- Check backend logs for email sending errors

### Deep link not working
- Verify FRONTEND_URL is correctly configured in backend
- Test deep link format in development
- Check expo linking configuration

### Token errors
- Tokens expire after 24 hours
- Tokens can only be used once
- Ensure backend time is synchronized

## Conclusion

The password recovery feature has been fully implemented with:
- Complete frontend screens and navigation
- Integration with existing backend endpoints
- E2E test coverage
- Unit test structure (requires additional setup)
- Security best practices
- Error handling
- User-friendly interface

The feature is ready for testing and can be deployed to production once SMTP is properly configured on the backend.
