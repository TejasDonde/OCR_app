"""
utils/file_manager.py
Helper functions for directory and file management
"""

from pathlib import Path
from typing import List
from fastapi import UploadFile


def create_task_directories(base_dir: Path, task_id: str) -> Path:
    """
    Create directory structure for a task:
    
    backend/uploads/<task_id>/
        input_pdf/
        temp_txt/
        output_json/
        output_excel/
    """
    task_dir = base_dir / task_id
    
    # Create all subdirectories
    subdirs = ["input_pdf", "temp_txt", "output_json", "output_excel"]
    
    for subdir in subdirs:
        (task_dir / subdir).mkdir(parents=True, exist_ok=True)
    
    return task_dir


async def save_uploaded_files(files: List[UploadFile], target_dir: Path):
    """
    Save uploaded files to target directory
    """
    for file in files:
        file_path = target_dir / file.filename
        
        # Write file in chunks
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Reset file pointer for potential reuse
        await file.seek(0)