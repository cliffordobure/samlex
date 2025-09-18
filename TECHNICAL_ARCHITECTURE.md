# Samlex - Technical Architecture Overview
## Comprehensive Law Firm SaaS Platform

---

## **System Architecture Overview**

Samlex is built on a modern, scalable, multi-tenant SaaS architecture designed to handle thousands of concurrent users while maintaining security, performance, and reliability.

### **High-Level Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  React Frontend  │  Mobile Apps  │  Third-party Integrations │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer/CDN                       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Authentication  │  Rate Limiting  │  Request Routing        │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Express.js APIs  │  Socket.IO  │  AI Services  │  Workers   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  MongoDB  │  Redis Cache  │  File Storage  │  Message Queue │
└─────────────────────────────────────────────────────────────┘
```

---

## **Frontend Architecture**

### **Technology Stack**
- **React 18** - Modern UI framework with hooks and concurrent features
- **Vite** - Fast build tool and development server
- **TailwindCSS** - Utility-first CSS framework
- **Redux Toolkit** - Predictable state management
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Chart.js** - Data visualization
- **React Hook Form** - Form management
- **Axios** - HTTP client

### **Component Architecture**

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── common/         # Reusable UI components
│   ├── layouts/        # Page layout components
│   ├── law-firm-admin/ # Admin-specific components
│   ├── legal/          # Legal department components
│   ├── credit-collection/ # Credit collection components
│   └── system-owner/   # System owner components
├── pages/              # Page components
├── store/              # Redux store and slices
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── config/             # Configuration files
```

### **State Management**

#### **Redux Store Structure**
```javascript
{
  auth: {
    user: User | null,
    token: string | null,
    isAuthenticated: boolean,
    isLoading: boolean
  },
  lawFirms: {
    lawFirms: LawFirm[],
    currentLawFirm: LawFirm | null,
    pagination: PaginationInfo,
    isLoading: boolean,
    error: string | null
  },
  creditCases: {
    cases: CreditCase[],
    currentCase: CreditCase | null,
    filters: FilterState,
    isLoading: boolean
  },
  legalCases: {
    cases: LegalCase[],
    currentCase: LegalCase | null,
    filters: FilterState,
    isLoading: boolean
  },
  notifications: {
    notifications: Notification[],
    unreadCount: number,
    isLoading: boolean
  }
}
```

### **Real-Time Features**

#### **Socket.IO Integration**
- **Connection Management:** Automatic reconnection and error handling
- **Room Management:** Law firm-specific rooms for data isolation
- **Event Types:**
  - `case_updated` - Real-time case status updates
  - `notification_new` - New notification alerts
  - `user_online` - User presence tracking
  - `payment_received` - Payment confirmation updates

---

## **Backend Architecture**

### **Technology Stack**
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **OpenAI API** - AI integration for insights
- **Stripe** - Payment processing
- **Cloudinary** - File storage and management
- **Nodemailer** - Email service
- **Node-cron** - Scheduled tasks

### **API Architecture**

#### **RESTful API Design**
```
/api/
├── auth/              # Authentication endpoints
├── law-firms/         # Law firm management
├── users/             # User management
├── credit-cases/      # Credit collection cases
├── legal-cases/       # Legal cases
├── departments/       # Department management
├── payments/          # Payment processing
├── notifications/     # Notification system
├── reports/           # Reporting and analytics
├── ai/                # AI-powered insights
└── uploads/           # File upload handling
```

#### **API Response Format**
```javascript
{
  success: boolean,
  message: string,
  data: any,
  pagination?: {
    page: number,
    limit: number,
    total: number,
    pages: number
  },
  error?: string
}
```

### **Database Design**

#### **MongoDB Collections**

**LawFirm Collection**
```javascript
{
  _id: ObjectId,
  firmName: String,
  firmEmail: String,
  firmPhone: String,
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  subscription: {
    plan: String, // testing, basic, premium, enterprise
    status: String, // active, suspended, cancelled, trial
    startDate: Date,
    endDate: Date,
    maxUsers: Number,
    maxCases: Number,
    features: [String],
    paymentStatus: String,
    paymentMethod: String,
    amount: Number
  },
  settings: {
    allowedDepartments: [String],
    paymentMethods: [String],
    emailNotifications: Boolean,
    timezone: String
  },
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

**User Collection**
```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String,
  password: String, // hashed
  role: String, // system_owner, law_firm_admin, advocate, debt_collector
  lawFirm: ObjectId,
  department: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**CreditCase Collection**
