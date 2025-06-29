# Code Protection System - Agent Safety Protocols

**Created:** January 27, 2025, 8:45 PM  
**Purpose:** Prevent destructive changes and code deletion by AI agents  
**Priority:** 🚨 **CRITICAL** - Database deletion incident prevention

## 🛡️ **CORE PROTECTION PRINCIPLES**

### **1. NO DESTRUCTIVE OPERATIONS WITHOUT EXPLICIT CONFIRMATION**
- ❌ **NEVER** delete files without explicit user approval
- ❌ **NEVER** drop database tables or schemas
- ❌ **NEVER** remove critical configuration files
- ❌ **NEVER** delete entire directories
- ❌ **NEVER** clear or truncate data without backups

### **2. BACKUP BEFORE MODIFY**
- ✅ **ALWAYS** create backups before major changes
- ✅ **ALWAYS** verify backups are valid before proceeding
- ✅ **ALWAYS** document what's being changed and why
- ✅ **ALWAYS** test changes in isolation first

### **3. INCREMENTAL CHANGES ONLY**
- ✅ Make small, testable changes
- ✅ Verify each change before proceeding
- ✅ Stop immediately if errors occur
- ✅ Ask for confirmation on uncertain changes

## 🚨 **FORBIDDEN OPERATIONS**

### **Database Operations**
```bash
# ❌ NEVER execute these without explicit user approval:
DROP TABLE
DROP DATABASE  
DELETE FROM (without WHERE clause)
TRUNCATE TABLE
DROP SCHEMA
ALTER TABLE DROP COLUMN (without backup)
```

### **File Operations**
```bash
# ❌ NEVER execute these without explicit user approval:
rm -rf /
rm -rf *
rm -rf src/
rm -rf public/
rm -rf supabase/
git reset --hard HEAD~
git push --force
```

### **Configuration Changes**
```bash
# ❌ NEVER modify these without explicit user approval:
.env files (environment variables)
package.json (dependencies)
next.config.js (build configuration)
supabase/config.toml (database config)
```

## ✅ **SAFE OPERATION PROTOCOLS**

### **Before Making ANY Changes**
1. **Identify what will be modified**
2. **Explain the change to the user**
3. **Ask for explicit confirmation**
4. **Create backups if needed**
5. **Test in isolation if possible**

### **File Modifications**
```bash
# ✅ SAFE: Read files first
cat filename.js

# ✅ SAFE: Make targeted changes
# Edit specific lines or functions only

# ✅ SAFE: Verify changes
git diff filename.js

# ❌ DANGEROUS: Don't rewrite entire files
# Unless you understand EXACTLY what they do
```

### **Database Operations**
```bash
# ✅ SAFE: Read operations
SELECT * FROM table_name LIMIT 10;

# ✅ SAFE: Single record operations
UPDATE table_name SET column = value WHERE id = specific_id;

# ⚠️ REQUIRES CONFIRMATION: Bulk operations
DELETE FROM table_name WHERE condition;
```

## 🔍 **MANDATORY VERIFICATION CHECKLIST**

Before any significant change, verify:

### **File Changes**
- [ ] File serves a clear purpose I understand
- [ ] Change is targeted and specific
- [ ] No critical functionality is being removed
- [ ] Backup exists if needed
- [ ] User has approved the change

### **Database Changes**
- [ ] Change is reversible
- [ ] Backup exists
- [ ] Change is tested on sample data
- [ ] User has explicitly approved
- [ ] Impact is clearly understood

### **Configuration Changes**
- [ ] Change is documented
- [ ] Previous configuration is backed up
- [ ] Change is minimal and targeted
- [ ] User has approved the change
- [ ] Rollback procedure is clear

## 🚀 **SAFE DEVELOPMENT WORKFLOW**

### **1. Assessment Phase**
```bash
# Always start by understanding the current state
npm run db:assess
git status
ls -la
```

### **2. Planning Phase**
- **Document what you intend to change**
- **Explain why the change is needed**
- **Identify potential risks**
- **Plan rollback procedures**

### **3. Implementation Phase**
- **Make minimal changes**
- **Test each change immediately**
- **Verify functionality still works**
- **Document what was changed**

### **4. Verification Phase**
- **Test the complete user journey**
- **Verify no functionality was broken**
- **Check for unintended side effects**
- **Confirm user satisfaction**

## 🔧 **PROTECTIVE TOOLS & COMMANDS**

### **Safe File Operations**
```bash
# ✅ SAFE: Read files
cat filename
head -20 filename
tail -20 filename

# ✅ SAFE: Copy before modifying
cp filename filename.backup
cp -r directory/ directory.backup/

# ✅ SAFE: Check file status
ls -la filename
stat filename
```

