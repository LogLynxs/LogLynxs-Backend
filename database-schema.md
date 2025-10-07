# LogLynx Firestore Database Schema

## Collections Overview

### 1. Users Collection
**Path:** `users/{uid}`

**Fields:**
- `email` (string) - User's email address
- `displayName` (string) - User's display name
- `createdAt` (timestamp) - Account creation date
- `lastLoginAt` (timestamp) - Last login timestamp
- `prefs` (map) - User preferences
  - `darkMode` (string) - "system", "light", "dark"
  - `notificationsEnabled` (boolean)
  - `biometricsEnabled` (boolean)

**Subcollections:**
- `users/{uid}/devices/{token}` - Push notification tokens
  - `token` (string) - FCM token
  - `platform` (string) - "android", "ios", "web"
  - `lastSeen` (timestamp)

### 2. Bikes Collection
**Path:** `bikes/{bikeId}`

**Fields:**
- `ownerUid` (string) - User ID who owns the bike
- `name` (string) - Bike name
- `type` (string) - Bike type (e.g., "Road", "Mountain", "Hybrid")
- `year` (number) - Manufacturing year
- `status` (string) - "Excellent", "Good", "Needs Attention", "Critical"
- `totalMileage` (number) - Total miles ridden
- `tags` (array) - Array of tags
- `createdAt` (timestamp) - When bike was added
- `updatedAt` (timestamp) - Last update timestamp

**Subcollections:**
- `bikes/{bikeId}/service-logs/{logId}` - Service history
  - `performedAt` (timestamp) - When service was performed
  - `title` (string) - Service title
  - `notes` (string) - Service notes
  - `cost` (number) - Service cost
  - `mileageAtService` (number) - Bike mileage when service was done
  - `items` (array) - Array of service items

### 3. Components Collection
**Path:** `components/{componentId}`

**Fields:**
- `ownerUid` (string) - User ID who owns the component
- `kind` (string) - Component type ("chain", "brake", "tire", "cassette", etc.)
- `brand` (string) - Component brand
- `model` (string) - Component model
- `spec` (map) - Component specifications
- `currentBikeId` (string, nullable) - ID of bike currently using this component
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Subcollections:**
- `components/{componentId}/installations/{instId}` - Installation history
  - `bikeId` (string) - Bike ID where installed
  - `installedAt` (timestamp) - Installation date
  - `installedOdometer` (number) - Bike mileage at installation
  - `removedAt` (timestamp, nullable) - Removal date
  - `removedOdometer` (number, nullable) - Bike mileage at removal

- `components/{componentId}/wear-snapshots/{snapId}` - Wear tracking
  - `takenAt` (timestamp) - When snapshot was taken
  - `mileageAccumulated` (number) - Miles on component
  - `wearPct` (number) - Wear percentage (0-100)
  - `notes` (string, optional) - Additional notes

### 4. QR Codes Collection
**Path:** `qr-codes/{code}`

**Fields:**
- `targetType` (string) - "bike" or "component"
- `targetId` (string) - ID of bike or component
- `policy` (string) - "owner_only", "any_authenticated", "shared_list"
- `ownerUid` (string) - User ID who created the QR code
- `expiresAt` (timestamp, nullable) - Expiration date
- `createdAt` (timestamp)

**Subcollections:**
- `qr-codes/{code}/shared-users/{uid}` - Shared access list
  - `uid` (string) - User ID with access
  - `grantedAt` (timestamp) - When access was granted

### 5. Strava Connections Collection
**Path:** `strava-connections/{uid}`

**Fields:**
- `accessToken` (string) - Strava access token (encrypted)
- `refreshToken` (string) - Strava refresh token (encrypted)
- `expiresAt` (timestamp) - Token expiration
- `athleteId` (string) - Strava athlete ID
- `lastSyncAt` (timestamp) - Last activity sync
- `createdAt` (timestamp)

### 6. Activities Collection
**Path:** `activities/{activityId}`

**Fields:**
- `userUid` (string) - User ID
- `source` (string) - "strava" or "manual"
- `startedAt` (timestamp) - Activity start time
- `distanceKm` (number) - Distance in kilometers
- `movingTimeSec` (number) - Moving time in seconds
- `bikeId` (string, nullable) - Bike used for activity
- `raw` (map) - Raw activity data from source
- `createdAt` (timestamp)

### 7. Notifications Collection
**Path:** `notifications/{id}`

**Fields:**
- `userUid` (string) - User ID
- `channel` (string) - "push", "email", "sms"
- `kind` (string) - Notification type
- `payload` (map) - Notification payload
- `scheduledFor` (timestamp) - When to send
- `deliveredAt` (timestamp, nullable) - When delivered
- `createdAt` (timestamp)

### 8. Refresh Tokens Collection
**Path:** `refresh_tokens/{uid}`

**Fields:**
- `token` (string) - JWT refresh token
- `createdAt` (timestamp) - When token was created
- `expiresAt` (timestamp) - Token expiration date
- `lastUsed` (timestamp) - Last time token was used
- `isActive` (boolean) - Whether token is active (for soft deletion)
- `deactivatedAt` (timestamp, nullable) - When token was deactivated
- `version` (number) - Token version for rotation tracking
- `deviceInfo` (map) - Device information
  - `userAgent` (string) - Browser/device user agent
  - `ip` (string) - IP address of device
  - `lastUsed` (timestamp) - Last device usage

### 9. User Badges Collection
**Path:** `user_badges/{badgeId}`

**Fields:**
- `uid` (string) - User ID who unlocked the badge
- `badgeId` (string) - Badge identifier
- `unlockedAt` (timestamp) - When badge was unlocked
- `progress` (number) - Progress percentage (0-100)
- `createdAt` (timestamp) - When record was created

## Indexes

The following indexes are required for optimal query performance:

1. **Service Logs (Collection Group)**
   - `bikeId` ASC, `performedAt` DESC
   - `userUid` ASC, `performedAt` DESC

2. **Bikes**
   - `ownerUid` ASC, `status` ASC
   - `ownerUid` ASC, `createdAt` DESC

3. **Components**
   - `ownerUid` ASC, `kind` ASC
   - `ownerUid` ASC, `currentBikeId` ASC

4. **Activities**
   - `userUid` ASC, `startedAt` DESC
   - `userUid` ASC, `bikeId` ASC, `startedAt` DESC

5. **Notifications**
   - `userUid` ASC, `scheduledFor` ASC

6. **QR Codes**
   - `ownerUid` ASC, `targetType` ASC

7. **User Badges**
   - `uid` ASC, `unlockedAt` DESC
   - `uid` ASC, `badgeId` ASC

## Security Rules

All client access is denied by default. The API layer handles all authentication and authorization using Firebase Admin SDK.

## Data Validation

All data validation is handled at the API layer using Zod schemas before writing to Firestore.