```javascript
{
  _id: ObjectId,
  caseNumber: String,
  debtorName: String,
  debtorPhone: String,
  debtorEmail: String,
  debtAmount: Number,
  status: String, // new, in_progress, resolved, escalated
  priority: String, // low, medium, high, urgent
  assignedTo: ObjectId,
  lawFirm: ObjectId,
  department: String,
  notes: [{
    content: String,
    date: Date,
    followUpDate: Date,
    createdBy: ObjectId,
    isInternal: Boolean
  }],
  payments: [{
    amount: Number,
    date: Date,
    method: String,
    status: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**LegalCase Collection**
```javascript
{
  _id: ObjectId,
  caseNumber: String,
  clientName: String,
  clientPhone: String,
  clientEmail: String,
  caseTitle: String,
  caseType: String,
  status: String, // new, in_progress, resolved, closed
  priority: String, // low, medium, high, urgent
  assignedTo: ObjectId,
  lawFirm: ObjectId,
  courtDetails: {
    courtName: String,
    caseNumber: String,
    judge: String,
    courtDate: Date,
    nextHearing: Date,
    mentioningDate: Date
  },
  documents: [{
    name: String,
    url: String,
    type: String,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### **Authentication & Authorization**

#### **JWT Implementation**
```javascript
// Token Structure
{
  userId: ObjectId,
  email: String,
  role: String,
  lawFirm: ObjectId,
  iat: Number, // issued at
  exp: Number  // expiration
}

// Middleware
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false, message: 'Access denied' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ success: false, message: 'Invalid token' });
  }
};
```

#### **Role-Based Access Control**
```javascript
const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};

// Usage
app.get('/api/admin/users', authenticateToken, authorize(['system_owner']), getUsers);
```

---

## **AI Integration**

### **OpenAI Service Architecture**

#### **AI Service Module**
```javascript
// server/services/aiService.js
export const generateLegalInsights = async (data) => {
  const prompt = createLegalAnalysisPrompt(data);
  
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are an expert legal consultant providing analysis and recommendations."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 1500,
    temperature: 0.7
  });
  
  return parseAIResponse(completion.choices[0].message.content);
};
```

#### **AI Features**
1. **Case Recommendations**
   - Analyze case data and suggest optimal next actions
   - Predict case success probability
   - Recommend payment strategies

2. **Performance Insights**
   - Generate automated reports
   - Identify performance trends
   - Suggest improvement opportunities

3. **Payment Predictions**
   - Forecast payment likelihood
   - Analyze debtor behavior patterns
   - Optimize collection strategies

### **AI API Endpoints**
```javascript
// AI-powered endpoints
POST /api/ai/legal-insights        # Generate legal case insights
POST /api/ai/credit-insights       # Generate credit collection insights
POST /api/ai/case-recommendations  # Get case recommendations
POST /api/ai/payment-predictions   # Predict payment likelihood
POST /api/ai/comprehensive-analysis # Full analysis suite
```

---

## **Payment Processing**

### **Stripe Integration**

#### **Payment Flow**
```javascript
// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount * 100, // Convert to cents
  currency: 'kes',
  metadata: {
    lawFirmId: lawFirm._id,
    caseId: case._id,
    purpose: 'subscription'
  }
});

// Handle payment confirmation
app.post('/api/payments/confirm', async (req, res) => {
  const { paymentIntentId } = req.body;
  
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  
  if (paymentIntent.status === 'succeeded') {
    // Update law firm subscription
    await LawFirm.findByIdAndUpdate(lawFirmId, {
      'subscription.status': 'active',
      'subscription.paymentStatus': 'completed',
      'subscription.lastPaymentDate': new Date()
    });
  }
});
```

#### **Payment Methods**
- **Credit/Debit Cards** - Stripe integration
- **M-Pesa** - Mobile money integration
- **Bank Transfer** - Direct bank transfers
- **Cash** - Manual payment tracking

---

## **Real-Time Communication**

### **Socket.IO Implementation**

#### **Server-Side Socket Setup**
```javascript
// server.js
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join law firm room
  socket.on('join-law-firm', (lawFirmId) => {
    socket.join(`law-firm-${lawFirmId}`);
  });
  
  // Handle case updates
  socket.on('case-updated', (data) => {
    socket.to(`law-firm-${data.lawFirmId}`).emit('case-updated', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

#### **Client-Side Socket Integration**
```javascript
// client/src/hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (lawFirmId) => {
  const [socket, setSocket] = useState(null);
  
  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL);
    
    newSocket.emit('join-law-firm', lawFirmId);
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, [lawFirmId]);
  
  return socket;
};
```

---

## **Security Implementation**

### **Security Measures**

#### **Authentication Security**
- **JWT Tokens** - Secure token-based authentication
- **Password Hashing** - bcryptjs for password security
- **Token Expiration** - Short-lived access tokens
- **Refresh Tokens** - Secure token renewal

#### **API Security**
- **Rate Limiting** - Prevent API abuse
- **CORS** - Cross-origin resource sharing control
- **Helmet** - Security headers
- **Input Validation** - Sanitize all inputs
- **SQL Injection Prevention** - MongoDB ODM protection

#### **Data Security**
- **Encryption at Rest** - Database encryption
- **Encryption in Transit** - HTTPS/TLS
- **Data Isolation** - Multi-tenant data separation
- **Audit Logging** - Complete activity tracking

### **Security Middleware**
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Security headers
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

---

## **Performance Optimization**

### **Frontend Optimization**

#### **Code Splitting**
```javascript
// Lazy loading components
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const LegalDashboard = lazy(() => import('./pages/Legal/Dashboard'));

