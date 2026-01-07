"""
FastAPI Backend for PDF → Excel Pipeline
Fully patched version – stable absolute paths & correct pipeline integration
"""


import os
import uuid
import shutil
from pathlib import Path
from typing import Dict
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Import user’s full pipeline script
import full_pipeline

# Import utilities
from utils.file_manager import create_task_directories, save_uploaded_files
from utils.zipper import zip_output_folder

# Load environment variables
load_dotenv()

# ---------------------------------------------
# ABSOLUTE BASE DIRECTORY FIX (VERY IMPORTANT)
# ---------------------------------------------
# Backend root = folder where THIS file exists


BACKEND_ROOT = Path(__file__).resolve().parent

BASE_UPLOAD_DIR = BACKEND_ROOT / "uploads"
BASE_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Initialize FastAPI
app = FastAPI(title="PDF to Excel Pipeline API")

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory task tracking
TASKS: Dict[str, dict] = {}


def run_pipeline(task_id: str):
    """
    Background process:
    - Updates full_pipeline paths
    - Runs three steps
    - Zips Excel output
    """
    try:
        task_dir = BASE_UPLOAD_DIR / task_id

        # Update task status
        TASKS[task_id]["status"] = "running"
        TASKS[task_id]["progress"] = 10

        # ---------------------------------------------------
        # CRITICAL: OVERRIDE user's script directory paths
        # ---------------------------------------------------
        full_pipeline.INPUT_FOLDER = str(task_dir / "input_pdf")
        full_pipeline.TEMP_TXT_FOLDER = str(task_dir / "temp_txt")
        full_pipeline.OUTPUT_JSON_FOLDER = str(task_dir / "output_json")
        full_pipeline.OUTPUT_EXCEL_FOLDER = str(task_dir / "output_excel")

        # DEBUG PRINTS – verify correct paths
        print("\n================ PIPELINE PATHS ================")
        print("INPUT_FOLDER :", full_pipeline.INPUT_FOLDER)
        print("TEMP_TXT_FOLDER :", full_pipeline.TEMP_TXT_FOLDER)
        print("OUTPUT_JSON_FOLDER :", full_pipeline.OUTPUT_JSON_FOLDER)
        print("OUTPUT_EXCEL_FOLDER :", full_pipeline.OUTPUT_EXCEL_FOLDER)
        print("FILES IN INPUT:", os.listdir(full_pipeline.INPUT_FOLDER))
        print("================================================\n")

        # Step 1: PDF → TXT
        TASKS[task_id]["progress"] = 30
        full_pipeline.convert_pdfs_to_text()

        # Step 2: TXT → JSON (Azure AI)
        TASKS[task_id]["progress"] = 60
        full_pipeline.extract_data_with_ai()

        # Step 3: JSON → EXCEL
        TASKS[task_id]["progress"] = 85
        full_pipeline.convert_json_to_excel()

        # Step 4: ZIP EXCEL OUTPUT
        excel_dir = task_dir / "output_excel"
        zip_path = task_dir / "outputs.zip"

        TASKS[task_id]["progress"] = 95
        zip_output_folder(excel_dir, zip_path)

        # Finished
        TASKS[task_id]["status"] = "finished"
        TASKS[task_id]["progress"] = 100
        TASKS[task_id]["zip"] = str(zip_path)

    except Exception as e:
        TASKS[task_id]["status"] = "failed"
        TASKS[task_id]["error"] = str(e)
        print("\n❌ PIPELINE ERROR:", e, "\n")


@app.post("/upload")
async def upload_files(files: list[UploadFile] = File(...)):
    """
    Upload PDFs → create task directory → save PDFs
    """
    task_id = str(uuid.uuid4())
    task_dir = create_task_directories(BASE_UPLOAD_DIR, task_id)
    input_pdf_dir = task_dir / "input_pdf"

   #Bug
   #  save_uploaded_files(files, input_pdf_dir)
    await save_uploaded_files(files, input_pdf_dir)


    # INITIAL TASK STATUS
    TASKS[task_id] = {
        "status": "pending",
        "progress": 0,
        "task_dir": str(task_dir),
        "zip": None
    }

    return {"task_id": task_id}


@app.post("/start/{task_id}")
async def start_pipeline(task_id: str, background_tasks: BackgroundTasks):
    """Start pipeline run in background thread"""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")

    if TASKS[task_id]["status"] != "pending":
        raise HTTPException(status_code=400, detail="Task already started")

    background_tasks.add_task(run_pipeline, task_id)

    return {"message": "Pipeline started", "task_id": task_id}


@app.get("/status/{task_id}")
def get_status(task_id: str):
    """Return pipeline status"""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")
    return TASKS[task_id]


@app.get("/download/{task_id}")
def download_results(task_id: str):
    """
    Download ZIP file after pipeline finished
    """
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")

    status = TASKS[task_id]

    if status["status"] != "finished":
        raise HTTPException(status_code=400, detail="Pipeline not finished yet")

    zip_file = status["zip"]
    if not zip_file or not Path(zip_file).exists():
        raise HTTPException(status_code=404, detail="ZIP file missing")

    return FileResponse(
        path=zip_file,
        media_type="application/zip",
        filename="outputs.zip"
    )


@app.delete("/cleanup/{task_id}")
def cleanup_task(task_id: str):
    """Delete task folder and remove status"""
    if task_id not in TASKS:
        raise HTTPException(status_code=404, detail="Task not found")

    task_dir = Path(TASKS[task_id]["task_dir"])

    if task_dir.exists():
        shutil.rmtree(task_dir)

    del TASKS[task_id]

    return {"message": "Task data cleaned up"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
