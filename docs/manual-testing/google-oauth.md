# Google OAuth Manual Testing Guide

## Prerequisites

1. Google Cloud Console Setup
   - Create a project in Google Cloud Console
   - Enable Google OAuth2.0 API
   - Configure OAuth consent screen
   - Create OAuth 2.0 Client credentials
   - Add authorized redirect URIs:
     - Development: `http://localhost:3000/api/auth/google/callback`
     - Production: `https://your-domain.com/api/auth/google/callback`

2. Environment Configuration
   ```env
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
   ```

## Test Cases

### 1. Initial Google Login Flow

#### Steps:
1. Clear browser cookies and cache
2. Navigate to application login page
3. Click "Sign in with Google" button
4. Verify redirect to Google login page
5. Log in with Google account
6. Verify redirect back to application
7. Verify successful authentication
8. Check JWT token in local storage

#### Expected Results:
- Google login page appears
- Successful redirect back to application
- JWT token present in local storage
- User profile information available
- Correct role (USER) assigned
- Basic permissions granted

### 2. Existing User Login

#### Steps:
1. Log out of application
2. Clear browser cookies (keep Google logged in)
3. Click "Sign in with Google" button
4. Verify quick login without password

#### Expected Results:
- Quick authentication without password entry
- Same user profile loaded
- Previous roles and permissions maintained
- Session token refreshed

### 3. Error Handling

#### Test Case 3.1: User Denies Access
1. Click "Sign in with Google"
2. On Google consent screen, click "Cancel"
3. Verify proper error handling

#### Expected Results:
- Redirect to application error page
- Clear error message displayed
- Option to retry authentication

#### Test Case 3.2: Invalid Configuration
1. Temporarily modify Google client ID to invalid value
2. Attempt Google login
3. Verify error handling

#### Expected Results:
- Appropriate error message
- No hanging loading states
- Clear instructions for user

### 4. Session Management

#### Steps:
1. Successfully log in with Google
2. Check session duration
3. Verify token refresh mechanism
4. Test session timeout
5. Test manual logout

#### Expected Results:
- Session persists for configured duration
- Token refresh works correctly
- Timeout redirects to login
- Logout clears all session data

### 5. Security Verification

#### Test Cases:
1. **Token Validation**
   - Inspect JWT token structure
   - Verify token expiration
   - Check token signature
   - Validate claims

2. **Authorization**
   - Verify correct role assignment
   - Test permission restrictions
   - Check resource access control

3. **Session Security**
   - Verify secure cookie settings
   - Test CSRF protection
   - Check XSS prevention

## Troubleshooting Guide

### Common Issues

1. **Redirect URI Mismatch**
   - Verify URI exactly matches Google Console configuration
   - Check for protocol (http/https) match
   - Ensure port numbers match in development

2. **Token Errors**
   - Check token expiration
   - Verify signature validation
   - Confirm client ID/secret match

3. **Session Problems**
   - Clear browser cache and cookies
   - Check for cookie blocking
   - Verify CORS configuration

### Debug Steps

1. **Client-Side**
   ```javascript
   // Browser Console
   console.log(localStorage.getItem('auth_token'));
   console.log(sessionStorage.getItem('auth_state'));
   ```

2. **Server-Side**
   ```bash
   # Check logs
   tail -f server.log | grep "google-auth"
   
   # Verify environment
   echo $GOOGLE_CLIENT_ID
   echo $GOOGLE_CALLBACK_URL
   ```

## Regression Testing

After any authentication-related changes:

1. Verify all OAuth flows still work
2. Test token refresh mechanism
3. Check error handling
4. Validate security headers
5. Test session management
6. Verify role/permission assignments

## Performance Considerations

Monitor and test:
1. Login response times
2. Token validation speed
3. Session management overhead
4. Database query performance
5. Cache effectiveness 