# Oratoria API Reference

This document describes the REST API endpoints for the Oratoria backend.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://api.oratoria.app/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### Authentication

#### POST `/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

#### POST `/auth/register`

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### POST `/auth/refresh`

Refresh an expired access token.

**Request Body:**
```json
{
  "refresh_token": "refresh_token_here"
}
```

---

### User

#### GET `/user/profile`

Get the current user's profile.

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "level": "A1",
  "createdAt": "2024-01-15T10:00:00Z"
}
```

#### PATCH `/user/profile`

Update user profile.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "nativeLanguage": "en",
  "learningGoal": "conversation"
}
```

---

### Lessons

#### GET `/lessons`

Get available lessons for the user.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `level` | string | Filter by CEFR level (A1, A2, B1, B2) |
| `status` | string | Filter by completion status |

**Response:**
```json
{
  "lessons": [
    {
      "id": "uuid",
      "title": "Introducing Yourself",
      "level": "A1",
      "duration": 15,
      "completed": false
    }
  ]
}
```

#### GET `/lessons/:id`

Get a specific lesson with all phases.

**Response:**
```json
{
  "id": "uuid",
  "title": "Introducing Yourself",
  "phases": [
    {
      "type": "dialogue",
      "content": {...}
    },
    {
      "type": "pronunciation",
      "content": {...}
    }
  ]
}
```

#### POST `/lessons/:id/complete`

Mark a lesson phase as complete.

**Request Body:**
```json
{
  "phase": "pronunciation",
  "score": 85
}
```

---

### Speaking

#### POST `/speak/analyze`

Analyze a voice recording.

**Request Body (multipart/form-data):**
| Field | Type | Description |
|-------|------|-------------|
| `audio` | file | Audio recording (WebM, MP3, WAV) |
| `targetText` | string | Expected text for comparison |
| `context` | string | Lesson context for better analysis |

**Response:**
```json
{
  "transcription": "Ich heiße Maria",
  "pronunciation": {
    "score": 78,
    "issues": [
      {
        "word": "heiße",
        "issue": "vowel length",
        "suggestion": "Extend the 'ei' sound"
      }
    ]
  },
  "grammar": {
    "score": 100,
    "corrections": []
  }
}
```

#### GET `/speak/recordings`

Get user's recording history.

**Response:**
```json
{
  "recordings": [
    {
      "id": "uuid",
      "createdAt": "2024-01-15T10:00:00Z",
      "duration": 5.2,
      "score": 85
    }
  ]
}
```

#### DELETE `/speak/recordings/:id`

Delete a specific recording (GDPR compliance).

---

### SRS (Spaced Repetition)

#### GET `/srs/due`

Get items due for review.

**Response:**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "vocabulary",
      "front": "Guten Tag",
      "back": "Good day",
      "interval": 1,
      "dueDate": "2024-01-15T10:00:00Z"
    }
  ],
  "totalDue": 15
}
```

#### POST `/srs/review`

Submit a review result.

**Request Body:**
```json
{
  "itemId": "uuid",
  "quality": 4
}
```

Quality values:
- `0`: Complete blackout
- `1`: Incorrect response, remembered after seeing answer
- `2`: Incorrect, but remembered with hint
- `3`: Correct with difficulty
- `4`: Correct with hesitation
- `5`: Perfect recall

---

### Placement

#### POST `/placement/start`

Start a placement test.

**Response:**
```json
{
  "testId": "uuid",
  "questions": [...]
}
```

#### POST `/placement/submit`

Submit placement test answers.

**Request Body:**
```json
{
  "testId": "uuid",
  "answers": [
    {
      "questionId": "uuid",
      "audioUrl": "blob:...",
      "transcription": "..."
    }
  ]
}
```

**Response:**
```json
{
  "level": "A2",
  "confidence": 0.85,
  "recommendations": [...]
}
```

---

### Progress

#### GET `/progress/stats`

Get user statistics.

**Response:**
```json
{
  "totalLessons": 25,
  "completedLessons": 12,
  "speakingMinutes": 145,
  "vocabularyLearned": 320,
  "currentStreak": 7,
  "accuracy": {
    "pronunciation": 78,
    "grammar": 85
  }
}
```

#### GET `/progress/history`

Get learning history.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `days` | number | Number of days (default: 30) |

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

---

## Rate Limiting

- **Authenticated**: 100 requests/minute
- **Unauthenticated**: 20 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```
