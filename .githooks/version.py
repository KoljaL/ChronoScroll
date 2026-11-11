#!/usr/bin/env python3
import os
import re
import subprocess
import sys
from pathlib import Path


VERSION = rb"v[0-9]+(?:\.[0-9]+)?"
MARKERS = (
    re.compile(rb"(<title>\s*CronoScroll\s+)(" + VERSION + rb")(?=\s|<)"),
    re.compile(rb"(<h1\b[^>]*>\s*CronoScroll\s+)(" + VERSION + rb")(?=\s|<)"),
    re.compile(
        rb'(<div class="status-brand">\s*<span(?:\s+id="version")?>\s*)'
        rb"(" + VERSION + rb")(?=\s*<)"
    ),
)


def git(*args, input=None, check=True, env=None):
    return subprocess.run(
        ["git", *args], input=input, stdout=subprocess.PIPE,
        stderr=subprocess.PIPE, check=check, env=env,
    )


def version(content, source):
    matches = [list(pattern.finditer(content)) for pattern in MARKERS]
    if any(len(found) != 1 for found in matches):
        raise ValueError(f"{source}: Titel, Überschrift und Statusleiste müssen je eine gültige Version enthalten")
    values = [found[0].group(2) for found in matches]
    if len(set(values)) != 1:
        raise ValueError(f"{source}: Versionsangaben stimmen nicht überein")
    return values[0]


def next_version(current):
    parts = current[1:].split(b".")
    return b"v" + parts[0] + b"." + str(int(parts[1]) + 1 if len(parts) == 2 else 1).encode("ascii")


def replace_version(content, new):
    for pattern in MARKERS:
        content = pattern.sub(lambda match: match.group(1) + new, content)
    return content


def pre_commit():
    root = Path(os.fsdecode(git("rev-parse", "--show-toplevel").stdout.rstrip(b"\n")))
    os.chdir(root)
    entry = git("ls-files", "--stage", "--", "index.html").stdout.splitlines()
    if len(entry) != 1:
        raise ValueError("index.html muss genau einmal und ohne Konflikt im Commit-Index vorhanden sein")
    metadata, path = entry[0].split(b"\t", 1)
    mode, _, stage = metadata.split()
    if path != b"index.html" or stage != b"0" or mode not in (b"100644", b"100755"):
        raise ValueError("index.html muss eine reguläre Datei ohne Konflikt im Commit-Index sein")

    staged = git("show", ":index.html").stdout
    current = version(staged, "Commit-Index")
    head_exists = git("rev-parse", "--verify", "--quiet", "HEAD", check=False)
    if head_exists.returncode not in (0, 1):
        raise subprocess.CalledProcessError(head_exists.returncode, head_exists.args, stderr=head_exists.stderr)
    if head_exists.returncode == 0:
        head = git("show", "HEAD:index.html").stdout
        previous = version(head, "HEAD")
        index_file = os.environ.get("GIT_INDEX_FILE", "")
        if Path(index_file).name.startswith("next-index-"):
            normal_env = os.environ.copy()
            normal_env.pop("GIT_INDEX_FILE", None)
            normal_path = Path(os.fsdecode(git("rev-parse", "--git-path", "index", env=normal_env).stdout.rstrip(b"\n")))
            lock_path = Path(str(normal_path) + ".lock")
            if not lock_path.is_file():
                raise ValueError("Pfad-Commits mit abweichendem GIT_INDEX_FILE werden nicht unterstützt")
            lock_env = normal_env.copy()
            lock_env["GIT_INDEX_FILE"] = str(lock_path)
            normal_index = git("show", ":index.html", env=normal_env).stdout
            lock_index = git("show", ":index.html", env=lock_env).stdout
            if lock_index != normal_index:
                raise ValueError(
                    "index.html enthält nicht gestagte Änderungen und wurde für einen Pfad-Commit "
                    "ausgewählt; bitte zuerst gewünschte Änderungen stagen"
                )
        elif index_file.endswith(".lock"):
            original_env = os.environ.copy()
            original_env["GIT_INDEX_FILE"] = index_file[:-5]
            original_index = git("show", ":index.html", env=original_env).stdout
            if staged != original_index:
                raise ValueError(
                    "index.html enthält nicht gestagte Änderungen, die Git automatisch übernehmen würde; "
                    "bitte zuerst gewünschte Änderungen stagen"
                )
        if current == next_version(previous):
            return
        if current != previous:
            raise ValueError("Commit-Index: Version muss der HEAD-Version oder deren nächstem Versionsschritt entsprechen")

    new = next_version(current)
    updated = replace_version(staged, new)
    worktree_path = root / "index.html"
    worktree_update = None
    if worktree_path.is_file() and not worktree_path.is_symlink():
        worktree = worktree_path.read_bytes()
        try:
            worktree_version = version(worktree, "Arbeitsdatei")
        except ValueError:
            worktree_version = None
        if worktree_version == current:
            worktree_update = replace_version(worktree, new)
    blob = git("hash-object", "-w", "--stdin", input=updated).stdout.strip()
    git("update-index", "--cacheinfo", os.fsdecode(mode), os.fsdecode(blob), "index.html")
    if worktree_update is not None:
        worktree_path.write_bytes(worktree_update)
    else:
        print("Versions-Hook: Arbeitsdatei unverändert; Versionsangaben dort gegebenenfalls manuell abgleichen.", file=sys.stderr)
    print(f"Versions-Hook: {current.decode()} → {new.decode()}", file=sys.stderr)


def post_commit():
    parent = git("rev-parse", "--verify", "--quiet", "HEAD^", check=False)
    if parent.returncode == 1:
        return
    if parent.returncode != 0:
        raise subprocess.CalledProcessError(parent.returncode, parent.args, stderr=parent.stderr)
    committed = version(git("show", "HEAD:index.html").stdout, "HEAD")
    previous = version(git("show", "HEAD^:index.html").stdout, "HEAD^")
    if committed != next_version(previous):
        return
    entry = git("ls-files", "--stage", "--", "index.html").stdout.splitlines()
    if len(entry) != 1:
        raise ValueError("Versionsabgleich: index.html fehlt oder hat einen Konflikt im Index")
    metadata, _ = entry[0].split(b"\t", 1)
    mode, _, stage = metadata.split()
    if stage != b"0" or mode not in (b"100644", b"100755"):
        raise ValueError("Versionsabgleich: index.html ist keine reguläre konfliktfreie Datei")
    staged = git("show", ":index.html").stdout
    staged_version = version(staged, "Index")
    if staged_version == committed:
        return
    if staged_version != previous:
        raise ValueError("Versionsabgleich: abweichende gestagte Version bleibt unverändert")
    blob = git("hash-object", "-w", "--stdin", input=replace_version(staged, committed)).stdout.strip()
    git("update-index", "--cacheinfo", os.fsdecode(mode), os.fsdecode(blob), "index.html")


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2 or sys.argv[1] not in ("pre", "post"):
            raise ValueError("Aufruf: version.py pre|post")
        if sys.argv[1] == "pre":
            pre_commit()
        else:
            post_commit()
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        if isinstance(error, subprocess.CalledProcessError) and error.stderr:
            detail = error.stderr.decode(errors="replace").strip()
        else:
            detail = str(error)
        print(f"Versions-Hook: {detail}", file=sys.stderr)
        sys.exit(1)
