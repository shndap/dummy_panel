# Experiment Management API Endpoints

This document outlines all the API endpoints needed to support the experiment management system.

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

---

## 1. Experiment Management

### Get All Experiments
```http
GET /experiments
```

**Query Parameters:**
- `page` (number): Page number for pagination (default: 1)
- `limit` (number): Items per page (default: 10)
- `search` (string): Search term for code, author, or description
- `filterType` (string): Filter by type - 'all', 'invalid', 'no_improvement', 'Open', 'Close', 'Reg'
- `tags` (string): Comma-separated list of tags to filter by
- `sortBy` (string): Sort field - 'date', 'pnl', 'winRate', 'precision'
- `sortOrder` (string): Sort direction - 'asc' or 'desc'

**Response:**
```json
{
  "success": true,
  "data": {
    "experiments": [
      {
        "id": "exp_001",
        "code": "EXP_2024_001",
        "date": "2024-01-15T10:30:00Z",
        "author": "John Doe",
        "description": "Experiment with new ML model",
        "status": "valid",
        "tags": ["ml", "trading", "neural-network"],
        "improvements": ["Open", "Close"],
        "financial": {
          "pnl": 1250.50,
          "profit": 2000.00,
          "loss": -749.50,
          "totalTrades": 150,
          "winRate": 0.68,
          "avgWin": 45.20,
          "avgLoss": -32.10,
          "sharpeRatio": 1.25,
          "maxDrawdown": 0.15,
          "volatility": 0.22,
          "pnlQ1": 300.00,
          "pnlQ2": 450.00,
          "pnlQ3": 250.00,
          "pnlQ4": 250.50,
          "profitFactor": 1.85,
          "calmarRatio": 0.75,
          "sortinoRatio": 1.45
        },
        "mlMetrics": {
          "precision": 0.75,
          "recall": 0.68,
          "f1Score": 0.71,
          "accuracy": 0.72,
          "validationPrecision": 0.73,
          "validationRecall": 0.65,
          "validationF1": 0.69,
          "validationAccuracy": 0.70
        },
        "metrics": {
          "open": {
            "mse": 0.0234,
            "buyHighlow": 0.65,
            "sellHighlow": 0.58
          },
          "close": {
            "mse": 0.0189,
            "buyHighlow": 0.72,
            "sellHighlow": 0.61
          },
          "reg": {
            "mse": 0.0156,
            "buyHighlow": 0.68,
            "sellHighlow": 0.63
          }
        },
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48,
      "itemsPerPage": 10
    }
  }
}
```

### Get Single Experiment
```http
GET /experiments/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "experiment": {
      // Same structure as above
    }
  }
}
```

### Create New Experiment
```http
POST /experiments
```

**Request Body:**
```json
{
  "code": "EXP_2024_002",
  "description": "New experiment description",
  "author": "Jane Smith",
  "status": "valid",
  "tags": ["ml", "trading"],
  "improvements": ["Open"],
  "financial": {
    "pnl": 0,
    "profit": 0,
    "loss": 0,
    "totalTrades": 0,
    "winRate": 0,
    "avgWin": 0,
    "avgLoss": 0,
    "sharpeRatio": 0,
    "maxDrawdown": 0,
    "volatility": 0,
    "pnlQ1": 0,
    "pnlQ2": 0,
    "pnlQ3": 0,
    "pnlQ4": 0,
    "profitFactor": 0,
    "calmarRatio": 0,
    "sortinoRatio": 0
  },
  "mlMetrics": {
    "precision": 0,
    "recall": 0,
    "f1Score": 0,
    "accuracy": 0,
    "validationPrecision": 0,
    "validationRecall": 0,
    "validationF1": 0,
    "validationAccuracy": 0
  },
  "metrics": {
    "open": {
      "mse": 0,
      "buyHighlow": 0,
      "sellHighlow": 0
    },
    "close": {
      "mse": 0,
      "buyHighlow": 0,
      "sellHighlow": 0
    },
    "reg": {
      "mse": 0,
      "buyHighlow": 0,
      "sellHighlow": 0
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "experiment": {
      // Created experiment with generated ID and timestamps
    }
  },
  "message": "Experiment created successfully"
}
```

