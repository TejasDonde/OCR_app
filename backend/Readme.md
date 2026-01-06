# 🎯 Complete Backend Setup Checklist

## 📋 Files Created

Your complete backend structure should look like this:

```
backend/
│
├── main.py                        ✅ FastAPI app with all 4 endpoints
├── full_pipeline.py               ⚠️  REPLACE with your actual pipeline
│
├── utils/
│   ├── __init__.py               ✅ Create empty file
│   ├── file_manager.py           ✅ Directory & upload helpers
│   └── zipper.py                 ✅ Output compression
│
├── uploads/                       ✅ Auto-created on first run
│
├── requirements.txt               ✅ All dependencies
├── .env.example                   ✅ Template for credentials
├── .env                           ⚠️  Create from .env.example
│
├── README.md                      ✅ Complete documentation
└── test_backend.py                ✅ Testing script (optional)
```

## 🔧 Step-by-Step Setup

### 1. Create Directory Structure

```bash
mkdir -p backend/utils
cd backend
touch utils/__init__.py
```

### 2. Copy All Files

Save each artifact as the corresponding file:

- `main.py` → Main FastAPI application
- `utils/file_manager.py` → File handling utilities
- `utils/zipper.py` → Zip creation utility
- `full_pipeline.py` → Your pipeline (replace sample)
- `requirements.txt` → Dependencies
- `.env.example` → Environment template
- `README.md` → Documentation
- `test_backend.py` → Test script (optional)

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Add your Azure credentials:
```
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-actual-key
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 5. Update Your Pipeline Script

**CRITICAL:** Replace the sample `full_pipeline.py` with your actual code.

Your script MUST have:

✅ Folder variables at the top (will be auto-updated by backend):
```python
INPUT_FOLDER = "default"
TEMP_TXT_FOLDER = "default"
OUTPUT_JSON_FOLDER = "default"
OUTPUT_EXCEL_FOLDER = "default"
```

✅ Three main functions:
```python
def convert_pdfs_to_text():
    # Read from INPUT_FOLDER
    # Write to TEMP_TXT_FOLDER
    pass

def extract_data_with_ai():
    # Read from TEMP_TXT_FOLDER
    # Call Azure OpenAI
    # Write to OUTPUT_JSON_FOLDER
    pass

def convert_json_to_excel():
    # Read from OUTPUT_JSON_FOLDER
    # Write to OUTPUT_EXCEL_FOLDER
    pass
```

❌ Do NOT hardcode paths inside functions
❌ Do NOT change the function names
✅ Use the folder variables everywhere

### 6. Test Locally

```bash
# Start backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

In another terminal:
```bash
# Run test script
python test_backend.py
```

Or test manually:
```bash
# Health check
curl http://localhost:8000/

# Upload test
curl -X POST http://localhost:8000/upload \
  -F "files=@your_test.pdf"
```

### 7. Verify API Documentation

Open in browser:
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

## 🔍 Pre-Launch Checklist

Before connecting your frontend:

- [ ] Backend starts without errors
- [ ] All 4 endpoints return 200 status
- [ ] Test upload creates proper folder structure
- [ ] Pipeline runs without crashing
- [ ] Status updates correctly during processing
- [ ] outputs.zip is created after pipeline completes
- [ ] Download endpoint returns valid zip file
- [ ] CORS is configured for your frontend URL

## 🎨 Frontend Integration

Your React frontend should:

1. **Upload Files** → `POST /upload` → Get `task_id`
2. **Start Processing** → `POST /start/{task_id}`
3. **Poll Status** → `GET /status/{task_id}` (every 2-3 seconds)
4. **Download Results** → `GET /download/{task_id}` (when finished)

Example frontend fetch:

```javascript
// Upload
const formData = new FormData();
files.forEach(file => formData.append('files', file));

const uploadRes = await fetch('http://localhost:8000/upload', {
  method: 'POST',
  body: formData
});
const { task_id } = await uploadRes.json();

// Start
await fetch(`http://localhost:8000/start/${task_id}`, {
  method: 'POST'
});

// Poll status
const interval = setInterval(async () => {
  const statusRes = await fetch(`http://localhost:8000/status/${task_id}`);
  const status = await statusRes.json();
  
  if (status.status === 'finished') {
    clearInterval(interval);
    // Download
    window.location.href = `http://localhost:8000/download/${task_id}`;
  }
}, 2000);
```

## 🚨 Common Issues

### "Module not found: full_pipeline"
- Ensure `full_pipeline.py` is in the same directory as `main.py`
- Check for typos in import statement

### "CORS error" from frontend
- Update `allow_origins` in `main.py` to match your frontend URL
- Example: `allow_origins=["http://localhost:3000"]`

### Pipeline fails silently
- Check console where uvicorn is running
- Verify Azure credentials in `.env`
- Test your pipeline script independently first

### "Task not found" errors
- Status is stored in memory (resets on server restart)
- Use persistent storage (Redis/DB) for production

### Uploads folder not created
- Should auto-create on first upload
- Manually create: `mkdir -p backend/uploads`

## 📦 Production Deployment

For production:

1. **Change CORS settings** to specific frontend domain
2. **Use environment variables** for all secrets
3. **Add authentication** if needed
4. **Use persistent storage** for task status (Redis/PostgreSQL)
5. **Set up logging** for debugging
6. **Add rate limiting** to prevent abuse
7. **Configure proper file cleanup** to manage disk space

## 🎉 You're Ready!

Once all checkboxes are complete:

✅ Backend is running on http://localhost:8000
✅ API docs accessible at /docs
✅ Test script passes all tests
✅ Frontend can connect and upload files

Your PDF → Excel pipeline is now fully operational! 🚀