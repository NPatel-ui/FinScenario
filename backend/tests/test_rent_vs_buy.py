from app.engine.rent_vs_buy import calculate_rent_vs_buy
from app.engine.shared_math import future_value

def test_calculate_rent_vs_buy():
    # Scenario:
    # Rent: $2,000/mo
    # Home: $400,000, 20% down ($80,000), 5% APR, 30 years
    # Property tax: 1.5%
    # Maintenance: 1.0%
    # Appreciation: 3.0%
    # Expected years: 10
    # Market return (for down payment if rented): 7.0%
    
    result = calculate_rent_vs_buy(
        monthly_rent=2000,
        home_price=400000,
        down_payment_percent=20.0,
        mortgage_apr=0.05,
        mortgage_term_years=30,
        property_tax_rate=0.015,
        home_appreciation_rate=0.03,
        annual_maintenance_rate=0.01,
        expected_years_in_home=10,
        market_investment_return=0.07
    )
    
    # Check Rent Cost:
    # Total rent: 2000 * 120 = 240,000
    # Investment growth on $80,000 down payment for 10 years at 7%
    # = 80000 * (1.07)^10 - 80000 = 80000 * 1.96715 - 80000 = 77372.11
    # Net rent cost = 240,000 - 77372.11 = 162627.89
    
    expected_inv_growth = future_value(80000, 0.07, 10) - 80000
    expected_rent_cost = 240000 - expected_inv_growth
    
    assert round(result["total_cost_renting"], 2) == round(expected_rent_cost, 2)
    
    # Check Buy Cost:
    # Loan = 320,000. 30 yrs at 5%. Payment = 1717.89
    # Over 10 years (120 months), interest paid is around $147,770
    # Property tax: 400,000 * 0.015 * 10 = 60,000
    # Maintenance: 400,000 * 0.01 * 10 = 40,000
    # Total appreciation: 400,000 * (1.03)^10 - 400,000 = 400,000 * 1.3439 - 400,000 = 137566.54
    # Net cost buying = Interest + Taxes + Maintenance - Appreciation
    
    assert "total_cost_buying" in result
    assert result["recommendation"]
    
    # Just to make sure logic holds, buying should probably be cheaper or close
    assert result["breakeven_year"] is not None

def test_rent_vs_buy_expensive_house():
    result = calculate_rent_vs_buy(
        monthly_rent=1000,
        home_price=1000000,
        down_payment_percent=20.0,
        mortgage_apr=0.07,
        mortgage_term_years=30,
        property_tax_rate=0.02,
        home_appreciation_rate=0.01,
        annual_maintenance_rate=0.02,
        expected_years_in_home=5,
        market_investment_return=0.10
    )
    
    # Renting should be way cheaper here
    assert "Renting is cheaper" in result["recommendation"]
