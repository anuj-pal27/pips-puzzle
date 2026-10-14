"""Geometry for the dashboard's charts, drawn as plain SVG in the templates (no chart library)."""

import math
from datetime import date


def nice_max(value: float) -> int:
    """Round the top of the y-axis up to 1, 2 or 5 x 10^n, so the ticks are clean numbers."""
    if value <= 0:
        return 4
    power = 10 ** math.floor(math.log10(value))
    for step in (1, 2, 5, 10):
        if value <= step * power:
            return max(4, int(step * power))
    return int(10 * power)  # pragma: no cover


def line_chart(rows: list[dict], series: list[tuple[str, str]], width=720, height=240, left=44, right=72, top=18, bottom=30) -> dict:
    """A time chart: one line per (key, label) in `series`, over `rows` that each have a `day` and those keys."""
    n = len(rows)
    top_value = nice_max(max((r[k] for r in rows for k, _ in series), default=0))
    plot_w, plot_h = width - left - right, height - top - bottom
    step = plot_w / (n - 1) if n > 1 else 0

    def x(i):
        return round(left + (i * step if n > 1 else plot_w / 2), 1)

    def y(v):
        return round(top + plot_h - (v / top_value) * plot_h, 1)

    lines = []
    for slot, (key, label) in enumerate(series, start=1):
        pts = [(x(i), y(r[key])) for i, r in enumerate(rows)]
        lines.append(
            {
                "key": key,
                "label": label,
                "slot": slot,
                "points": " ".join(f"{a},{b}" for a, b in pts),
                "area": f"{x(0)},{y(0)} " + " ".join(f"{a},{b}" for a, b in pts) + f" {x(n - 1)},{y(0)}" if pts else "",
                "end": pts[-1] if pts else None,
                "last": rows[-1][key] if rows else 0,
            }
        )
    # Keep the two end labels from sitting on top of each other.
    if len(lines) == 2 and lines[0]["end"] and abs(lines[0]["end"][1] - lines[1]["end"][1]) < 14:
        hi, lo = sorted(lines, key=lambda line: line["end"][1])
        hi["label_y"], lo["label_y"] = hi["end"][1] - 7, lo["end"][1] + 7
    for line in lines:
        line.setdefault("label_y", line["end"][1] if line["end"] else 0)

    ticks = [{"value": v, "y": y(v)} for v in (0, top_value // 2, top_value)]
    every = max(1, math.ceil(n / 6))
    x_ticks = [{"x": x(i), "label": _short(r["day"])} for i, r in enumerate(rows) if i % every == 0 or i == n - 1]
    if len(x_ticks) > 1 and x_ticks[-1]["x"] - x_ticks[-2]["x"] < 50:
        x_ticks.pop(-2)
    band = step if n > 1 else plot_w
    columns = [
        {"x": x(i), "hit_x": round(x(i) - band / 2, 1), "values": {k: r[k] for k, _ in series}, "label": f"{r['day']:%a} {r['day'].day} {r['day']:%b}"}
        for i, r in enumerate(rows)
    ]
    return {
        "width": width,
        "height": height,
        "left": left,
        "right_edge": width - right,
        "top": top,
        "bottom_y": top + plot_h,
        "plot_h": plot_h,
        "band": round(band, 1),
        "lines": lines,
        "ticks": ticks,
        "x_ticks": x_ticks,
        "columns": columns,
        "empty": not any(r[k] for r in rows for k, _ in series),
    }


def _short(d: date) -> str:
    return f"{d.day} {d:%b}"  # not %-d: that one doesn't work on Windows
