from app.engine.lease_vs_buy_car import calculate_lease_vs_buy_car

def test_calculate_lease_vs_buy_car():
    # Scenario: 
    # Car is $30,000
    # Lease is $400/mo for 36 months ($14,400 total over 3 years)
    # Buy: $5,000 down, $25,000 loan at 5% for 60 months
    # Ownership expected: 3 years
    # Resale value after 3 years: 60% ($18,000)
    
    result = calculate_lease_vs_buy_car(
        vehicle_price=30000,
        lease_monthly_payment=400,
        lease_term_months=36,
        buy_down_payment=5000,
        loan_apr=0.05,
        loan_term_months=60,
        expected_ownership_years=3,
        estimated_resale_value_percent=60
    )
    
    assert round(result["total_cost_leasing"], 2) == 14400.00
    
    # Buy calc check:
    # 60 month loan at 5% on 25000 -> payment is ~471.78
    # After 36 months, remaining balance is ~10,873.34
    # Payments made: 36 * 471.78 = 16,984.08
    # Total cost buying = 5000 + 16984.08 + 10753.73 - 18000 = 14737.83
    
    assert round(result["total_cost_buying"], 2) == 14737.83
    
    assert result["recommendation"].startswith("Leasing is cheaper")
    
    # Try an expected ownership of 6 years (car is kept post-loan)
    result_long = calculate_lease_vs_buy_car(
        vehicle_price=30000,
        lease_monthly_payment=400,
        lease_term_months=36,
        buy_down_payment=5000,
        loan_apr=0.05,
        loan_term_months=60,
        expected_ownership_years=6,
        estimated_resale_value_percent=30 # 30% of 30k = 9k
    )
    
    assert round(result_long["total_cost_leasing"], 2) == 28800.00 # 400 * 72
    # Buy cost: 5000 + (60 * 471.78) - 9000 = 5000 + 28306.80 - 9000 = 24306.80
    assert round(result_long["total_cost_buying"], 2) == 24306.85
    assert result_long["recommendation"].startswith("Buying is cheaper")
    # Breakeven point should exist
    assert result_long["breakeven_month"] is not None
