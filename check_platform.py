import os
import re

def check_files(directory):
    missing_platform = []
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        for file in files:
            if file.endswith(('.js', '.ts', '.tsx', '.jsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r') as f:
                        lines = f.readlines()
                        content = "".join(lines)
                        if 'Platform' in content:
                            has_import = re.search(r'import.*Platform.*from\s+[\'"]react-native[\'"]', content, re.DOTALL)
                            has_require = re.search(r'const.*Platform.*=.*require\([\'"]react-native[\'"]\)', content)
                            if not (has_import or has_require):
                                # Double check if it's actually used and not just mentioned in a comment or string
                                for i, line in enumerate(lines):
                                    if 'Platform.' in line and not line.strip().startswith(('//', '*', '/*')):
                                        missing_platform.append((path, i + 1, line.strip()))
                                        break
                except Exception as e:
                    pass
    return missing_platform

if __name__ == "__main__":
    results = check_files('.')
    for path, line_no, content in results:
        print(f"MISSING IN {path}:{line_no} -> {content}")
