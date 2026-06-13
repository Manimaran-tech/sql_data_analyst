import subprocess
import sys
import os
import shutil

def main():
    print("======================================================")
    print("SwarmAnalyst Python Sidecar Packager")
    print("======================================================")

    # 1. Install PyInstaller if not present
    try:
        import PyInstaller
        print("[INFO] PyInstaller is already installed.")
    except ImportError:
        print("Installing PyInstaller...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])

    # 2. Define target directory in Tauri structure
    tauri_binaries_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "src-tauri", "binaries")
    )
    os.makedirs(tauri_binaries_dir, exist_ok=True)

    # 3. Get platform suffix (Tauri expects target triple suffix on sidecars)
    # E.g. enterprise-analyst-backend-x86_64-pc-windows-msvc.exe on Windows
    # We can fetch the rust-style target triple using a rustc call or standard mappings:
    # On Windows, standard is x86_64-pc-windows-msvc
    target_name = "enterprise-analyst-backend-x86_64-pc-windows-msvc"
    
    print(f"Target Binary: {target_name}.exe")
    print(f"Output Directory: {tauri_binaries_dir}")

    pyinstaller_bin = os.path.join(os.path.dirname(sys.executable), "pyinstaller")
    if os.name == 'nt' and not pyinstaller_bin.endswith('.exe'):
        pyinstaller_bin += '.exe'
    if not os.path.exists(pyinstaller_bin):
        pyinstaller_bin = "pyinstaller"

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    cmd = [
        pyinstaller_bin,
        "--noconfirm",
        "--onefile",
        "--name", target_name,
        "--paths", root_dir,
        "--collect-all", "backend",
        "--distpath", tauri_binaries_dir,
        "--workpath", "build",
        "--clean",
        os.path.join(root_dir, "run_backend.py")
    ]

    print(f"Running Command: {' '.join(cmd)}")
    try:
        subprocess.check_call(cmd)
        print("\n[SUCCESS] Sidecar compilation successful!")
        print(f"Binary generated at: {os.path.join(tauri_binaries_dir, target_name + '.exe')}")
    except Exception as e:
        print(f"\n[ERROR] PyInstaller failed: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
