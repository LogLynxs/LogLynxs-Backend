# LogLynx Backend API

A RESTful API for the LogLynx cycling companion app, built with Node.js, Express, and Firebase Firestore.

## 🚀 Features

- **Firebase Integration**: Uses Firebase Auth and Firestore for data storage
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Swagger Documentation**: Interactive API documentation
- **TypeScript**: Full type safety and better development experience
- **Rate Limiting**: Built-in request rate limiting
- **Error Handling**: Comprehensive error handling and logging
- **CORS Support**: Cross-origin resource sharing enabled

## 📋 Prerequisites

- Node.js 18+ 
- Firebase project with Firestore enabled
- Firebase service account key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=8080
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   FIREBASE_PROJECT_ID=your-firebase-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
   ```

4. **Add Firebase service account key**
   - Download your Firebase service account key from Firebase Console
   - Save it as `firebase-service-account.json` in the backend root directory

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8080/api-docs
- **Health Check**: http://localhost:8080/health

## 🏗️ Project Structure

```
src/
├── core/                 # Core utilities
│   ├── authMiddleware.ts # JWT authentication middleware
│   ├── errorHandler.ts   # Error handling middleware
│   └── logger.ts         # Winston logger configuration
├── firebase/             # Firebase configuration
│   └── admin.ts          # Firebase Admin SDK setup
├── modules/              # Feature modules
│   ├── auth/             # Authentication routes & controllers
│   ├── users/            # User management
│   ├── bikes/            # Bike management
│   ├── components/       # Component tracking
│   ├── serviceLogs/      # Service log management
│   ├── qrcodes/          # QR code generation & scanning
│   ├── strava/           # Strava integration
│   └── notifications/    # Notification system
└── server.ts             # Main application entry point
```

## 🔐 Authentication Flow

1. **Client Authentication**: User signs in with Firebase Auth
2. **Token Exchange**: Client exchanges Firebase ID token for API JWT
3. **API Access**: Client uses JWT for API requests
4. **Token Refresh**: Client refreshes JWT using refresh token

### Example Authentication Flow

```bash
# 1. Exchange Firebase token for JWT
curl -X POST http://localhost:8080/api/v1/auth/firebase-exchange \
  -H "Content-Type: application/json" \
  -d '{"firebaseToken": "your-firebase-id-token"}'

# 2. Use JWT for API requests
curl -X GET http://localhost:8080/api/v1/bikes \
  -H "Authorization: Bearer your-jwt-token"
```

## 🗄️ Database Schema (Firestore)

### Collections Structure

```
users/{uid}/
├── profile data
├── bikes/{bikeId}/
│   ├── bike data
│   ├── components/{componentId}/
│   └── serviceLogs/{logId}/

bikes/{bikeId}/
├── ownerUid, name, type, year, status, totalMileage, tags

components/{componentId}/
├── ownerUid, kind, brand, model, spec, currentBikeId
├── installations/{instId}/
└── wear-snapshots/{snapId}/

qr-codes/{code}/
├── targetType, targetId, policy, ownerUid, expiresAt
└── shared-users/{uid}/

strava-connections/{uid}/
├── accessToken, refreshToken, expiresAt, athleteId

activities/{activityId}/
├── userUid, source, startedAt, distanceKm, movingTimeSec, bikeId, raw

notifications/{id}/
├── userUid, channel, kind, payload, scheduledFor, deliveredAt
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `development` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | JWT refresh secret | Required |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Required |
| `GOOGLE_APPLICATION_CREDENTIALS` | Firebase service account path | Required |
| `STRAVA_CLIENT_ID` | Strava OAuth client ID | Optional |
| `STRAVA_CLIENT_SECRET` | Strava OAuth client secret | Optional |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

## 🔧 Development

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Building
```bash
# Build TypeScript to JavaScript
npm run build
```

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support, email support@loglynx.app or create an issue in the repository.
