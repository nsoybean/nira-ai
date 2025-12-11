# Better Auth Implementation Summary

Better Auth has been successfully integrated into your Next.js app with email/password, Google, and GitHub authentication.

## What's Been Implemented

### 1. **Database Schema** (`prisma/schema.prisma`)

- ✅ Added Better Auth tables: `User`, `Session`, `Account`, `Verification`
- ✅ Updated User model with `emailVerified`, `image` fields
- ✅ Configured relationships for Better Auth

### 2. **Auth Configuration** (`src/lib/auth.ts`)

- ✅ Configured Better Auth with Prisma adapter
- ✅ Enabled email/password authentication
- ✅ Set up Google OAuth provider
- ✅ Set up GitHub OAuth provider
- ✅ Session management (7-day expiry, 1-day refresh)
- ✅ Next.js cookies plugin for server actions

### 3. **API Routes**

- ✅ Created `/api/auth/[...all]/route.ts` - Handles all Better Auth endpoints
- ✅ Updated `/api/chat/route.ts` - Now extracts userId from session

### 4. **Client-Side**

- ✅ Created `src/lib/auth-client.ts` - Client auth instance
- ✅ Created `src/contexts/AuthContext.tsx` - Auth context with `useSession` hook
- ✅ Created `src/components/auth/AuthButton.tsx` - Login/profile button
- ✅ Created `src/components/auth/AuthDialog.tsx` - Sign in/up dialog with OAuth
- ✅ Updated Sidebar - Replaced hardcoded avatar with AuthButton

### 5. **Server Utilities** (`src/lib/auth-server.ts`)

- ✅ `getSession()` - Get current session
- ✅ `getUserId()` - Get current userId
- ✅ `requireAuth()` - Require authentication in API routes

## Next Steps

### 1. **Start Database and Run Migration**

```bash
# Start Docker (if using Docker for CockroachDB)
docker compose up -d

# OR start CockroachDB directly
cockroach start-single-node --insecure --listen-addr=localhost:26257

# Run the migration
npx prisma migrate dev --name add_better_auth_tables

# Generate Prisma client
npx prisma generate
```

### 2. **Set Up OAuth Credentials**

#### Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID
3. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Client Secret to `.env`:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

#### GitHub OAuth:

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create New OAuth App
3. Set Authorization callback URL:
   - Development: `http://localhost:3000/api/auth/callback/github`
   - Production: `https://your-domain.com/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env`:

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### 3. **Update Better Auth Secret**

Generate a secure random string for production:

```bash
openssl rand -base64 32
```

Update in `.env`:

```env
BETTER_AUTH_SECRET=your-generated-secret-key
```

### 4. **Test Authentication**

```bash
# Start the development server
npm run dev
```

1. Open `http://localhost:3000`
2. Click the "Sign In" button in the sidebar (bottom left)
3. Test:
   - **Email/Password**: Sign up with email and password
   - **Google**: Click "Google" button
   - **GitHub**: Click "GitHub" button
4. After signing in, you should see your profile in the sidebar
5. Test sign out from the dropdown menu

## Using Authentication in Your Code

### Client-Side (React Components):

```tsx
import { useSession } from "@/contexts/AuthContext";

function MyComponent() {
	const { data: session, isPending } = useSession();

	if (isPending) return <div>Loading...</div>;

	if (!session) return <div>Not signed in</div>;

	return <div>Welcome, {session.user.name}!</div>;
}
```

### Server-Side (API Routes):

```tsx
import { getUserId, requireAuth } from "@/lib/auth-server";

// Optional auth (allows anonymous)
export async function GET() {
	const userId = await getUserId();

	if (userId) {
		// User is authenticated
	} else {
		// Anonymous user
	}
}

// Required auth (throws error if not authenticated)
export async function POST() {
	const { userId, user } = await requireAuth();

	// User is guaranteed to be authenticated here
	// Do something with userId
}
```

### Server Components:

```tsx
import { getSession } from "@/lib/auth-server";

export default async function MyServerComponent() {
	const session = await getSession();

	if (!session) {
		return <div>Please sign in</div>;
	}

	return <div>Welcome, {session.user.name}!</div>;
}
```

## API Endpoints

Better Auth provides these endpoints:

- `POST /api/auth/sign-up/email` - Email/password sign up
- `POST /api/auth/sign-in/email` - Email/password sign in
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- `GET /api/auth/callback/google` - Google OAuth callback
- `GET /api/auth/callback/github` - GitHub OAuth callback

## Injecting userId in API Requests

The userId is now automatically available in your API routes through session cookies. No need for manual token injection - Better Auth handles this automatically!

Example in your chat API:

```tsx
// In src/app/api/chat/route.ts
const userId = await getUserId(); // Returns userId from session cookie

// Use userId to associate conversations with users
if (userId) {
	await prisma.conversation.update({
		where: { id: conversationId },
		data: { userId }, // Link conversation to user
	});
}
```

## Security Notes

1. **HTTPS Required in Production**: OAuth providers require HTTPS callbacks
2. **Update BETTER_AUTH_SECRET**: Use a strong random secret in production
3. **CORS Settings**: Update `trustedOrigins` in `src/lib/auth.ts` for production domains
4. **Environment Variables**: Never commit `.env` with real credentials

## Troubleshooting

### "Can't reach database server"

- Make sure Docker is running: `docker ps`
- Or start CockroachDB: `cockroach start-single-node`

### OAuth redirect errors

- Check callback URLs match exactly in OAuth provider settings
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly

### Session not persisting

- Check that cookies are enabled in browser
- Verify `BETTER_AUTH_SECRET` is set

## Additional Features

To add more features, check the [Better Auth documentation](https://better-auth.com):

- Email verification
- Password reset
- Two-factor authentication (2FA)
- Magic link authentication
- Passkeys
- Organization/team management

## Migration from Beta Auth

The old `BETA_AUTH_TOKEN` system can now be safely removed once Better Auth is working. Update any components still using `useBetaAuth` to use the new `useSession` hook instead.
