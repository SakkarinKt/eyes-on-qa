from eyesonqa import __version__
from eyesonqa.cli import main


def test_version_is_set():
    assert __version__


def test_selfcheck_runs(capsys):
    rc = main(["selfcheck"])
    out = capsys.readouterr().out
    assert "EYESONQA selfcheck:" in out
    assert rc in (0, 1)
