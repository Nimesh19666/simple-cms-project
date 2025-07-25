# 🚀 Quick Setup Guide for Interviewers

## ⏱️ **5-Minute Setup** (Everything you need to test the CMS)

### **Prerequisites**

- PHP 8.2+, Composer, Node.js 18+, MySQL

### **1. Clone & Setup Backend (2 minutes)**

```bash
git clone https://github.com/Nimesh19666/simple-cms-project.git
cd simple-cms-project/backend

composer install
cp .env.example .env
php artisan key:generate

# Update .env database settings:
DB_DATABASE=cms_test
DB_USERNAME=root
DB_PASSWORD=your_password

# Optional: Add Gemini API key for AI features
GEMINI_API_KEY=your_key_here

php artisan migrate --seed
```

### **2. Setup Frontend (1 minute)**

```bash
cd ../frontend
npm install
cp .env.local.example .env.local
# .env.local should have: NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

### **3. Start Both Servers (30 seconds)**

```bash
# Terminal 1 - Backend
cd backend && php artisan serve

# Terminal 2 - Frontend
cd frontend && npm run dev

# Terminal 3 - Queue Worker (for AI features)
cd backend && php artisan queue:work
```

### **4. Test Login (30 seconds)**

- **Frontend**: http://localhost:3000
- **Admin**: admin@example.com / password
- **Author**: author@example.com / password

---

## 🧪 **Testing Features**

### **Quick Feature Demo (5 minutes)**

1. **Login as Admin** → See category management
2. **Create Category** → "Technology", "Design"
3. **Create Article** → Watch AI generate slug/summary
4. **Test Filtering** → Status, category, date filters
5. **Login as Author** → See limited access

### **API Testing (Postman)**

1. Import: `postman/Simple-CMS-API.postman_collection.json`
2. Run "Login Admin" to get token
3. Test all endpoints with authentication

---

## 🎯 **Key Features to Demonstrate**

### **✅ Working Features**

- **Authentication**: Token-based with role permissions
- **Article CRUD**: Full create, read, update, delete
- **AI Processing**: Auto slug/summary generation (if API key added)
- **Filtering**: Status, category, date range filters
- **Authorization**: Admin vs Author access control

### **🤖 AI Features (Optional)**

- If no Gemini API key: Falls back to simple slug generation
- With API key: Full AI processing with queues

### **📱 User Roles**

- **Admin**: Manages everything (articles + categories)
- **Author**: Manages only own articles

---

## 🔧 **Troubleshooting**

### **Common Issues & Fixes**

```bash
# Database connection error?
php artisan migrate:refresh --seed

# Port 8000 busy?
php artisan serve --port=8080
# Update frontend .env.local: NEXT_PUBLIC_API_URL=http://127.0.0.1:8080/api

# Queue not working?
# Just creates articles without AI processing (still works)

# Permission errors?
chmod -R 775 storage bootstrap/cache
```

### **Verify Setup**

```bash
# Test API directly
curl http://127.0.0.1:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Should return user object + token
```

---

## 📋 **Project Highlights to Discuss**

### **Technical Architecture**

- **API-First Design**: Separate frontend/backend
- **Token Authentication**: Stateless, scalable
- **Queue System**: Background AI processing
- **Role-Based Security**: Policies and middleware

### **Code Quality**

- **Clean Structure**: Controllers, models, jobs separation
- **Error Handling**: Try-catch with fallbacks
- **Validation**: Frontend + backend validation
- **Security**: CORS, authentication, authorization

### **Advanced Features**

- **AI Integration**: External API with async processing
- **Database Design**: Proper relationships and indexes
- **State Management**: React Context for global state
- **Performance**: Optimized queries and caching

---

## 🎤 **Interview Demo Script**

### **5-Minute Walkthrough**

1. **"Let me show you the architecture"** → Explain API-first design
2. **"Here's the authentication flow"** → Demo login, show token
3. **"This is the AI processing"** → Create article, show async AI
4. **"Notice the role-based access"** → Switch between admin/author
5. **"The filtering system"** → Demo all filter options

### **Code Deep-Dive Points**

- **ArticleController**: Show CRUD operations
- **GenerateArticleDetails Job**: Explain queue processing
- **AuthContext**: React state management
- **ArticlePolicy**: Authorization logic

---

## 💼 **Production Readiness**

### **What's Included**

✅ **Error Handling**: Comprehensive try-catch blocks  
✅ **Validation**: Frontend + backend validation  
✅ **Security**: Token auth, CORS, role-based access  
✅ **Performance**: Queue system, optimized queries  
✅ **Documentation**: README, API docs, comments  
✅ **Testing**: Postman collection included

### **Scalability Considerations**

- Database indexes on common query fields
- Queue system for heavy operations
- Token-based auth for stateless scaling
- Proper error logging and monitoring

---

## 📞 **Support**

**If you encounter any issues:**

- Check the main README.md for detailed setup
- All default credentials are in the README
- Contact: gujarinimesh@gmail.com

**This CMS demonstrates production-ready full-stack development with modern best practices!** 🚀
