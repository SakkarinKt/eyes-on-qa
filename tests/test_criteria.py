import json
from pathlib import Path

import pytest
from pydantic import ValidationError

from eyesonqa.verifier.criteria import Goal, load_goal

REPO = Path(__file__).resolve().parents[1]


def test_bundled_criteria_files_validate():
    files = sorted((REPO / "bench" / "criteria").glob("*.json"))
    assert files, "no criteria files found"
    for f in files:
        goal = load_goal(f)
        assert goal.criteria


def test_step_requires_its_fields():
    bad = {
        "goal_id": "x",
        "criteria": [
            {
                "id": "C1",
                "description": "needs a path",
                "steps": [{"action": "goto"}],
                "expected_visible_outcome": "something visible",
                "sam_concept": "button",
            }
        ],
    }
    with pytest.raises(ValidationError, match="needs"):
        Goal.model_validate(bad)


def test_criterion_ids_must_be_unique():
    crit = {
        "id": "C1",
        "description": "dup",
        "steps": [{"action": "wait", "ms": 10}],
        "expected_visible_outcome": "nothing much",
        "sam_concept": "button",
    }
    with pytest.raises(ValidationError, match="unique"):
        Goal.model_validate({"goal_id": "x", "criteria": [crit, dict(crit)]})


def test_text_assertion_needs_expectation():
    bad = {
        "goal_id": "x",
        "criteria": [
            {
                "id": "C1",
                "description": "assert",
                "steps": [{"action": "wait", "ms": 10}],
                "expected_visible_outcome": "nothing much",
                "sam_concept": "button",
                "dom_assertions": [{"type": "text", "testid": "x"}],
            }
        ],
    }
    with pytest.raises(ValidationError, match="equals or contains"):
        Goal.model_validate(bad)


def test_round_trip_json(tmp_path):
    goal = load_goal(REPO / "bench" / "criteria" / "add-task-flow.json")
    p = tmp_path / "g.json"
    p.write_text(json.dumps(goal.model_dump()), encoding="utf-8")
    assert load_goal(p) == goal
