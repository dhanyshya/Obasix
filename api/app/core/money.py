"""Rupee formatting, as Intl.NumberFormat("en-IN", {style: "currency", currency: "INR", maximumFractionDigits: 0})."""

import math


def format_inr(amount: float) -> str:
    rounded = math.floor(abs(amount) + 0.5)  # Intl rounds halves away from zero
    digits = str(rounded)
    # Indian grouping: the last three digits, then groups of two (1,00,000).
    if len(digits) > 3:
        head, tail = digits[:-3], digits[-3:]
        groups = []
        while len(head) > 2:
            groups.insert(0, head[-2:])
            head = head[:-2]
        if head:
            groups.insert(0, head)
        digits = ",".join([*groups, tail])
    return f"{'-' if amount < 0 and rounded else ''}₹{digits}"
