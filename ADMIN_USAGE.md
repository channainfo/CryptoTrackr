# Admin Authentication

## Admin Account
For testing and development, an admin account has been created with the following credentials:

- **Username**: admin
- **Password**: admin123

This account has a fixed ID of `123e4567-e89b-12d3-a456-426614174000` and has the `is_admin` flag set to true.

## Admin Authentication Flow
The application implements a two-step authentication process for admin access:

1. **Regular User Authentication**: The user must first be authenticated as a regular user through the standard login process.

2. **Admin Authentication**: When accessing admin-protected routes, the system checks if the authenticated user has admin privileges. If they do, they're granted an admin token that's valid for 1 hour.

## Admin Routes
Admin routes are protected using the `AdminRoute` component in React. When a non-admin user attempts to access an admin route, they'll see a dialog prompting them to authenticate as an admin.

## Admin Token
For security, the admin token:
- Is stored separately from the regular session
- Has a limited validity period (1 hour)
- Is required for all admin API requests as a header: `Authorization: AdminToken <token>`

## Admin Panel
Access the admin panel at `/admin/tokens` to manage the cryptocurrency tokens available in the system.

## Security Considerations
- Admin status is verified directly against the database on every admin action
- Admin tokens are not stored in cookies or localStorage but in server memory for added security
- Each admin API request requires both a valid user session and a valid admin token