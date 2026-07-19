from datetime import datetime, timezone

def get_market_return_estimate() -> dict:
    """
    Fetch or hardcode historical average annual return for a broad market index.
    e.g., S&P 500 long-run average is ~10% nominally, or ~7% adjusted for inflation.
    We'll return a nominal 10% (0.10).
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return {
        "value": 0.10,
        "source_name": "S&P 500 historical average (estimated)",
        "as_of_date": today
    }
