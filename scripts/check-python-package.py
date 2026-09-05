from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import tempfile
import tomllib
import venv
import zipfile


ROOT = pathlib.Path(__file__).resolve().parents[1]
PACKAGE_ROOT = ROOT / "python"
VERSION = tomllib.loads((PACKAGE_ROOT / "pyproject.toml").read_text())["project"]["version"]


subprocess.run([sys.executable, "-m", "build"], cwd=PACKAGE_ROOT, check=True)
wheel = PACKAGE_ROOT / "dist" / f"hardguard25-{VERSION}-py3-none-any.whl"
if not wheel.exists():
    raise SystemExit(f"expected wheel not found: {wheel}")

with zipfile.ZipFile(wheel) as archive:
    names = set(archive.namelist())
    required = {
        "hardguard25/__init__.py",
        "hardguard25/py.typed",
        f"hardguard25-{VERSION}.dist-info/METADATA",
        f"hardguard25-{VERSION}.dist-info/licenses/LICENSE",
    }
    missing = required - names
    if missing:
        raise SystemExit(f"wheel missing files: {sorted(missing)}")
    if any(name.startswith("tests/") for name in names):
        raise SystemExit("wheel must not contain repository tests")

with tempfile.TemporaryDirectory(prefix="hardguard25-wheel-") as temp:
    environment = pathlib.Path(temp) / "venv"
    venv.EnvBuilder(with_pip=True).create(environment)
    python = environment / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    subprocess.run(
        [str(python), "-m", "pip", "install", "--no-deps", "--no-index", str(wheel)],
        check=True,
    )
    probe = (
        "import importlib.metadata, json, hardguard25; "
        "print(json.dumps({'distribution': importlib.metadata.version('hardguard25'), "
        "'runtime': hardguard25.__version__, 'digit': hardguard25.check_digit('AC3H7PUW')}))"
    )
    result = subprocess.run([str(python), "-c", probe], cwd=temp, check=True, capture_output=True, text=True)
    observed = json.loads(result.stdout)
    expected = {"distribution": VERSION, "runtime": VERSION, "digit": "N"}
    if observed != expected:
        raise SystemExit(f"installed wheel mismatch: {observed!r}")

print("Python sdist, wheel contents, and clean consumer check passed")
