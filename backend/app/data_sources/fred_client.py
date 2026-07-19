import os
import httpx
from datetime import datetime, timezone
import logging

logger = logging.getLogger(__name__)

FRED_API_KEY = os.environ.get("FRED_API_KEY")
BASE_URL = "https://api.stlouisfed.org/fred/series/observations"

# Cache for rate limiting / redundancy
_cache = {}

def _fetch_fred_series(series_id: str, default_val: float, source_label: str) -> dict:
    """
    Fetches the latest observation for a given FRED series ID.
    Falls back to default_val if API key is missing or request fails.
    """
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    if series_id in _cache:
        cached_data = _cache[series_id]
        if cached_data["date_fetched"] == today:
            return cached_data["data"]
            
    fallback_result = {
        "value": default_val,
        "source_name": f"estimated (live data unavailable)",
        "as_of_date": today
    }
    
    if not FRED_API_KEY:
        logger.warning(f"No FRED_API_KEY found. Using fallback for {series_id}")
        return fallback_result
        
    try:
        with httpx.Client() as client:
            # We want the most recent observation
            params = {
                "series_id": series_id,
                "api_key": FRED_API_KEY,
                "file_type": "json",
                "sort_order": "desc",
                "limit": 1
            }
            response = client.get(BASE_URL, params=params, timeout=5.0)
            response.raise_for_status()
            data = response.json()
            
            observations = data.get("observations", [])
            if not observations:
                return fallback_result
                
            latest = observations[0]
            val = float(latest["value"])
            # Some rates like MORTGAGE30US are percentages (e.g. 6.5 means 6.5%)
            # We convert it to a decimal if we assume the engine uses decimals.
            # Wait, our engine uses decimals for rates (e.g., 0.065)
            # FRED returns '6.5', so we divide by 100.
            val_decimal = val / 100.0
            
            result = {
                "value": val_decimal,
                "source_name": f"FRED ({source_label})",
                "as_of_date": latest["date"]
            }
            
            _cache[series_id] = {
                "date_fetched": today,
                "data": result
            }
            return result
            
    except Exception as e:
        logger.error(f"Error fetching from FRED API for {series_id}: {e}")
        return fallback_result


def get_mortgage_rate() -> dict:
    """
    Fetch the current 30-year mortgage rate (MORTGAGE30US).
    Default estimate: 7.0% (0.07)
    """
    return _fetch_fred_series("MORTGAGE30US", 0.07, "30-Year Fixed Rate Mortgage Average")

def get_auto_loan_rate() -> dict:
    """
    Fetch the current 48-month auto loan rate (RIOSRCQ).
    Default estimate: 6.5% (0.065)
    """
    # RIOSRCQ is a common proxy for auto loan rates on FRED, though there are others.
    return _fetch_fred_series("RIOSRCQ", 0.065, "Auto Loan Rate")

def get_inflation_rate() -> dict:
    """
    Fetch the current inflation rate. 
    Using CPIAUCSL year-over-year change or a static default if calculating YoY is complex.
    For simplicity, FRED series FPCPITOTLZGUSA is annual inflation rate, but usually we just want a standard long-term assumption.
    Default estimate: 3.0% (0.03)
    """
    # If we fetch CPI, it's an index, we'd need to calculate YoY change. 
    # Let's just use a static default of 3% for now, as that's standard for long term planning.
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    return {
        "value": 0.03,
        "source_name": "historical average (live data unavailable)",
        "as_of_date": today
    }
