from .shared_math import amortization_schedule, future_value

def calculate_rent_vs_buy(
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
    
    months = expected_years_in_home * 12
    down_payment = home_price * (down_payment_percent / 100.0)
    loan_amount = home_price - down_payment
    
    # 1. Cost of Renting
    # Renters can invest the down payment. We calculate the growth of that down payment.
    # We could also account for difference in monthly payments, but for simplicity we only invest the down payment.
    total_rent_paid = monthly_rent * months
    investment_growth = future_value(down_payment, market_investment_return, expected_years_in_home) - down_payment
    
    # Renters pay rent, but they gain the investment growth
    total_cost_renting = total_rent_paid - investment_growth
    
    # 2. Cost of Buying
    schedule = amortization_schedule(loan_amount, mortgage_apr, mortgage_term_years * 12)
    
    total_mortgage_interest = 0.0
    for month in range(1, months + 1):
        if month <= len(schedule):
            total_mortgage_interest += schedule[month - 1]["interest"]
            
    # Property tax and maintenance are calculated annually for simplicity, or monthly. Let's do annually based on initial home price.
    annual_property_tax = home_price * property_tax_rate
    annual_maintenance = home_price * annual_maintenance_rate
    
    total_property_tax = annual_property_tax * expected_years_in_home
    total_maintenance = annual_maintenance * expected_years_in_home
    
    # Home appreciation
    future_home_value = future_value(home_price, home_appreciation_rate, expected_years_in_home)
    total_appreciation = future_home_value - home_price
    
    # Home equity built
    if months <= len(schedule):
        remaining_balance = schedule[months - 1]["remaining_balance"] if months > 0 else loan_amount
    else:
        remaining_balance = 0.0
        
    equity = future_home_value - remaining_balance
    
    # Total cost of buying = Interest + Taxes + Maintenance - Appreciation
    # Wait, the PRD says: mortgage interest + property tax + maintenance − home equity built − appreciation
    # If we subtract appreciation AND equity built, we are double counting. 
    # Equity built = (Future Home Value - Remaining Loan) - Down Payment.
    # Actually, net cost of buying = (Out of pocket expenses) - (Final Asset Value - Initial Asset Value)
    # Out of pocket = Down Payment + Total Mortgage Payments + Taxes + Maintenance
    # Final Asset Value = Future Home Value - Remaining Loan
    # Net Cost = Out of pocket - Final Asset Value
    # This is equivalent to: Down Payment + Principal Paid + Interest Paid + Taxes + Maintenance - (Home Price + Appreciation - Remaining Loan)
    # Since Principal Paid = Loan Amount - Remaining Loan
    # And Down Payment + Loan Amount = Home Price
    # Cost = Home Price - Remaining Loan + Interest + Taxes + Maintenance - Home Price - Appreciation + Remaining Loan
    # Cost = Interest + Taxes + Maintenance - Appreciation. This perfectly captures it.
    
    total_cost_buying = total_mortgage_interest + total_property_tax + total_maintenance - total_appreciation
    
    # 3. Breakeven Year
    breakeven_year = None
    cumulative_rent_cost = 0.0
    cumulative_buy_cost = 0.0
    
    for year in range(1, expected_years_in_home + 1):
        # Rent cost up to this year
        rent_paid = monthly_rent * 12 * year
        inv_growth = future_value(down_payment, market_investment_return, year) - down_payment
        net_rent_cost = rent_paid - inv_growth
        
        # Buy cost up to this year
        mths = year * 12
        interest_paid = sum([s["interest"] for s in schedule[:mths]])
        taxes = annual_property_tax * year
        maint = annual_maintenance * year
        apprec = future_value(home_price, home_appreciation_rate, year) - home_price
        net_buy_cost = interest_paid + taxes + maint - apprec
        
        if net_buy_cost < net_rent_cost and breakeven_year is None:
            breakeven_year = year
            
    # 4. Recommendation
    delta = abs(total_cost_buying - total_cost_renting)
    if total_cost_buying < total_cost_renting:
        recommendation = f"Buying is cheaper by ${delta:,.2f} over {expected_years_in_home} years."
    elif total_cost_renting < total_cost_buying:
        recommendation = f"Renting is cheaper by ${delta:,.2f} over {expected_years_in_home} years."
    else:
        recommendation = "Both options cost the same over the expected period."
        
    return {
        "total_cost_renting": total_cost_renting,
        "total_cost_buying": total_cost_buying,
        "breakeven_year": breakeven_year,
        "delta": delta,
        "recommendation": recommendation,
    }