// Route-based code splitting
<Route path="/admin" element={
  <Suspense fallback={<Loading />}>
    <AdminDashboard />
  </Suspense>
} />
```

#### **State Management Optimization**
- **Redux Toolkit** - Efficient state updates
- **Memoization** - React.memo for expensive components
- **Virtual Scrolling** - For large data lists
- **Debounced Search** - Optimize search performance

### **Backend Optimization**

#### **Database Optimization**
- **Indexing** - Optimized database queries
- **Aggregation Pipelines** - Efficient data processing
- **Connection Pooling** - Manage database connections
- **Caching** - Redis for frequently accessed data

#### **API Optimization**
- **Pagination** - Limit data transfer
- **Compression** - Gzip compression
- **CDN** - Content delivery network
- **Caching Headers** - Browser caching

---

## **Monitoring & Logging**

### **Application Monitoring**

#### **Error Tracking**
```javascript
// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Log error to monitoring service
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    user: req.user?.id
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
};
```

#### **Performance Monitoring**
- **Response Time Tracking** - Monitor API performance
- **Database Query Monitoring** - Track slow queries
- **Memory Usage** - Monitor memory consumption
- **CPU Usage** - Track CPU utilization

### **Logging System**
```javascript
// Winston logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console()
  ]
});
```

---

## **Deployment Architecture**

### **Production Environment**

#### **Infrastructure**
- **Cloud Hosting** - Scalable cloud infrastructure
- **Load Balancer** - Distribute traffic across instances
- **CDN** - Global content delivery
- **SSL/TLS** - End-to-end encryption
- **Backup Systems** - Automated data backup

#### **Containerization**
```dockerfile
# Dockerfile for Node.js backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### **CI/CD Pipeline**
```yaml
# GitHub Actions workflow
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build
      - name: Deploy to production
        run: npm run deploy
```

---

## **Scalability Considerations**

### **Horizontal Scaling**

#### **Application Scaling**
- **Load Balancing** - Distribute requests across multiple instances
- **Stateless Design** - Enable horizontal scaling
- **Session Management** - Redis for session storage
- **Database Sharding** - Distribute data across multiple databases

#### **Database Scaling**
- **Read Replicas** - Distribute read operations
- **Connection Pooling** - Manage database connections efficiently
- **Caching Strategy** - Redis for frequently accessed data
- **Data Archiving** - Archive old data to reduce load

### **Performance Targets**

#### **Response Time Goals**
- **API Responses** - < 200ms for 95% of requests
- **Page Load** - < 2 seconds for initial load
- **Database Queries** - < 100ms for simple queries
- **Real-time Updates** - < 50ms for socket events

#### **Scalability Targets**
- **Concurrent Users** - 10,000+ simultaneous users
- **API Requests** - 100,000+ requests per hour
- **Database Operations** - 1,000+ operations per second
- **File Storage** - 100GB+ of document storage

---

## **Future Architecture Enhancements**

### **Planned Improvements**

#### **Microservices Architecture**
- **Service Decomposition** - Break monolith into microservices
- **API Gateway** - Centralized API management
- **Service Discovery** - Dynamic service registration
- **Event-Driven Architecture** - Asynchronous communication

#### **Advanced AI Features**
- **Machine Learning Models** - Custom ML models for predictions
- **Natural Language Processing** - Document analysis and extraction
- **Computer Vision** - Document scanning and OCR
- **Predictive Analytics** - Advanced forecasting capabilities

#### **Mobile Application**
- **React Native** - Cross-platform mobile development
- **Offline Capabilities** - Work without internet connection
- **Push Notifications** - Real-time mobile alerts
- **Biometric Authentication** - Secure mobile access

---

*This technical architecture overview provides a comprehensive understanding of Samlex's system design, implementation details, and scalability considerations. The architecture is designed to support rapid growth while maintaining security, performance, and reliability.*

