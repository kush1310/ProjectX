# Google OAuth Setup for CharusatNeeds

## CHARUSAT Domain-Restricted Authentication

This guide will help you set up Google OAuth with **strict CHARUSAT domain enforcement** (`@charusat.edu.in` only).

---

## Part 1: Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**

   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Project name: `CharusatNeeds`
   - Click "Create"

### Step 2: Enable Google+ API

1. **Navigate to APIs & Services**

   - Left sidebar → "APIs & Services" → "Library"

2. **Enable Required APIs**
   - Search for "Google+ API" → Click → Enable
   - Search for "People API" → Click → Enable

### Step 3: Configure OAuth Consent Screen

1. **Go to OAuth Consent Screen**

   - Left sidebar → "OAuth consent screen"

2. **Choose User Type**

   - Select **"Internal"** if you have Google Workspace for CHARUSAT
   - Or select **"External"** (requires verification for production)
   - Click "Create"

3. **App Information**

   ```
   App name: CharusatNeeds
   User support email: your-email@charusat.edu.in
   App logo: [Upload your logo]
   Application home page: http://localhost:5173
   ```

4. **App Domain** (for production)

   ```
   Application home page: https://charusatneeds.com
   Application privacy policy: https://charusatneeds.com/privacy
   Application terms of service: https://charusatneeds.com/terms
   ```

5. **Authorized Domains**

   ```
   charusat.edu.in
   localhost (for development)
   ```

6. **Developer Contact**

   - Add your email: `your-email@charusat.edu.in`

7. **Scopes**

   - Click "Add or Remove Scopes"
   - Select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Save and Continue

8. **Test Users** (if External)
   - Add test emails ending with `@charusat.edu.in`
   - Click "Add Users"

### Step 4: Create OAuth 2.0 Credentials

1. **Go to Credentials**

   - Left sidebar → "Credentials"
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"

2. **Application Type**

   - Select: **"Web application"**

3. **Configure Web Client**

   ```
   Name: CharusatNeeds Web Client

   Authorized JavaScript origins:
   - http://localhost:5173
   - http://localhost:3000
   - https://your-production-domain.com

   Authorized redirect URIs:
   - http://localhost:5173/auth/callback
   - http://localhost:3000/auth/callback
   - https://your-production-domain.com/auth/callback
   ```

4. **Create & Download**
   - Click "Create"
   - **Download JSON** (keep this secure!)
   - Copy the **Client ID** and **Client Secret**

---

## Part 2: Frontend Configuration

### Step 1: Create Environment File

Create `d:\CharusatNeeds_SGP\Frontend\.env`:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback

# API Backend
VITE_API_URL=http://localhost:8080/api

# Environment
VITE_ENV=development
```

### Step 2: Create OAuth Handler

Create `d:\CharusatNeeds_SGP\Frontend\src\utils\googleAuth.ts`:

```typescript
export const initiateGoogleLogin = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  const scope = encodeURIComponent("email profile openid");

  // CRITICAL: hd parameter restricts to charusat.edu.in
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `access_type=offline&` +
    `hd=charusat.edu.in&` + // DOMAIN RESTRICTION
    `prompt=select_account`;

  window.location.href = authUrl;
};

