import logging
from app.engine.rent_vs_buy import calculate_rent_vs_buy
from app.engine.lease_vs_buy_car import calculate_lease_vs_buy_car
from app.engine.debt_vs_invest import calculate_debt_vs_invest
from app.data_sources.fred_client import get_mortgage_rate, get_auto_loan_rate, get_inflation_rate
from app.data_sources.market_data import get_market_return_estimate

logger = logging.getLogger(__name__)

# We export these functions as tools for the Gemini Agent.
# The Gemini SDK uses the type hints and docstrings to build the tool schemas.

def tool_calculate_rent_vs_buy(
    monthly_rent: float,
    home_price: float,
    down_payment_percent: float,
    mortgage_apr: float,
    mortgage_term_years: int,
    property_tax_rate: float,
    home_appreciation_rate: float,
    annual_maintenance_rate: float,
    expected_years_in_home: int,
    market_investment_return: float
) -> dict:
    """
    Calculates the financial comparison between renting and buying a home over a specified period.
    Rates should be provided as decimals (e.g., 0.05 for 5%), except down_payment_percent which is a percentage (e.g., 20.0).
    """
    logger.info(
        "[TOOL CALL] tool_calculate_rent_vs_buy — inputs: "
        "monthly_rent=%.2f, home_price=%.2f, down_payment_percent=%.2f, "
        "mortgage_apr=%.4f, mortgage_term_years=%d, property_tax_rate=%.4f, "
        "home_appreciation_rate=%.4f, annual_maintenance_rate=%.4f, "
        "expected_years_in_home=%d, market_investment_return=%.4f",
        monthly_rent, home_price, down_payment_percent,
        mortgage_apr, mortgage_term_years, property_tax_rate,
        home_appreciation_rate, annual_maintenance_rate,
        expected_years_in_home, market_investment_return
    )
    result = calculate_rent_vs_buy(
        monthly_rent, home_price, down_payment_percent, mortgage_apr,
        mortgage_term_years, property_tax_rate, home_appreciation_rate,
        annual_maintenance_rate, expected_years_in_home, market_investment_return
    )
    logger.info("[TOOL RESULT] tool_calculate_rent_vs_buy — output: %s", result)
    return result

def tool_calculate_lease_vs_buy_car(
    vehicle_price: float,
    lease_monthly_payment: float,
    lease_term_months: int,
    buy_down_payment: float,
    loan_apr: float,
    loan_term_months: int,
    expected_ownership_years: float,
    estimated_resale_value_percent: float,
) -> dict:
    """
    Calculates the financial comparison between leasing and buying a car.
    loan_apr should be a decimal (e.g., 0.05 for 5%).
    estimated_resale_value_percent is a percentage (e.g., 60.0 for 60%).
    """
    logger.info(
        "[TOOL CALL] tool_calculate_lease_vs_buy_car — inputs: "
        "vehicle_price=%.2f, lease_monthly_payment=%.2f, lease_term_months=%d, "
        "buy_down_payment=%.2f, loan_apr=%.4f, loan_term_months=%d, "
        "expected_ownership_years=%.1f, estimated_resale_value_percent=%.1f",
        vehicle_price, lease_monthly_payment, lease_term_months,
        buy_down_payment, loan_apr, loan_term_months,
        expected_ownership_years, estimated_resale_value_percent
    )
    result = calculate_lease_vs_buy_car(
        vehicle_price, lease_monthly_payment, lease_term_months, buy_down_payment,
        loan_apr, loan_term_months, expected_ownership_years, estimated_resale_value_percent
    )
    logger.info("[TOOL RESULT] tool_calculate_lease_vs_buy_car — output: %s", result)
    return result

def tool_calculate_debt_vs_invest(
    debt_balance: float,
    debt_apr: float,
    monthly_amount_available: float,
    expected_market_return: float,
    time_horizon_years: int
) -> dict:
    """
    Calculates the financial comparison between paying off debt aggressively versus investing.
    debt_apr and expected_market_return should be decimals (e.g., 0.05 for 5%).
    """
    logger.info(
        "[TOOL CALL] tool_calculate_debt_vs_invest — inputs: "
        "debt_balance=%.2f, debt_apr=%.4f, monthly_amount_available=%.2f, "
        "expected_market_return=%.4f, time_horizon_years=%d",
        debt_balance, debt_apr, monthly_amount_available,
        expected_market_return, time_horizon_years
    )
    result = calculate_debt_vs_invest(
        debt_balance, debt_apr, monthly_amount_available, expected_market_return, time_horizon_years
    )
    logger.info("[TOOL RESULT] tool_calculate_debt_vs_invest — output: %s", result)
    return result

# The data source fetchers are async functions, but the standard Gemini tool execution might prefer sync 
# or we can await them manually in the orchestrator if we handle tool calls manually.
# For simplicity with the new google-genai SDK, we can just define them as async functions and if we use
# async generate_content, it can call async tools.

def tool_get_mortgage_rate() -> dict:
    """Fetches the current 30-year mortgage rate (as a decimal) from live market data."""
    return get_mortgage_rate()

def tool_get_auto_loan_rate() -> dict:
    """Fetches the current 48-month auto loan rate (as a decimal) from live market data."""
    return get_auto_loan_rate()

def tool_get_inflation_rate() -> dict:
    """Fetches the current estimated inflation rate (as a decimal) from live market data."""
    return get_inflation_rate()

def tool_get_market_return_estimate() -> dict:
    """Fetches the historical average market return estimate (as a decimal) for a broad index like the S&P 500."""
    return get_market_return_estimate()

def tool_request_missing_input(field_name: str, question_text: str) -> dict:
    """
    Use this tool when you need more information from the user to perform a calculation.
    DO NOT guess user inputs. Ask them explicitly.
    Returns a status indicating the question was logged to be asked.
    """
    return {"status": "User must be prompted", "field": field_name, "question": question_text}

AGENT_TOOLS = [
    tool_calculate_rent_vs_buy,
    tool_calculate_lease_vs_buy_car,
    tool_calculate_debt_vs_invest,
    tool_get_mortgage_rate,
    tool_get_auto_loan_rate,
    tool_get_inflation_rate,
    tool_get_market_return_estimate,
    tool_request_missing_input
]
