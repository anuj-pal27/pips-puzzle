from django import template

register = template.Library()


@register.filter
def pct(value, digits=0):
    """0.734 -> "73%". Blank stays a dash."""
    if value is None:
        return "–"
    return f"{value * 100:.{int(digits)}f}%"


@register.filter
def pct_width(value):
    """0.734 -> "73.4", for a CSS width."""
    return f"{(value or 0) * 100:.1f}"


@register.filter
def duration(seconds):
    """95 -> "1m 35s"."""
    if seconds is None:
        return "–"
    seconds = int(round(seconds))
    if seconds < 60:
        return f"{seconds}s"
    m, s = divmod(seconds, 60)
    if m < 60:
        return f"{m}m {s:02d}s"
    h, m = divmod(m, 60)
    return f"{h}h {m:02d}m"


@register.filter
def one_decimal(value):
    return "–" if value is None else f"{value:.1f}"


@register.filter
def compact(value):
    """1284 -> "1,284"; 12900 -> "12.9K"."""
    if value is None:
        return "–"
    if value >= 1_000_000:
        return f"{value / 1_000_000:.1f}M"
    if value >= 10_000:
        return f"{value / 1000:.1f}K"
    return f"{value:,}"


@register.filter
def delta(value):
    """0.25 -> "+25%"; None -> ""."""
    if value is None:
        return ""
    return f"{'+' if value >= 0 else '−'}{abs(value) * 100:.0f}%"


@register.filter
def get(mapping, key):
    return mapping.get(key) if mapping else None


@register.filter
def share_of(part, whole):
    """For bar widths: part as a % of whole."""
    return f"{(part / whole * 100) if whole else 0:.1f}"
