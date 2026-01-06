"""
utils/zipper.py
Helper function to zip output folder
"""

import zipfile
from pathlib import Path


def zip_output_folder(source_dir: Path, output_zip: Path):
    """
    Zip all files in source_dir into output_zip
    
    Args:
        source_dir: Directory containing Excel files
        output_zip: Path where zip file should be created
    """
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Walk through all files in source directory
        for file_path in source_dir.rglob('*'):
            if file_path.is_file():
                # Add file to zip with relative path
                arcname = file_path.relative_to(source_dir)
                zipf.write(file_path, arcname)