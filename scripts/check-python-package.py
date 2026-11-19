from __future__ import annotations

import json
import os
import pathlib
import subprocess
import sys
import tarfile
import tempfile
import venv
import zipfile
from email.parser import BytesParser
from email.policy import default


ROOT = pathlib.Path(__file__).resolve().parents[1]
PACKAGE_ROOT = ROOT / "python"
if sys.version_info < (3, 10):
    raise SystemExit("Source builds require Python 3.10+; installed wheels support Python 3.9+.")
VERSION = json.loads((ROOT / "js" / "package.json").read_text())["version"]
LICENSE_BYTES = (ROOT / "LICENSE").read_bytes()


with tempfile.TemporaryDirectory(prefix="hardguard25-wheel-") as temp:
    temp_path = pathlib.Path(temp)
    artifacts = pathlib.Path(os.environ.get("HG25_RELEASE_ARTIFACTS", str(temp_path / "artifacts"))).resolve()
    artifacts.mkdir(parents=True, exist_ok=True)
    source_files = {name: (PACKAGE_ROOT / name).read_bytes() for name in ["hardguard25/__init__.py", "hardguard25/py.typed", "README.md", "pyproject.toml", "MANIFEST.in"]}
    build_environment = temp_path / "build-venv"
    venv.EnvBuilder(with_pip=True, symlinks=sys.platform != "win32").create(build_environment)
    build_python = build_environment / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    requirements = ROOT / "scripts" / ("python-build-minimum-requirements.txt" if "--minimum-backend" in sys.argv else "python-build-requirements.txt")
    subprocess.run([str(build_python), "-m", "pip", "--isolated", "install", "--require-hashes", "--only-binary=:all:", "-r", str(requirements)], check=True)
    subprocess.run(
        [str(build_python), "-m", "build", "--no-isolation", "--outdir", str(artifacts), str(PACKAGE_ROOT)],
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
        if archive.read("hardguard25/__init__.py") != source_files["hardguard25/__init__.py"]:
            raise SystemExit("wheel runtime bytes do not match package source")
        if archive.read("hardguard25/py.typed") != source_files["hardguard25/py.typed"]:
            raise SystemExit("wheel typing marker differs from source")
        metadata = BytesParser(policy=default).parsebytes(archive.read(f"{dist_info}/METADATA"))
        if metadata.get_all("Requires-Dist", []):
            raise SystemExit("wheel runtime must remain dependency-free")
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
        for name, expected_bytes in source_files.items():
            member = archive.getmember(f"{prefix}/{name}")
            if not member.isfile() or archive.extractfile(member).read() != expected_bytes:
                raise SystemExit(f"sdist payload differs from source: {name}")
        license_member = archive.extractfile(f"{prefix}/LICENSE")
        if license_member is None or license_member.read() != LICENSE_BYTES:
            raise SystemExit("sdist license bytes do not match repository LICENSE")

    environment = temp_path / "venv"
    venv.EnvBuilder(with_pip=True, symlinks=sys.platform != "win32").create(environment)
    python = environment / ("Scripts/python.exe" if sys.platform == "win32" else "bin/python")
    subprocess.run(
        [str(python), "-m", "pip", "install", "--no-deps", "--no-index", str(wheel)],
        check=True,
    )
    conformance_probe = """
import json, sys, hardguard25 as api
vectors = json.load(open(sys.argv[1], encoding="utf-8"))
for case in vectors["normalize"] + vectors["separators"]:
    assert api.normalize(case["input"]) == case["output"]
for value in vectors["normalize_rejection"] + vectors["non_ascii_rejection"]:
    assert not api.validate(value)
    try:
        api.normalize(value)
    except (ValueError, TypeError):
        pass
    else:
        raise AssertionError("installed normalize accepted invalid input")
for case in vectors["validate"]:
    assert api.validate(case["input"]) == case["valid"]
for case in vectors["check_digit"]:
    assert api.check_digit(case["code"]) == case["digit"]
for case in vectors["verify"]:
    assert api.verify_check_digit(case["input"]) == case["valid"]
for case in vectors.get("checksum_repeated", []):
    n = case["count"]
    expected = api.ALPHABET[(api.ALPHABET.index(case["character"]) * n * (n+1) // 2) % 25]
    assert expected == case["digit"]
    assert api.check_digit(case["character"] * n) == expected
"""
    subprocess.run([str(python), "-c", conformance_probe, str(ROOT / "conformance/vectors.json")], cwd=temp, check=True)
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
