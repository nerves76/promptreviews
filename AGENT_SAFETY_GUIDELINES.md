# AI Agent Safety Guidelines - PromptReviews Project

**Target Audience:** AI Assistants, Code Generation Tools, Automated Systems  
**Purpose:** Prevent destructive operations and ensure safe code modifications  
**Priority:** 🚨 **MANDATORY** - All agents MUST follow these guidelines  

---

## 🚨 **CRITICAL ALERT: DATABASE DELETION INCIDENT OCCURRED**

This project recently experienced a **database deletion incident** where an external agent deleted the production database. These guidelines are designed to prevent similar incidents.

**EVERY AI AGENT MUST FOLLOW THESE SAFETY PROTOCOLS WITHOUT EXCEPTION.**

---

## 🛡️ **MANDATORY SAFETY PROTOCOLS**

### **PROTOCOL 1: NEVER DELETE WITHOUT EXPLICIT APPROVAL**

```
❌ FORBIDDEN OPERATIONS - NEVER DO THESE:

Database Operations:
- DROP TABLE
- DROP DATABASE  
- DELETE FROM (without WHERE clause)
- TRUNCATE TABLE
- DROP SCHEMA
- ALTER TABLE DROP COLUMN (without backup)

File Operations:
- rm -rf / (or any critical directory)
- Deleting entire src/ directory
- Deleting package.json
- Deleting .env files
- Deleting supabase/ directory
- Deleting restore_complete_schema.sql
- Deleting database-restoration-toolkit.js

Git Operations:
- git reset --hard (without backup)
- git push --force
- Deleting .git directory
```

### **PROTOCOL 2: ASK BEFORE ANY DESTRUCTIVE OPERATION**

**ALWAYS ask the user before:**
- Deleting ANY file or directory
- Modifying database schema
- Changing configuration files
- Running shell commands with `rm`, `DROP`, `DELETE`
- Modifying environment variables

**Example Safe Communication:**
```
🤖 "I need to modify [filename]. This file appears to handle [functionality]. 
    Should I proceed with this change? 
    
    Alternative approaches:
    1. [Safe alternative 1]
    2. [Safe alternative 2]
    
    What would you prefer?"
```

### **PROTOCOL 3: VALIDATE BEFORE EXECUTING**

**Before making ANY change, run:**
```bash
# Check system safety
npm run safety:full-audit

# Check file integrity  
npm run safety:check-files

# Verify database status
npm run db:assess
```

---

## ✅ **SAFE OPERATION PROCEDURES**

### **File Modifications**
```bash
# ✅ SAFE: Always read files first
cat filename.js
head -20 filename.js

# ✅ SAFE: Create backups before major changes
cp important-file.js important-file.js.backup

# ✅ SAFE: Make targeted changes only
# Edit specific functions or lines, not entire files

# ✅ SAFE: Verify changes
git diff filename.js
```

### **Database Operations**
```bash
# ✅ SAFE: Read-only operations
SELECT * FROM table_name LIMIT 10;
DESCRIBE table_name;

# ⚠️ REQUIRES USER APPROVAL: Write operations
INSERT INTO table_name (col1, col2) VALUES ('value1', 'value2');
UPDATE table_name SET column = 'value' WHERE id = 123;

# 🚨 FORBIDDEN WITHOUT EXPLICIT APPROVAL: Destructive operations
DELETE FROM table_name WHERE condition;
DROP TABLE table_name;
```

### **Configuration Changes**
```bash
# ✅ SAFE: Check current configuration
cat next.config.js
cat package.json

# ⚠️ REQUIRES USER APPROVAL: Modify configuration
# Any changes to package.json, next.config.js, .env files
```

---

## 🔍 **MANDATORY CHECKS BEFORE ANY OPERATION**

### **Step 1: Understand the Current State**
```bash
# Check what exists
ls -la
git status
npm run db:assess

# Read files you plan to modify
cat filename.js
```

### **Step 2: Validate Your Intended Changes**
```bash
# Run safety audit
npm run safety:full-audit

# Check for dangerous patterns
npm run safety:check-command "your-proposed-command"

# Validate SQL if applicable
npm run safety:validate-sql "your-sql-content"
```

### **Step 3: Ask for Approval**
- **Explain what you want to change**
- **Explain why it's needed**
- **Identify any risks**
- **Provide alternatives**
- **Wait for explicit user confirmation**

### **Step 4: Execute Safely**
- **Make minimal changes**
- **Test immediately after each change**
- **Document what was changed**
- **Verify functionality still works**

---

## 📋 **CRITICAL FILES - NEVER DELETE**

These files are **CRITICAL** for system operation and recovery:

```
🚨 NEVER DELETE THESE FILES:
- .env (any environment file)
- package.json (dependencies)
- next.config.js (build configuration)  
- supabase/config.toml (database config)
- restore_complete_schema.sql (database restoration)
- database-restoration-toolkit.js (recovery tools)
- CODE_PROTECTION_SYSTEM.md (safety guidelines)
- DATABASE_RESTORATION_PLAN.md (recovery procedures)
- AGENT_SAFETY_GUIDELINES.md (this file)
- src/app/ (application code directory)
- public/widgets/ (widget implementations)
- supabase/migrations/ (database migrations)
```

---

## 🚨 **DANGER ZONES - EXTREME CAUTION REQUIRED**

