# Rider App Authentication Backend

This backend supports dual authentication methods for the Rider app:

## 🔑 Authentication Methods

### 1. Email/Password Authentication

-   Direct backend authentication
-   Uses bcrypt for password hashing
-   Returns JWT token for session management

## 📡 API Endpoints

### `GET /api/orders/current`

Get the current order assigned to the authenticated rider (status: `out_for_delivery`).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response (200):**

```json
{
    "success": true,
    "order": {
        "id": 123,
        "userId": 456,
        "status": "out_for_delivery",
        "totalAmount": "299.00",
        "itemCount": 2,
        "customerName": "Jane Doe",
        "customerPhone": "9876543210",
        "deliveryAddress": "123 Main St, City",
        "riderId": 789,
        "estimatedDeliveryTime": "2025-09-17T12:30:00.000Z",
        "createdAt": "2025-09-17T11:00:00.000Z",
        "updatedAt": "2025-09-17T11:10:00.000Z"
        // ...other fields
    }
}
```

**Response (404):**

```json
{
    "success": false,
    "message": "No current order assigned to this rider."
}
```

### `GET /api/orders/completed`

Get all orders completed by the authenticated rider (status: `delivered`).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
    "success": true,
    "orders": [
        {
            "id": 101,
            "userId": 456,
            "status": "delivered",
            "totalAmount": "199.00",
            "itemCount": 1,
            "customerName": "Jane Doe",
            "customerPhone": "9876543210",
            "deliveryAddress": "123 Main St, City",
            "riderId": 789,
            "deliveredAt": "2025-09-15T15:00:00.000Z",
            "createdAt": "2025-09-15T14:00:00.000Z",
            "updatedAt": "2025-09-15T15:05:00.000Z"
            // ...other fields
        }
        // ...more orders
    ]
}
```

### `POST /api/auth/login`

Email/Password login endpoint.

**Request:**

```json
{
    "email": "rider@example.com",
    "password": "securepassword"
}
```

**Response:**

```json
{
    "success": true,
    "user": {
        "id": "rider123",
        "email": "rider@example.com",
        "name": "John Doe",
        "phone": "+919876543210",
        "status": "active"
    },
    "token": "jwt_auth_token_here"
}
```

<!-- Mobile OTP check endpoint removed -->

<!-- Firebase login endpoint removed -->

### `GET /api/auth/profile`

Get current user profile (protected route).

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
    "success": true,
    "data": {
        "id": "rider123",
        "name": "John Doe",
        "email": "rider@example.com",
        "phone": "+919876543210",
        "status": "active"
    }
}
```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

<!-- The database schema previously included a firebase_uid field. This is now unused. -->

### 3. Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
RIDER_BACKEND_PORT=3006
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=676h

# Database Configuration
DATABASE_URL=your-database-connection-string


```

### 4. Run the Server

```bash
# Development
npm run dev

# Production
npm start
```

## 🧪 Testing

Use Postman or curl examples below to test the remaining endpoints.

### Test Credentials

For development testing:

-   **Email:** test.rider@justoo.com
-   **Password:** test123

### Using Postman/curl

```bash
# Test email login
curl -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test.rider@justoo.com", "password": "test123"}'
```

## 🔒 Security Features

1. **JWT Tokens:** Secure session management
2. **Password Hashing:** bcrypt for password security
3. **Input Validation:** Request validation and sanitization

4. **Rate Limiting:** (Recommended for production)

## 🔄 Authentication Flow

### Email/Password Flow:

1. User submits email/password
2. Backend validates credentials
3. Returns user data + JWT token
4. Client stores token for future requests

<!-- Firebase OTP flow removed -->

## 📦 Dependencies

-   `express`: Web framework

-   `bcryptjs`: Password hashing
-   `jsonwebtoken`: JWT token management
-   `drizzle-orm`: Database ORM
-   `cors`: Cross-origin resource sharing

## 🚨 Production Considerations

1. **Environment Variables:** Secure all sensitive data
2. **HTTPS:** Always use HTTPS in production
3. **Rate Limiting:** Implement API rate limiting
4. **Logging:** Add comprehensive error logging
5. **Monitoring:** Set up health checks and monitoring

## 📝 Notes

-   The backend does not use Firebase in any way
-   JWT tokens include user ID, email, and phone
