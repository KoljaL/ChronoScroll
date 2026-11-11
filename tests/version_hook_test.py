import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = b"""<title>CronoScroll v2 - Generator</title>
<h1 class="heading">CronoScroll v2</h1>
<div class="status-brand">
  <span id="version">v2</span>
</div>
<p>original</p>
"""


class VersionHookTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.name", "Test")
        self.git("config", "user.email", "test@example.invalid")
        self.git("config", "commit.gpgsign", "false")
        self.git("config", "core.hooksPath", ".githooks")
        (self.repo / "index.html").write_bytes(HTML)
        (self.repo / "other.txt").write_text("original\n")
        self.git("add", "index.html", "other.txt")
        self.git("commit", "-qm", "initial")
        shutil.copytree(ROOT / ".githooks", self.repo / ".githooks")

    def git(self, *args, success=True, extra_env=None):
        env = {key: value for key, value in os.environ.items() if not key.startswith("GIT_")}
        env.update({"GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": os.devnull})
        if extra_env:
            env.update(extra_env)
        result = subprocess.run(
            ["git", *args], cwd=self.repo, stdout=subprocess.PIPE,
            stderr=subprocess.PIPE, env=env,
        )
        if success and result.returncode:
            self.fail(f"git {args}: {result.stderr.decode(errors='replace')}")
        return result

    def content(self, revision):
        return self.git("show", f"{revision}:index.html").stdout

    def test_sequence_and_unstaged_changes(self):
        path = self.repo / "index.html"
        path.write_bytes(HTML.replace(b"original", b"staged"))
        self.git("add", "index.html")
        path.write_bytes(path.read_bytes().replace(b"staged", b"staged and unstaged"))
        self.git("commit", "-qm", "first")
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.1").replace(b"original", b"staged"))
        self.assertEqual(path.read_bytes(), HTML.replace(b"v2", b"v2.1").replace(b"original", b"staged and unstaged"))
        self.git("add", "index.html")
        self.git("commit", "-qm", "second")
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.2").replace(b"original", b"staged and unstaged"))

    def test_retry_after_later_hook_fails(self):
        hook = self.repo / ".githooks" / "prepare-commit-msg"
        hook.write_text("#!/bin/sh\nexit 1\n")
        hook.chmod(0o755)
        (self.repo / "other.txt").write_text("changed\n")
        self.git("add", "other.txt")
        self.assertNotEqual(self.git("commit", "-qm", "failed", success=False).returncode, 0)
        self.assertEqual(self.content("HEAD"), HTML)
        self.assertEqual(self.content(""), HTML.replace(b"v2", b"v2.1"))
        hook.unlink()
        self.git("commit", "-qm", "retry")
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.1"))
        (self.repo / "other.txt").write_text("changed again\n")
        self.git("add", "other.txt")
        self.git("commit", "-qm", "next")
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.2"))

    def test_path_commit_preserves_staged_and_unstaged_index_html(self):
        path = self.repo / "index.html"
        path.write_bytes(HTML.replace(b"original", b"staged"))
        self.git("add", "index.html")
        path.write_bytes(path.read_bytes().replace(b"staged", b"staged and unstaged"))
        (self.repo / "other.txt").write_text("changed\n")
        self.git("commit", "-qm", "path commit", "--", "other.txt")
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.1"))
        self.assertEqual(self.content(""), HTML.replace(b"v2", b"v2.1").replace(b"original", b"staged"))
        self.assertEqual(path.read_bytes(), HTML.replace(b"v2", b"v2.1").replace(b"original", b"staged and unstaged"))
        self.git("commit", "-qm", "remaining staged changes")
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.2").replace(b"original", b"staged"))
        self.assertEqual(path.read_bytes(), HTML.replace(b"v2", b"v2.2").replace(b"original", b"staged and unstaged"))

    def test_selected_index_html_with_unstaged_changes_aborts(self):
        path = self.repo / "index.html"
        path.write_bytes(HTML.replace(b"original", b"staged"))
        self.git("add", "index.html")
        path.write_bytes(path.read_bytes().replace(b"staged", b"staged and unstaged"))
        result = self.git("commit", "-qm", "path commit", "--", "index.html", success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"nicht gestagte", result.stderr)
        self.assertEqual(self.content("HEAD"), HTML)
        self.assertEqual(self.content(""), HTML.replace(b"original", b"staged"))
        self.assertEqual(path.read_bytes(), HTML.replace(b"original", b"staged and unstaged"))

    def test_selected_index_html_reverted_in_worktree_preserves_staging(self):
        path = self.repo / "index.html"
        path.write_bytes(HTML.replace(b"original", b"staged"))
        self.git("add", "index.html")
        path.write_bytes(HTML)
        result = self.git("commit", "-qm", "path commit", "--", "index.html", success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"nicht gestagte", result.stderr)
        self.assertEqual(self.content("HEAD"), HTML)
        self.assertEqual(self.content(""), HTML.replace(b"original", b"staged"))
        self.assertEqual(path.read_bytes(), HTML)

    def test_selected_index_html_with_only_staged_changes(self):
        path = self.repo / "index.html"
        path.write_bytes(HTML.replace(b"original", b"staged"))
        self.git("add", "index.html")
        self.git("commit", "-qm", "path commit", "--", "index.html")
        expected = HTML.replace(b"v2", b"v2.1").replace(b"original", b"staged")
        self.assertEqual(self.content("HEAD"), expected)
        self.assertEqual(self.content(""), expected)
        self.assertEqual(path.read_bytes(), expected)

    def test_auto_staging_index_html_with_unstaged_changes_aborts(self):
        for args in (("-am", "all"), ("-im", "include", "--", "index.html")):
            with self.subTest(args=args):
                path = self.repo / "index.html"
                path.write_bytes(HTML.replace(b"original", b"unstaged"))
                result = self.git("commit", *args, success=False)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn(b"nicht gestagte", result.stderr)
                self.assertEqual(self.content("HEAD"), HTML)
                self.assertEqual(self.content(""), HTML)
                self.assertEqual(path.read_bytes(), HTML.replace(b"original", b"unstaged"))

    def test_auto_staging_other_files_preserves_unstaged_index_html(self):
        (self.repo / "index.html").write_bytes(HTML.replace(b"original", b"unstaged"))
        (self.repo / "other.txt").write_text("changed\n")
        self.git("commit", "-im", "include", "--", "other.txt")
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.1"))
        self.assertEqual((self.repo / "index.html").read_bytes(), HTML.replace(b"v2", b"v2.1").replace(b"original", b"unstaged"))

    def test_retry_path_commit_after_later_hook_fails(self):
        hook = self.repo / ".githooks" / "prepare-commit-msg"
        hook.write_text("#!/bin/sh\nexit 1\n")
        hook.chmod(0o755)
        (self.repo / "other.txt").write_text("changed\n")
        self.assertNotEqual(self.git("commit", "-qm", "failed", "--", "other.txt", success=False).returncode, 0)
        self.assertEqual(self.content("HEAD"), HTML)
        hook.unlink()
        self.git("commit", "-qm", "retry", "--", "other.txt")
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.1"))
        self.assertEqual(self.content(""), self.content("HEAD"))

    def test_path_commit_with_alternate_index_aborts(self):
        alternate = self.repo / "alternate-index"
        shutil.copyfile(self.repo / ".git" / "index", alternate)
        (self.repo / "other.txt").write_text("changed\n")
        result = self.git(
            "commit", "-qm", "path commit", "--", "other.txt",
            success=False, extra_env={"GIT_INDEX_FILE": str(alternate)},
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"GIT_INDEX_FILE", result.stderr)
        self.assertEqual(self.content("HEAD"), HTML)

    def test_edited_worktree_versions_are_not_overwritten(self):
        path = self.repo / "index.html"
        path.write_bytes(HTML.replace(b"v2", b"v8"))
        (self.repo / "other.txt").write_text("changed\n")
        self.git("add", "other.txt")
        result = self.git("commit", "-qm", "commit")
        self.assertIn(b"Arbeitsdatei unver", result.stderr)
        self.assertEqual(path.read_bytes(), HTML.replace(b"v2", b"v8"))
        self.assertEqual(self.content("HEAD"), HTML.replace(b"v2", b"v2.1"))

    def test_mismatched_versions_abort(self):
        path = self.repo / "index.html"
        path.write_bytes(HTML.replace(b"CronoScroll v2</h1>", b"CronoScroll v3</h1>"))
        self.git("add", "index.html")
        result = self.git("commit", "-qm", "invalid", success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"stimmen nicht", result.stderr)
        self.assertEqual(self.content("HEAD"), HTML)
        self.assertEqual(path.read_bytes(), self.content(""))

    def test_missing_version_aborts(self):
        path = self.repo / "index.html"
        path.write_bytes(HTML.replace(b'<span id="version">v2</span>', b'<span id="version">unknown</span>'))
        self.git("add", "index.html")
        result = self.git("commit", "-qm", "invalid", success=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn(b"m\xc3\xbcssen je eine", result.stderr)
        self.assertEqual(self.content("HEAD"), HTML)

    def test_existing_status_without_id(self):
        path = self.repo / "index.html"
        legacy = HTML.replace(b'<span id="version">', b"<span>")
        path.write_bytes(legacy)
        self.git("add", "index.html")
        self.git("commit", "--amend", "--no-verify", "-qm", "legacy initial")
        path.write_bytes(HTML)
        (self.repo / "other.txt").write_text("changed\n")
        self.git("add", "other.txt")
        self.git("commit", "-qm", "legacy status")
        self.assertEqual(self.content("HEAD"), legacy.replace(b"v2", b"v2.1"))
        self.assertEqual(path.read_bytes(), HTML.replace(b"v2", b"v2.1"))
        self.git("add", "index.html")
        self.git("commit", "-qm", "add status id")
        self.assertEqual(self.content("HEAD"), path.read_bytes())
        self.assertIn(b'<span id="version">v2.2</span>', path.read_bytes())


if __name__ == "__main__":
    unittest.main()