### **Database Schema Changes**
- **Any SQL involving DROP, DELETE, TRUNCATE**
- **Modifying RLS policies**
- **Changing table structures**
- **Bulk data operations**

### **Configuration Modifications**
- **Environment variables (.env files)**
- **Build configuration (next.config.js)**
- **Package dependencies (package.json)**
- **Database configuration (supabase/config.toml)**

### **File System Operations**
- **Deleting directories**
- **Mass file operations** 
- **Modifying Git history**
- **Changing file permissions**

---

## 🤖 **AGENT-SPECIFIC INSTRUCTIONS**

### **For Code Generation Agents**
1. **Generate code incrementally** - small functions, not entire files
2. **Never overwrite existing files** without reading them first
3. **Always preserve existing functionality** unless explicitly asked to remove it
4. **Comment your generated code** to explain what it does

### **For Database Agents**
1. **Use SELECT statements** to understand data before modifying
2. **Never run DELETE or DROP** without explicit user approval
3. **Always include WHERE clauses** in UPDATE and DELETE operations
4. **Test queries on sample data** when possible

### **For Configuration Agents**
1. **Read existing configuration** before suggesting changes
2. **Make minimal modifications** to configuration files
3. **Preserve comments and formatting** in config files
4. **Ask about dependencies** before adding or removing packages

### **For File Management Agents**
1. **List directory contents** before making changes
2. **Never delete files** without explicit permission
3. **Create backups** before major modifications
4. **Preserve file permissions** and ownership

---

## 📞 **COMMUNICATION TEMPLATES**

### **When Proposing File Changes**
```
🤖 "I need to modify [filename] to [reason]. 

Current file contains:
- [functionality 1]
- [functionality 2]

Proposed changes:
- [change 1] - [why needed]
- [change 2] - [why needed]

Potential risks:
- [risk 1]
- [risk 2]

Should I proceed? Would you prefer a different approach?"
```

### **When Uncertain About Code**
```
🤖 "I found this code in [filename]:

[code snippet]

This appears to handle [description], but I'm not certain about [specific uncertainty].

Could you clarify:
1. [question 1]
2. [question 2]

This will help me make the safest possible changes."
```

### **When Errors Occur**
```
🤖 "❌ ERROR OCCURRED

Operation: [what I was trying to do]
Error: [error message]
Files affected: [list of files]

I have STOPPED all operations immediately.

What would you like me to do next:
1. Attempt to rollback changes
2. Investigate the error further  
3. Try a different approach
4. Wait for your guidance"
```

---

## 🔧 **EMERGENCY PROCEDURES**

### **If You Accidentally Delete Something**
1. **STOP ALL OPERATIONS IMMEDIATELY**
2. **Do not make any more changes**
3. **Report to user: "❌ ACCIDENTAL DELETION - I deleted [filename]. Operations stopped."**
4. **Check if Git can restore: `git status`, `git checkout filename`**
5. **Check for backups: `ls *.backup`**
6. **Wait for user instructions**

### **If Database Operation Fails**
1. **STOP ALL DATABASE OPERATIONS**
2. **Report error immediately**
3. **Run: `npm run db:assess`**
4. **Check if restoration is needed: `npm run db:verify`**
5. **Wait for user guidance**

### **If Application Breaks**
1. **STOP ALL CHANGES**
2. **Report what was being changed when it broke**
3. **Run: `git diff` to show changes**
4. **Check: `npm run dev` - does it start?**
5. **Offer to revert: `git checkout -- filename`**

---

## ✅ **VERIFICATION CHECKLIST**

Before completing any task, verify:

### **File Operations**
- [ ] No critical files were deleted
- [ ] Backups exist for modified files
- [ ] Changes are minimal and targeted
- [ ] Application still starts (`npm run dev`)
- [ ] No broken imports or references

### **Database Operations**
- [ ] No destructive operations without approval
- [ ] Database connection still works
- [ ] Critical tables still exist
- [ ] Data integrity maintained

### **Configuration Changes**
- [ ] Configuration files are valid
- [ ] No required settings removed
- [ ] Environment variables intact
- [ ] Build process still works

---

## 🎯 **SUCCESS CRITERIA**

An operation is successful only when:

1. ✅ **Intended functionality works** as expected
2. ✅ **No existing functionality broken**
3. ✅ **No critical files deleted** or corrupted
4. ✅ **User approves** the changes made
5. ✅ **Safety checks pass** (`npm run safety:full-audit`)
6. ✅ **Application starts** without errors
7. ✅ **Database connectivity** maintained
8. ✅ **All tests pass** (if applicable)

---

## 🚨 **FINAL SAFETY REMINDER**

### **REMEMBER THE GOLDEN RULES:**

1. **🛑 STOP AND ASK** if you're uncertain about anything
2. **🔍 UNDERSTAND BEFORE MODIFYING** - read and comprehend code first
3. **💾 BACKUP BEFORE CHANGING** - create backups of important files
4. **🧪 TEST AFTER CHANGING** - verify functionality works
5. **📝 DOCUMENT WHAT YOU DO** - explain your changes clearly

### **WHEN IN DOUBT:**
- **ASK the user for clarification**
- **PROPOSE alternatives** rather than proceeding blindly
- **EXPLAIN your uncertainty** so the user can guide you
- **WAIT for explicit approval** before making changes

---

**This project has already suffered one database deletion incident. Let's ensure it never happens again by following these guidelines religiously.**

**Better to ask and be safe than to act and cause damage.**