### **Safe Database Operations**
```bash
# ✅ SAFE: Check database status
npm run db:assess
npm run db:verify

# ✅ SAFE: Read operations
npm run db:test-connection
```

### **Safe Git Operations**
```bash
# ✅ SAFE: Check status
git status
git log --oneline -10

# ✅ SAFE: Review changes
git diff
git diff --cached

# ✅ SAFE: Commit changes
git add specific-file
git commit -m "Clear description of change"
```

## 🚨 **AGENT SAFETY RULES**

### **RULE 1: ASK BEFORE DELETING ANYTHING**
- If you need to delete a file, ask: "Should I delete [filename]? It contains [description]."
- If you need to remove code, ask: "Should I remove this code block? It appears to handle [functionality]."
- If you're unsure what code does, ask: "This code appears to [description]. Is it safe to modify?"

### **RULE 2: BACKUP BEFORE MAJOR CHANGES**
- Always create backups of critical files before modification
- Verify backups are complete and valid
- Document what was backed up and why

### **RULE 3: INCREMENTAL CHANGES ONLY**
- Make one change at a time
- Test each change before proceeding
- Stop if anything breaks or behaves unexpectedly

### **RULE 4: UNDERSTAND BEFORE MODIFYING**
- If you don't understand what code does, ask
- If you're unsure about a change's impact, ask
- If the code looks critical or complex, ask

### **RULE 5: VERIFY EVERYTHING**
- Test changes immediately after making them
- Verify the application still works
- Check for unintended side effects

## 📋 **CRITICAL FILE PROTECTION LIST**

### **NEVER DELETE WITHOUT EXPLICIT APPROVAL**
```
.env*                           # Environment variables
package.json                    # Dependencies
next.config.js                  # Build configuration
supabase/config.toml           # Database configuration
restore_complete_schema.sql     # Database restoration
database-restoration-toolkit.js # Recovery tools
supabase/migrations/           # Database migrations
src/app/                       # Application code
public/widgets/                # Widget implementations
```

### **NEVER MODIFY WITHOUT UNDERSTANDING**
```
middleware.ts                  # Request handling
src/utils/supabase.ts         # Database connection
src/contexts/                 # React contexts
src/app/api/                  # API endpoints
RLS policies                  # Database security
```

## 🎯 **COMMUNICATION PROTOCOLS**

### **When Proposing Changes**
- **Explain WHAT you want to change**
- **Explain WHY the change is needed**
- **Explain WHAT could go wrong**
- **Provide ALTERNATIVES if possible**

### **When Uncertain**
- **Ask for clarification immediately**
- **Don't guess or assume**
- **Explain what you're unsure about**
- **Provide options for user to choose**

### **When Errors Occur**
- **Stop immediately**
- **Explain what went wrong**
- **Provide error details**
- **Ask for guidance before continuing**

## 🔍 **MONITORING & ALERTS**

### **Signs of Dangerous Operations**
- Multiple file deletions
- Database schema changes
- Environment variable modifications
- Bulk data operations
- Configuration file changes

### **Immediate Action Required**
- Stop the operation
- Assess the damage
- Inform the user
- Implement recovery procedures

## 📚 **RECOVERY PROCEDURES**

### **If Files Are Accidentally Deleted**
1. **Stop all operations immediately**
2. **Check if backups exist**
3. **Use Git to restore if possible**
4. **Inform user of the situation**
5. **Implement recovery from backups**

### **If Database Is Modified Unexpectedly**
1. **Stop all database operations**
2. **Run database assessment**
3. **Use restoration tools if needed**
4. **Verify data integrity**
5. **Inform user of the situation**

## ✅ **AGENT VERIFICATION COMMANDS**

Before making changes, always run:
```bash
# Check current state
git status
npm run db:assess
ls -la

# Verify application works
npm run dev
# Test critical functions

# Create backup if needed
cp -r critical-directory/ critical-directory.backup/
```

## 📞 **ESCALATION PROCEDURES**

### **When to Stop and Ask**
- Uncertain about code functionality
- Considering deleting files
- Making database changes
- Modifying configuration
- Seeing unexpected errors

### **How to Ask for Help**
- Explain the current situation
- Describe what you want to do
- Explain why you're uncertain
- Provide options for user to choose
- Wait for explicit confirmation

---

## 🚨 **FINAL SAFETY REMINDER**

**REMEMBER: It's better to ask and be safe than to delete and be sorry.**

The recent database deletion incident shows the importance of these protocols. Always err on the side of caution and ask for confirmation when uncertain.

**When in doubt, STOP and ASK.**