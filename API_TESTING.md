# C-CBMS Backend API Testing Guide

## Environment Setup
✅ MongoDB is configured in `.env`
✅ Express server is configured in `server.js`
✅ Routes and models are set up

## Start Development Server
```bash
npm run dev
```

The server will run on `http://localhost:5000`

---

## API Endpoints

### 1. Check Server Status
**GET** `http://localhost:5000/`

Response:
```json
{
  "message": "C-CBMS API is running"
}
```

---

### 2. Get All Users
**GET** `http://localhost:5000/api/users`

**cURL:**
```bash
curl http://localhost:5000/api/users
```

---

### 3. Create New User
**POST** `http://localhost:5000/api/users`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "0123456789",
  "role": "user"
}
```

