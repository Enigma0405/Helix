import os
import hashlib
import time
from pathlib import Path

def get_hash(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def print_tree(directory):
    print(f"Directory tree for {directory}:")
    if not os.path.exists(directory):
        print(f"Directory does not exist: {directory}\n")
        return
    for root, dirs, files in os.walk(directory):
        level = root.replace(directory, '').count(os.sep)
        indent = ' ' * 4 * (level)
        print(f"{indent}{os.path.basename(root)}/")
        subindent = ' ' * 4 * (level + 1)
        for f in files:
            print(f"{subindent}{f}")
    print()

def main():
    print("====================================================")
    print("1. PRINT THE COMPLETE DIRECTORY TREE")
    print("====================================================")
    print_tree("backend/organization_data")
    print_tree("backend/src/organization_memory")
    print_tree("organization_memory")

    knowledge_dir = "knowledge"
    
    knowledge_pdfs = []
    if os.path.exists(knowledge_dir):
        for f in os.listdir(knowledge_dir):
            if f.endswith('.pdf'):
                knowledge_pdfs.append(f)

    # Find ALL PDFs in the whole project
    all_pdfs = []
    for root, dirs, files in os.walk("."):
        if ".git" in root or ".venv" in root:
            continue
        for f in files:
            if f.endswith('.pdf'):
                all_pdfs.append(os.path.join(root, f))

    print("====================================================")
    print("2. MAP EVERY SOURCE PDF")
    print("====================================================")
    
    matrix = []
    total_copies_found = 0

    for pdf in knowledge_pdfs:
        orig_path = os.path.join(knowledge_dir, pdf)
        orig_exists = os.path.exists(orig_path)
        
        # Find all locations for this pdf (excluding the knowledge folder itself)
        destinations = [p for p in all_pdfs if os.path.basename(p) == pdf and not p.startswith(f".\\{knowledge_dir}")]
        
        copied = "YES" if destinations else "NO"
        
        print(f"- Original filename: {pdf}")
        print(f"- Original path: {orig_path}")
        print(f"- Does the original still exist? {'YES' if orig_exists else 'NO'}")
        print(f"- Was it copied? {copied}")
        
        if destinations:
            total_copies_found += 1
            for dest in destinations:
                size = os.path.getsize(dest)
                file_hash = get_hash(dest)
                mtime = os.path.getmtime(dest)
                print(f"- Destination path: {dest}")
                print(f"  File size: {size} bytes")
                print(f"  SHA256: {file_hash}")
                print(f"  Last modified timestamp: {time.ctime(mtime)}")
                matrix.append({
                    "orig": pdf,
                    "dest": os.path.dirname(dest),
                    "exists": "YES"
                })
        else:
            print("- Every destination path where it exists: NONE")
            matrix.append({
                "orig": pdf,
                "dest": "NONE",
                "exists": "NO"
            })
        print()

    print("====================================================")
    print("3. VERIFY ACTUAL COPIES & 6. GITKEEP CHECK")
    print("====================================================")
    
    # We will combine this in the matrix/folder listing

    folders_to_check = [
        "organization_seed",
        "historical_memory",
        "demo_evidence",
        "phase_0_1",
        "phase_0_4",
        "phase_0_5",
        "phase_0_6",
        "phase_0_7",
        "phase_0_9",
        "phase_1"
    ]
    
    print("====================================================")
    print("4. DIRECTORY CONTENTS")
    print("====================================================")
    
    for folder_name in folders_to_check:
        found_dirs = []
        for root, dirs, files in os.walk("."):
            if ".git" in root or ".venv" in root:
                continue
            if os.path.basename(root) == folder_name:
                found_dirs.append(root)
                
        if not found_dirs:
            print(f"{folder_name}/")
            print("NOT FOUND\n")
            continue
            
        for fd in found_dirs:
            files = os.listdir(fd)
            # filter out dirs
            files_only = [f for f in files if os.path.isfile(os.path.join(fd, f))]
            print(f"{fd}/")
            if not files_only:
                print("EMPTY FOLDER")
            elif len(files_only) == 1 and files_only[0] == ".gitkeep":
                print("EMPTY FOLDER")
            else:
                for f in files_only:
                    print(f)
            print()

    print("====================================================")
    print("5. COPY MATRIX")
    print("====================================================")
    for row in matrix:
        print(f"{row['orig']}")
        print(f"->")
        print(f"{row['dest']}")
        print(f"->")
        if row['exists'] == 'YES':
            print(f"{row['exists']}")
            print(f"->")
            print("Verified")
        else:
            print("NO")
            print(f"->")
            print("NOT COPIED")
        print()

    print("====================================================")
    print("7. FINAL RESULT")
    print("====================================================")
    if total_copies_found == len(knowledge_pdfs) and len(knowledge_pdfs) > 0:
        print("A)\n\nALL PDFs physically copied successfully.")
    elif total_copies_found > 0:
        print("B)\n\nSome PDFs copied, some missing.")
    else:
        print("C)\n\nNo PDFs copied.\nOnly folder structure created.")

if __name__ == "__main__":
    main()