export const handleGoogleCallback = async (code: string) => {
  const apiUrl = import.meta.env.VITE_API_URL;

  try {
    const response = await fetch(`${apiUrl}/auth/google/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) throw new Error("Authentication failed");

    const data = await response.json();

    // Store JWT token
    localStorage.setItem("charusatneeds_token", data.token);
    localStorage.setItem("charusatneeds_user", JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error("Google auth error:", error);
    throw error;
  }
};
```

### Step 3: Update Login/Signup Components

In `Login.tsx` and `Signup.tsx`, import and use:

```typescript
import { initiateGoogleLogin } from "@/utils/googleAuth";

const handleGoogleLogin = () => {
  initiateGoogleLogin();
};
```

### Step 4: Create Callback Page

Create `d:\CharusatNeeds_SGP\Frontend\src\pages\AuthCallback.tsx`:

```typescript
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { handleGoogleCallback } from "@/utils/googleAuth";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Authentication failed. Please try again.");
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    if (code) {
      handleGoogleCallback(code)
        .then(() => {
          navigate("/dashboard");
        })
        .catch(() => {
          setError("Failed to authenticate. Please try again.");
          setTimeout(() => navigate("/login"), 3000);
        });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cream-50 to-cream-100">
      <div className="text-center">
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <div className="animate-spin w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-dark-600">Authenticating with Google...</p>
          </>
        )}
      </div>
    </div>
  );
}
```

### Step 5: Add Route

In `App.tsx`:

```typescript
import AuthCallback from "./pages/AuthCallback";

// Add route
<Route path="/auth/callback" element={<AuthCallback />} />;
```

---

## Part 3: Backend Configuration (Java Spring Boot)

### Step 1: Add Dependencies

In `pom.xml`, add:

```xml
<!-- Google OAuth -->
<dependency>
    <groupId>com.google.api-client</groupId>
    <artifactId>google-api-client</artifactId>
    <version>2.2.0</version>
</dependency>
<dependency>
    <groupId>com.google.auth</groupId>
    <artifactId>google-auth-library-oauth2-http</artifactId>
    <version>1.19.0</version>
</dependency>
```

### Step 2: Update application.properties

```properties
# Google OAuth
google.oauth.client-id=your_client_id_here.apps.googleusercontent.com
google.oauth.client-secret=your_client_secret_here
google.oauth.redirect-uri=http://localhost:5173/auth/callback
google.oauth.allowed-domain=charusat.edu.in
```

### Step 3: Create OAuth Service

Create `GoogleOAuthService.java`:

```java
package com.charusat.canteen.service;

import com.google.api.client.googleapis.auth.oauth2.*;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class GoogleOAuthService {

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    @Value("${google.oauth.allowed-domain}")
    private String allowedDomain;

    public GoogleIdToken.Payload verifyToken(String authCode) throws Exception {
        GoogleTokenResponse tokenResponse = new GoogleAuthorizationCodeTokenRequest(
            new NetHttpTransport(),
            GsonFactory.getDefaultInstance(),
            "https://oauth2.googleapis.com/token",
            clientId,
            clientSecret,
            authCode,
            redirectUri
        ).execute();

        GoogleIdToken idToken = tokenResponse.parseIdToken();
        GoogleIdToken.Payload payload = idToken.getPayload();

        // CRITICAL: Verify domain
        String hostedDomain = (String) payload.get("hd");
        if (!allowedDomain.equals(hostedDomain)) {
            throw new SecurityException("Invalid domain: " + hostedDomain);
        }

        return payload;
    }
}
```

### Step 4: Create Auth Controller

Create `AuthController.java`:

```java
package com.charusat.canteen.controller;

import com.charusat.canteen.service.GoogleOAuthService;
import com.charusat.canteen.service.UserService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired
    private GoogleOAuthService googleOAuthService;

    @Autowired
    private UserService userService;

    @PostMapping("/google/callback")
    public ResponseEntity<?> googleCallback(@RequestBody Map<String, String> request) {
        try {
            String code = request.get("code");

            // Verify Google token and get user info
            GoogleIdToken.Payload payload = googleOAuthService.verifyToken(code);

            String email = payload.getEmail();
            String name = (String) payload.get("name");
            String picture = (String) payload.get("picture");

            // CRITICAL: Double-check domain
            if (!email.endsWith("@charusat.edu.in")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Only CHARUSAT emails allowed"));
            }

            // Create or get user
            User user = userService.findOrCreateGoogleUser(email, name, picture);

            // Generate JWT
            String token = jwtService.generateToken(user);

            return ResponseEntity.ok(Map.of(
                "token", token,
                "user", user
            ));

        } catch (SecurityException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid domain"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Authentication failed"));
        }
    }
}
```

---

## Part 4: Security Checklist

### ✅ Domain Verification (Multiple Layers)

1. **Frontend**: `hd=charusat.edu.in` in OAuth URL
2. **Google Response**: Check `hd` claim in ID token
3. **Backend**: Verify `hd` field in `GoogleIdToken.Payload`
4. **Backend**: Manual email suffix check: `email.endsWith("@charusat.edu.in")`

### ✅ Additional Checks

```java
// In your service
if (payload.getEmailVerified() == null || !payload.getEmailVerified()) {
    throw new SecurityException("Email not verified");
}

String hostedDomain = (String) payload.get("hd");
if (hostedDomain == null || !hostedDomain.equals("charusat.edu.in")) {
    throw new SecurityException("Invalid domain");
}

if (!email.endsWith("@charusat.edu.in")) {
    throw new SecurityException("Email domain mismatch");
}
```

---

## Part 5: Testing

### Test with Valid CHARUSAT Email

1. Click "Sign in with Google"
2. Select CHARUSAT Google account
3. Should redirect to dashboard

### Test with Non-CHARUSAT Email

1. Try signing in with `test@gmail.com`
2. Google should show error: "Can't use this account"
3. Or backend rejects with domain error

### Verify in Backend

Check database:

```sql
SELECT email, created_at FROM users WHERE email LIKE '%@charusat.edu.in';
```

---

## Part 6: Production Deployment

### Update OAuth Consent to Production

1. Submit for verification (if External)
2. Add production domain to authorized origins
3. Update environment variables

### Production .env

```env
VITE_GOOGLE_CLIENT_ID=your_production_client_id
VITE_GOOGLE_REDIRECT_URI=https://charusatneeds.com/auth/callback
VITE_API_URL=https://api.charusatneeds.com
```

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

- Check authorized redirect URIs in Google Console
- Must exactly match `VITE_GOOGLE_REDIRECT_URI`

### Error: "Can't use this account"

- User tried non-CHARUSAT email
- `hd` parameter is working correctly ✅

### Error: "Invalid domain"

- Backend rejected non-CHARUSAT email
- Check `hd` field verification

### User bypassed frontend check

- Always verify `hd` on backend
- Never trust frontend-only validation

---

## Summary

**Domain Restriction Points:**

1. ✅ Frontend OAuth URL: `hd=charusat.edu.in`
2. ✅ Google ID Token: `hd` claim verification
3. ✅ Backend: Email suffix check
4. ✅ Database: Email constraint validation

Your users **cannot** sign up with non-CHARUSAT emails! 🔒
