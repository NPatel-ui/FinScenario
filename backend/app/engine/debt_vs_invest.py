from .shared_math import future_value, amortization_schedule

def calculate_debt_vs_invest(
    debt_balance: float,
    debt_apr: float,
    monthly_amount_available: float,
    expected_market_return: float,
    time_horizon_years: int
) -> dict:
    months = time_horizon_years * 12
    monthly_debt_rate = debt_apr / 12.0
    
    # Strategy 1: Debt First
    # Pay `monthly_amount_available` towards debt until it's 0.
    # Then invest the rest of the time.
    s1_balance = debt_balance
    s1_interest_paid = 0.0
    s1_months_to_payoff = 0
    
    for month in range(1, months + 1):
        if s1_balance > 0:
            interest = s1_balance * monthly_debt_rate
            s1_interest_paid += interest
            payment = min(monthly_amount_available, s1_balance + interest)
            s1_balance = s1_balance + interest - payment
            s1_months_to_payoff += 1
            if s1_balance <= 0.001:
                s1_balance = 0.0
                break
                
    # Invest the remaining months
    s1_invest_months = months - s1_months_to_payoff
    s1_investment_value = 0.0
    if s1_invest_months > 0:
        s1_investment_value = future_value(0, expected_market_return, s1_invest_months / 12.0, monthly_amount_available)
        
    s1_net_worth = s1_investment_value - s1_balance
    
    # Strategy 2: Invest First
    # Assuming no minimum payments are made to the debt (it just accrues interest).
    # If there is a minimum payment, it's not specified in inputs, so we assume they invest the full amount.
    s2_investment_value = future_value(0, expected_market_return, time_horizon_years, monthly_amount_available)
    s2_debt_balance = debt_balance * ((1 + monthly_debt_rate) ** months)
    s2_net_worth = s2_investment_value - s2_debt_balance
    s2_interest_paid = s2_debt_balance - debt_balance
    
    # Recommendation
    if debt_apr > expected_market_return:
        recommendation = "Paying off debt first is mathematically optimal because the debt interest rate is higher than your expected market return."
    else:
        recommendation = (
            "Investing first yields a higher projected net worth because the expected market return is higher than the debt interest rate. "
            "However, debt payoff is a guaranteed return, while market returns carry risk."
        )
        
    return {
        "strategy_debt_first": {
            "total_interest_paid": s1_interest_paid,
            "final_investment_value": s1_investment_value,
            "final_debt_balance": s1_balance,
            "final_net_worth": s1_net_worth,
            "months_to_payoff": s1_months_to_payoff
        },
        "strategy_invest_first": {
            "total_interest_paid": s2_interest_paid,
            "final_investment_value": s2_investment_value,
            "final_debt_balance": s2_debt_balance,
            "final_net_worth": s2_net_worth
        },
        "recommendation": recommendation
    }
