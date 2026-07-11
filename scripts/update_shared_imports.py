import os
from pathlib import Path

# Mapping of old import statements to new ones
replacements = {
    "from src.core.config": "from src.shared.config",
    "import src.core.config": "import src.shared.config",
    "from src.core.security": "from src.shared.security",
    "import src.core.security": "import src.shared.security",
    "from src.core.audit": "from src.shared.audit",
    "import src.core.audit": "import src.shared.audit",
    "from src.core.dependencies": "from src.api.dependencies",
    "import src.core.dependencies": "import src.api.dependencies",
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
            # Skip pycache and hidden dirs
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != '__pycache__']
            for file in files:
                if file.endswith('.py'):
                    process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
