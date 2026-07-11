import os

replacements = {
    "from src.core.storage": "from src.storage.minio_provider",
    "import src.core.storage": "import src.storage.minio_provider",
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    root_dirs = ['backend/src', 'backend/tests']
    for root_dir in root_dirs:
        for root, dirs, files in os.walk(root_dir):
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
            for file in files:
                if file.endswith('.py'):
                    process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