### Update Experiment
```http
PUT /experiments/:id
```

**Request Body:**
```json
{
  "code": "EXP_2024_002_UPDATED",
  "description": "Updated description",
  "author": "Jane Smith",
  "status": "valid",
  "tags": ["ml", "trading", "updated"],
  "improvements": ["Open", "Close"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "experiment": {
      // Updated experiment
    }
  },
  "message": "Experiment updated successfully"
}
```

### Delete Experiment
```http
DELETE /experiments/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Experiment deleted successfully"
}
```

### Bulk Delete Experiments
```http
DELETE /experiments/bulk
```

**Request Body:**
```json
{
  "ids": ["exp_001", "exp_002", "exp_003"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "3 experiments deleted successfully"
}
```

---

## 2. Tag Management

### Get All Tags
```http
GET /tags
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tags": [
      "ml",
      "trading",
      "neural-network",
      "deep-learning",
      "quantitative"
    ]
  }
}
```

### Create New Tag
```http
POST /tags
```

**Request Body:**
```json
{
  "name": "new-tag"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tag": {
      "id": "tag_001",
      "name": "new-tag",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  },
  "message": "Tag created successfully"
}
```

### Delete Tag
```http
DELETE /tags/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Tag deleted successfully"
}
```

---

## 3. Experiment Comparison

### Compare Two Experiments
```http
GET /experiments/compare
```

**Query Parameters:**
- `exp1` (string): First experiment ID
- `exp2` (string): Second experiment ID

**Response:**
```json
{
  "success": true,
  "data": {
    "experiment1": {
      // Full experiment data
    },
    "experiment2": {
      // Full experiment data
    },
    "comparison": {
      "financial": {
        "pnlDifference": 250.50,
        "winRateDifference": 0.05,
        "sharpeRatioDifference": 0.15
      },
      "mlMetrics": {
        "precisionDifference": 0.02,
        "recallDifference": -0.03,
        "f1ScoreDifference": -0.01
      }
    }
  }
}
```

### Compare Multiple Experiments
```http
POST /experiments/compare/bulk
```

**Request Body:**
```json
{
  "experimentIds": ["exp_001", "exp_002", "exp_003"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "experiments": [
      // Array of experiment data
    ],
    "comparisonMatrix": {
      // Matrix comparing all experiments
    }
  }
}
```

---

## 4. Analytics & Statistics

### Get Experiment Statistics
```http
GET /experiments/stats
```

**Query Parameters:**
- `timeRange` (string): Time range filter - 'day', 'week', 'month', 'year', 'all'

**Response:**
```json
{
  "success": true,
  "data": {
    "totalExperiments": 150,
    "validExperiments": 142,
    "invalidExperiments": 8,
    "profitableExperiments": 98,
    "averagePnL": 1250.50,
    "averageWinRate": 0.65,
    "averageSharpeRatio": 1.15,
    "topPerformingTags": [
      { "tag": "ml", "avgPnL": 1800.00 },
      { "tag": "trading", "avgPnL": 1450.00 }
    ],
    "improvementDistribution": {
      "Open": 45,
      "Close": 38,
      "Reg": 25,
      "No Improvement": 42
    }
  }
}
```

### Get Performance Metrics Over Time
```http
GET /experiments/performance-timeline
```

**Query Parameters:**
- `startDate` (string): Start date (ISO format)
- `endDate` (string): End date (ISO format)
- `groupBy` (string): Grouping - 'day', 'week', 'month'

**Response:**
```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "date": "2024-01-01",
        "experimentsCount": 5,
        "averagePnL": 1200.00,
        "averageWinRate": 0.68,
        "totalPnL": 6000.00
      }
    ]
  }
}
```

---

## 5. Data Export

### Export Experiments to CSV
```http
GET /experiments/export/csv
```

**Query Parameters:**
- `search` (string): Search filter
- `filterType` (string): Type filter
- `tags` (string): Tag filter
- `sortBy` (string): Sort field
- `sortOrder` (string): Sort direction

**Response:**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="experiments_export.csv"

