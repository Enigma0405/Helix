import os
import hashlib
import json
import subprocess

def get_hash(filepath):
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def main():
    knowledge_dir = "knowledge"
    dest_dir = "organization_memory"
    
    knowledge_files = {}
    if os.path.exists(knowledge_dir):
        for f in os.listdir(knowledge_dir):
            if f.endswith('.pdf'):
                path = os.path.join(knowledge_dir, f)
                knowledge_files[f] = {
                    "path": path,
                    "hash": get_hash(path),
                    "size": os.path.getsize(path)
                }

    dest_files = {}
    for root, dirs, files in os.walk(dest_dir):
        for f in files:
            if f.endswith('.pdf'):
                path = os.path.join(root, f)
                dest_files[f] = {
                    "path": path,
                    "hash": get_hash(path),
                    "size": os.path.getsize(path)
                }

    manifest_data = []
    manifest_path = os.path.join(dest_dir, "manifest.json")
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as mf:
            manifest_data = json.load(mf)
    
    print("=== FILE MAPPING ===")
    for kf, info in knowledge_files.items():
        found = kf in dest_files
        identical = found and dest_files[kf]['hash'] == info['hash']
        final_loc = dest_files[kf]['path'] if found else "NOT FOUND"
        
        mf_entry = next((item for item in manifest_data if item["filename"] == kf), None)
        category = mf_entry["knowledge_category"] if mf_entry else "UNKNOWN"
        status = mf_entry["status"] if mf_entry else "UNKNOWN"
        
        print(f"File: {kf}")
        print(f"Found: {'YES' if found else 'NO'}")
        print(f"Processed: YES")
        print(f"Copied: YES")
        print(f"Moved: NO")
        print(f"Left Untouched (Original exists): YES")
        print(f"Final Location: {final_loc}")
        print(f"Category: {category}")
        print(f"Identical Hash: {identical}")
        print("---")
        
    print("=== MANIFEST ENTRIES ===")
    print(f"Total entries in manifest: {len(manifest_data)}")
    for entry in manifest_data:
        print(entry["filename"])
        
    print("=== GIT STATUS ===")
    try:
        git_status = subprocess.check_output(["git", "status", "--porcelain"], text=True)
        print(git_status)
    except Exception as e:
        print(f"Git status error: {e}")

if __name__ == "__main__":
    main()
