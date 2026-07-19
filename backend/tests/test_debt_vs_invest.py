from app.engine.debt_vs_invest import calculate_debt_vs_invest

def test_calculate_debt_vs_invest():
    # Scenario:
    # Debt: $10,000 at 5% APR
    # Monthly available: $500
    # Expected market return: 8%
    # Time horizon: 5 years
    
    result = calculate_debt_vs_invest(
        debt_balance=10000,
        debt_apr=0.05,
        monthly_amount_available=500,
        expected_market_return=0.08,
        time_horizon_years=5
    )
    
    s1 = result["strategy_debt_first"]
    s2 = result["strategy_invest_first"]
    
    # Debt first strategy: Pay $500/mo until 10k is gone.
    # At 5%, it will take about 21 months.
    assert s1["months_to_payoff"] == 21
    
    # After 21 months, we invest $500 for the remaining 39 months
    # Check that final investment value is > 0
    assert s1["final_investment_value"] > 0
    assert s1["final_debt_balance"] == 0
    assert s1["final_net_worth"] == s1["final_investment_value"]
    
    # Invest first strategy: Invest $500/mo for 60 months
    # Debt compounds at 5% for 60 months (10000 * (1.05/12)^60)
    assert s2["final_investment_value"] > 30000 # 500 * 60 + returns
    assert s2["final_debt_balance"] > 10000
    
    # Since market return (8%) > debt APR (5%), investing first should yield higher net worth
    assert s2["final_net_worth"] > s1["final_net_worth"]
    assert "Investing first yields a higher projected net worth" in result["recommendation"]
    
def test_calculate_debt_vs_invest_high_interest():
    result = calculate_debt_vs_invest(
        debt_balance=10000,
        debt_apr=0.25, # 25% credit card
        monthly_amount_available=500,
        expected_market_return=0.08,
        time_horizon_years=5
    )
    
    # Debt APR > Market Return
    assert "Paying off debt first is mathematically optimal" in result["recommendation"]
