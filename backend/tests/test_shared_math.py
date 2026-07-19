import pytest
from app.engine.shared_math import (
    monthly_amortization_payment,
    amortization_schedule,
    future_value,
    present_value_of_series,
    inflation_adjust,
)

def test_monthly_amortization_payment():
    # 30-year fixed, $300,000 at 5% APR
    payment = monthly_amortization_payment(300000, 0.05, 360)
    assert round(payment, 2) == 1610.46
    
    # 5-year auto loan, $25,000 at 3% APR
    payment = monthly_amortization_payment(25000, 0.03, 60)
    assert round(payment, 2) == 449.22
    
    # 0% interest rate
    payment = monthly_amortization_payment(12000, 0.0, 12)
    assert round(payment, 2) == 1000.00

def test_amortization_schedule():
    schedule = amortization_schedule(10000, 0.05, 12)
    assert len(schedule) == 12
    
    # Month 1 check
    assert round(schedule[0]["interest"], 2) == 41.67 # 10000 * (0.05/12)
    assert round(schedule[0]["payment"], 2) == 856.07
    
    # Final month check
    assert schedule[-1]["remaining_balance"] == 0.0

def test_future_value():
    # $10,000 initially, 5% annual return for 10 years, no extra contribution
    fv = future_value(10000, 0.05, 10)
    assert round(fv, 2) == 16470.09 # Compounded monthly: 10000 * (1 + 0.05/12)^(120)
    
    # $0 initially, 5% return, $100 monthly contribution for 10 years
    fv = future_value(0, 0.05, 10, 100)
    assert round(fv, 2) == 15528.23 # $100 * (((1+0.05/12)^120 - 1) / (0.05/12))
    
    # Both initial and monthly contribution
    fv = future_value(10000, 0.05, 10, 100)
    assert round(fv, 2) == 31998.32

def test_present_value_of_series():
    # Cashflows: $100 today, $100 year 1, $100 year 2 at 5% discount rate
    pv = present_value_of_series([100, 100, 100], 0.05)
    # PV = 100 + 100/(1.05) + 100/(1.05^2) = 100 + 95.238 + 90.703 = 285.94
    assert round(pv, 2) == 285.94

def test_inflation_adjust():
    # $100 today, 3% inflation for 10 years
    fv = inflation_adjust(100, 0.03, 10)
    assert round(fv, 2) == 134.39
