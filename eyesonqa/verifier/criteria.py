"""Acceptance-criteria schema: the contract between planner, recorder, DOM baseline, and video judge.

A goal has criteria; a criterion has deterministic Playwright steps, an expected visible outcome (for the
video judge), a SAM concept (what to mask on failure) and optional DOM assertions (the tests-plus-DOM
baseline).
The model never drives the browser; it only writes these files.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator

StepAction = Literal["goto", "click", "fill", "press", "select", "wait", "scroll", "check", "uncheck"]
AssertionType = Literal["visible", "hidden", "text", "url", "count", "checked"]


class Step(BaseModel):
    action: StepAction
    path: str | None = None  # goto
    testid: str | None = None  # click, fill, select, scroll, check, uncheck, press (optional focus)
    text: str | None = None  # fill
    key: str | None = None  # press
    value: str | None = None  # select
    ms: int | None = Field(default=None, ge=0, le=15_000)  # wait

    @model_validator(mode="after")
    def _required_fields(self) -> Step:
        need = {
            "goto": ["path"],
            "click": ["testid"],
            "fill": ["testid", "text"],
            "press": ["key"],
            "select": ["testid", "value"],
            "wait": ["ms"],
            "scroll": ["testid"],
            "check": ["testid"],
            "uncheck": ["testid"],
        }[self.action]
        missing = [f for f in need if getattr(self, f) is None]
        if missing:
            raise ValueError(f"step '{self.action}' needs {missing}")
        return self


class Viewport(BaseModel):
    width: int = Field(default=1280, ge=320, le=3840)
    height: int = Field(default=800, ge=320, le=2160)


class DomAssertion(BaseModel):
    type: AssertionType
    testid: str | None = None
    equals: str | None = None
    contains: str | None = None
    count: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def _shape(self) -> DomAssertion:
        if self.type in {"visible", "hidden", "checked", "count", "text"} and not self.testid:
            raise ValueError(f"assertion '{self.type}' needs a testid")
        if self.type == "text" and self.equals is None and self.contains is None:
            raise ValueError("assertion 'text' needs equals or contains")
        if self.type == "url" and self.equals is None and self.contains is None:
            raise ValueError("assertion 'url' needs equals or contains")
        if self.type == "count" and self.count is None:
            raise ValueError("assertion 'count' needs count")
        return self


class Criterion(BaseModel):
    id: str = Field(pattern=r"^[A-Za-z0-9_-]{1,32}$")
    description: str = Field(min_length=3, max_length=300)
    viewport: Viewport = Field(default_factory=Viewport)
    steps: list[Step] = Field(min_length=1, max_length=40)
    expected_visible_outcome: str = Field(min_length=3, max_length=600)
    sam_concept: str = Field(min_length=2, max_length=60)
    dom_assertions: list[DomAssertion] = Field(default_factory=list)


class Goal(BaseModel):
    goal_id: str = Field(pattern=r"^[A-Za-z0-9_-]{1,48}$")
    app: str = "target-app"
    title: str = ""
    criteria: list[Criterion] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def _unique_ids(self) -> Goal:
        ids = [c.id for c in self.criteria]
        if len(ids) != len(set(ids)):
            raise ValueError("criterion ids must be unique")
        return self


def load_goal(path: str | Path) -> Goal:
    return Goal.model_validate(json.loads(Path(path).read_text(encoding="utf-8")))
