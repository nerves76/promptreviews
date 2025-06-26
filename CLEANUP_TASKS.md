# Pre-Onboarding Cleanup & Optimization Tasks

## 🧹 **A. Code Cleanup & Organization**

### **1. Remove Dead Code & Files**
- [ ] Delete `src/app/dashboard/create-business/page.tsx.backup`
- [ ] Remove `old-build-widget.js` 
- [ ] Clean up `promptreviews-mirror.bfg-report/` directory
- [ ] Remove unused migration files in `supabase/migrations/`
- [ ] Delete test files: `test-env.js`, `test-resend-email.js`
- [ ] Remove duplicate RLS documentation files

### **2. Consolidate Duplicate Code**
- [ ] Merge duplicate widget components (multi/single/photo have similar patterns)
- [ ] Create shared widget utilities to reduce code duplication
- [ ] Consolidate form validation logic
- [ ] Create shared image upload utilities

### **3. File Organization**
- [ ] Move utility functions to appropriate directories
- [ ] Organize components by feature rather than type
- [ ] Split large files (>400 lines) into smaller modules
- [ ] Create consistent naming conventions

## ⚡ **B. Performance Optimizations**

### **1. Database Query Optimization**
- [ ] Add missing database indexes for frequently queried columns
- [ ] Implement query result caching for static data
- [ ] Optimize RLS policies for better performance
- [ ] Add database connection pooling

### **2. React Component Optimization**
- [ ] Implement React.memo for expensive components
- [ ] Use useMemo for expensive calculations
- [ ] Optimize useEffect dependencies
- [ ] Implement proper cleanup in useEffect hooks
- [ ] Add error boundaries for better error handling

### **3. Bundle Size Optimization**
- [ ] Implement dynamic imports for heavy components
- [ ] Optimize font loading (currently loading 30+ fonts)
- [ ] Remove unused dependencies
- [ ] Implement code splitting for routes
- [ ] Optimize image loading and compression

### **4. Caching Strategy**
- [ ] Implement Redis caching for frequently accessed data
- [ ] Add browser caching headers for static assets
- [ ] Implement service worker for offline functionality
- [ ] Cache API responses where appropriate

## 🔧 **C. Scalability Improvements**

### **1. Database Scalability**
- [ ] Implement database partitioning for large tables
- [ ] Add read replicas for analytics queries
- [ ] Optimize table schemas for better performance
- [ ] Implement database connection limits

### **2. API Optimization**
- [ ] Implement rate limiting
- [ ] Add request validation middleware
- [ ] Optimize API response times
- [ ] Implement proper error handling

### **3. Infrastructure**
- [ ] Set up CDN for static assets
- [ ] Implement proper logging and monitoring
- [ ] Add health checks for critical services
- [ ] Set up automated backups

## 🛡️ **D. Security & Reliability**

### **1. Security Hardening**
- [ ] Implement proper input validation
- [ ] Add rate limiting for authentication
- [ ] Secure file upload endpoints
- [ ] Implement proper CORS policies

### **2. Error Handling**
- [ ] Add comprehensive error boundaries
- [ ] Implement proper logging
- [ ] Add retry mechanisms for failed requests
- [ ] Implement graceful degradation

## 📊 **E. Monitoring & Analytics**

### **1. Performance Monitoring**
- [ ] Set up Core Web Vitals monitoring
- [ ] Implement database query monitoring
- [ ] Add API response time tracking
- [ ] Monitor bundle sizes

### **2. User Analytics**
- [ ] Implement proper event tracking
- [ ] Add conversion funnel tracking
- [ ] Monitor user engagement metrics
- [ ] Track feature usage

## 🚀 **F. Immediate High-Impact Changes**

### **Priority 1 (Do First)**
1. **Remove unused fonts** - Currently loading 30+ fonts unnecessarily
2. **Optimize database queries** - Add missing indexes
3. **Implement proper caching** - Add Redis for session data
4. **Clean up dead code** - Remove backup files and unused code

### **Priority 2 (Do Second)**
1. **Optimize React components** - Add memoization
2. **Implement code splitting** - Split large bundles
3. **Add error boundaries** - Improve error handling
4. **Optimize images** - Implement proper compression

### **Priority 3 (Do Third)**
1. **Set up monitoring** - Add performance tracking
2. **Implement rate limiting** - Protect against abuse
3. **Add CDN** - Improve global performance
4. **Database optimization** - Add read replicas

## 📋 **Implementation Checklist**

### **Week 1: Cleanup & Foundation**
- [ ] Remove dead code and files
- [ ] Optimize font loading
- [ ] Add missing database indexes
- [ ] Implement basic caching

### **Week 2: Performance**
- [ ] Optimize React components
- [ ] Implement code splitting
- [ ] Add error boundaries
- [ ] Optimize images

### **Week 3: Scalability**
- [ ] Set up monitoring
- [ ] Implement rate limiting
- [ ] Add CDN
- [ ] Database optimization

### **Week 4: Testing & Launch**
- [ ] Load testing
- [ ] Security audit
- [ ] Performance testing
- [ ] Launch preparation 