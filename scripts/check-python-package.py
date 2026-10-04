from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import tarfile
import tempfile
import tomllib
import venv
import zipfile
from email.parser import BytesParser
from email.policy import default


ROOT = pathlib.Path(__file__).resolve().parents[1]
PACKAGE_ROOT = ROOT / "python"
VERSION = tomllib.loads((PACKAGE_ROOT / "pyproject.toml").read_text())["project"]["version"]
LICENSE_BYTES = (ROOT / "LICENSE").read_bytes()


with tempfile.TemporaryDirectory(prefix="hardguard25-wheel-") as temp:
    temp_path = pathlib.Path(temp)
    artifacts = temp_path / "artifacts"
    artifacts.mkdir()
    subprocess.run(
        [sys.executable, "-m", "build", "--outdir", str(artifacts), str(PACKAGE_ROOT)],
        check=True,
    )
    wheel = artifacts / f"hardguard25-{VERSION}-py3-none-any.whl"
    sdist = artifacts / f"hardguard25-{VERSION}.tar.gz"
    if not wheel.exists() or not sdist.exists():
        raise SystemExit(f"expected wheel and sdist not found in {artifacts}")

    dist_info = f"hardguard25-{VERSION}.dist-info"
    expected_wheel = {
        "hardguard25/__init__.py",
        "hardguard25/py.typed",
        f"{dist_info}/licenses/LICENSE",
        f"{dist_info}/METADATA",
        f"{dist_info}/WHEEL",
        f"{dist_info}/top_level.txt",
        f"{dist_info}/RECORD",
    }
    with zipfile.ZipFile(wheel) as archive:
        names = set(archive.namelist())
        if names != expected_wheel:
            raise SystemExit(
                f"wheel inventory mismatch: missing={sorted(expected_wheel - names)}, "
                f"unexpected={sorted(names - expected_wheel)}"
            )
        if archive.read(f"{dist_info}/licenses/LICENSE") != LICENSE_BYTES:
            raise SystemExit("wheel license bytes do not match repository LICENSE")
        if archive.read("hardguard25/__init__.py") != (PACKAGE_ROOT / "hardguard25/__init__.py").read_bytes():
            raise SystemExit("wheel runtime bytes do not match package source")
        metadata = BytesParser(policy=default).parsebytes(archive.read(f"{dist_info}/METADATA"))
        if metadata["Version"] != VERSION:
            raise SystemExit(f"wheel metadata version mismatch: {metadata['Version']!r}")
        if metadata["License-Expression"] != "MIT":
            raise SystemExit(f"wheel metadata license mismatch: {metadata['License-Expression']!r}")
        if metadata["Requires-Python"] != ">=3.9":
            raise SystemExit(f"wheel Requires-Python mismatch: {metadata['Requires-Python']!r}")

    prefix = f"hardguard25-{VERSION}"
    expected_sdist = {
        prefix,
        f"{prefix}/LICENSE",
        f"{prefix}/MANIFEST.in",
        f"{prefix}/PKG-INFO",
        f"{prefix}/README.md",
        f"{prefix}/hardguard25",
        f"{prefix}/hardguard25/__init__.py",
        f"{prefix}/hardguard25/py.typed",
        f"{prefix}/hardguard25.egg-info",
        f"{prefix}/hardguard25.egg-info/PKG-INFO",
        f"{prefix}/hardguard25.egg-info/SOURCES.txt",
        f"{prefix}/hardguard25.egg-info/dependency_links.txt",
        f"{prefix}/hardguard25.egg-info/top_level.txt",
        f"{prefix}/pyproject.toml",
        f"{prefix}/setup.cfg",
    }
    with tarfile.open(sdist, "r:gz") as archive:
        names = set(archive.getnames())
        if names != expected_sdist:
            raise SystemExit(
                f"sdist inventory mismatch: missing={sorted(expected_sdist - names)}, "
                f"unexpected={sorted(names - expected_sdist)}"
            )
        license_member = archive.extractfile(f"{prefix}/LICENSE")
        runtime_member = archive.extractfile(f"{prefix}/hardguard25/__init__.py")
        if license_member is None or license_member.read() != LICENSE_BYTES:
            raise SystemExit("sdist license bytes do not match repository LICENSE")
        if runtime_member is None or runtime_member.read() != (PACKAGE_ROOT / "hardguard25/__init__.py").read_bytes():
            raise SystemExit("sdist runtime bytes do not match package source")

    environment = temp_path / "venv"
    venv.EnvBuilder(with_pip=True).create(environment)
    python = environment / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    subprocess.run(
        [str(python), "-m", "pip", "install", "--no-deps", "--no-index", str(wheel)],
        check=True,
    )
    probe = (
        "import importlib.metadata, json, hardguard25; "
        "print(json.dumps({'distribution': importlib.metadata.version('hardguard25'), "
        "'runtime': hardguard25.__version__, 'digit': hardguard25.check_digit('AC3H7PUW'), "
        "'exports': hardguard25.__all__}))"
    )
    result = subprocess.run([str(python), "-c", probe], cwd=temp, check=True, capture_output=True, text=True)
    observed = json.loads(result.stdout)
    expected = {
        "distribution": VERSION,
        "runtime": VERSION,
        "digit": "N",
        "exports": [
            "ALPHABET",
            "ALPHABET_SET",
            "generate",
            "validate",
            "normalize",
            "check_digit",
            "check_digit_func",
            "verify_check_digit",
        ],
    }
    if observed != expected:
        raise SystemExit(f"installed wheel mismatch: {observed!r}")

print("Python sdist, wheel contents, and clean consumer check passed")