Code,Date,Author,Description,Status,Tags,PnL,Profit,Loss,Win Rate,Total Trades,Sharpe Ratio,Max Drawdown,Precision,Recall,F1 Score,Accuracy
EXP_2024_001,2024-01-15,John Doe,Experiment with new ML model,valid,"ml,trading,neural-network",1250.50,2000.00,-749.50,68.0,150,1.25,15.0,75.0,68.0,71.0,72.0
```

### Export Experiments to JSON
```http
GET /experiments/export/json
```

**Query Parameters:** Same as CSV export

**Response:**
```json
{
  "success": true,
  "data": {
    "experiments": [
      // Array of experiment objects
    ],
    "exportInfo": {
      "exportedAt": "2024-01-15T10:30:00Z",
      "totalExported": 150,
      "filters": {
        "search": "ml",
        "filterType": "all",
        "tags": ["trading"]
      }
    }
  }
}
```

---

## 6. File Upload & Management

### Upload Experiment Data
```http
POST /experiments/upload
```

**Request Body:** Multipart form data
- `file` (file): CSV/JSON file with experiment data
- `format` (string): File format - 'csv' or 'json'
- `overwrite` (boolean): Whether to overwrite existing experiments

**Response:**
```json
{
  "success": true,
  "data": {
    "uploaded": 25,
    "skipped": 3,
    "errors": [
      {
        "row": 5,
        "error": "Invalid date format"
      }
    ]
  },
  "message": "File uploaded successfully"
}
```

### Get Upload Templates
```http
GET /experiments/upload/templates
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "name": "experiment_template.csv",
        "url": "/api/v1/experiments/upload/templates/experiment_template.csv",
        "description": "CSV template for experiment data"
      },
      {
        "name": "experiment_template.json",
        "url": "/api/v1/experiments/upload/templates/experiment_template.json",
        "description": "JSON template for experiment data"
      }
    ]
  }
}
```

---

## 7. User Management

### Get Current User
```http
GET /users/me
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_001",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "researcher",
      "permissions": ["read", "write", "delete"],
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

### Update User Profile
```http
PUT /users/me
```

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      // Updated user data
    }
  },
  "message": "Profile updated successfully"
}
```

---

## 8. Authentication

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_001",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "researcher"
    }
  },
  "message": "Login successful"
}
```

### Register
```http
POST /auth/register
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "password": "password123",
  "role": "researcher"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_002",
      "email": "jane.smith@example.com",
      "name": "Jane Smith",
      "role": "researcher"
    }
  },
  "message": "Registration successful"
}
```

### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "new_access_token_here",
    "refreshToken": "new_refresh_token_here"
  }
}
```

### Logout
```http
POST /auth/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 9. Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Experiment not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## 10. Rate Limiting

All endpoints are rate-limited:
- **Authentication endpoints**: 5 requests per minute
- **Data modification endpoints**: 100 requests per hour
- **Data retrieval endpoints**: 1000 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642233600
```

---

## 11. WebSocket Events (Real-time Updates)

Connect to WebSocket endpoint for real-time updates:
```
ws://localhost:3001/api/v1/ws
```

### Events

#### Experiment Created
```json
{
  "type": "experiment_created",
  "data": {
    "experiment": {
      // New experiment data
    }
  }
}
```

#### Experiment Updated
```json
{
  "type": "experiment_updated",
  "data": {
    "experiment": {
      // Updated experiment data
    }
  }
}
```

#### Experiment Deleted
```json
{
  "type": "experiment_deleted",
  "data": {
    "experimentId": "exp_001"
  }
}
```

---

## Database Schema

### Experiments Table
```sql
CREATE TABLE experiments (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(100) UNIQUE NOT NULL,
  date TIMESTAMP NOT NULL,
  author VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('valid', 'invalid') DEFAULT 'valid',
  tags JSON,
  improvements JSON,
  financial_metrics JSON,
  ml_metrics JSON,
  trading_metrics JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tags Table
```sql
CREATE TABLE tags (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'researcher', 'viewer') DEFAULT 'researcher',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

This API documentation covers all the functionality needed to support the experiment management system with full CRUD operations, filtering, sorting, analytics, and real-time updates. 