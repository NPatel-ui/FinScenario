from .shared_math import amortization_schedule

def calculate_lease_vs_buy_car(
    vehicle_price: float,
    lease_monthly_payment: float,
    lease_term_months: int,
    buy_down_payment: float,
    loan_apr: float,
    loan_term_months: int,
    expected_ownership_years: float,
    estimated_resale_value_percent: float,
) -> dict:
    ownership_months = int(expected_ownership_years * 12)
    
    # 1. Cost of Leasing
    # We assume the lease payment applies for the entire ownership period (e.g. they lease again)
    total_cost_leasing = lease_monthly_payment * ownership_months
    
    # 2. Cost of Buying
    loan_principal = max(0.0, vehicle_price - buy_down_payment)
    schedule = amortization_schedule(loan_principal, loan_apr, loan_term_months)
    
    # Sum up payments made during the ownership period
    # If ownership_months > loan_term_months, they stop paying after loan ends
    payments_made = 0.0
    for month in range(1, ownership_months + 1):
        if month <= len(schedule):
            payments_made += schedule[month - 1]["payment"]
            
    # Resale value at end of ownership
    resale_value = vehicle_price * (estimated_resale_value_percent / 100.0)
    
    # If they sell before loan is paid off, they must pay off the remaining balance
    remaining_loan_balance = 0.0
    if ownership_months < len(schedule):
        remaining_loan_balance = schedule[ownership_months - 1]["remaining_balance"]
        
    total_cost_buying = buy_down_payment + payments_made + remaining_loan_balance - resale_value
    
    # 3. Breakeven point
    # Find the month where cumulative buying cost < cumulative leasing cost
    breakeven_month = None
    cumulative_lease = 0.0
    cumulative_buy = buy_down_payment
    
    for month in range(1, ownership_months + 1):
        # Add monthly lease cost
        cumulative_lease += lease_monthly_payment
        
        # Add monthly buy cost (loan payment if any)
        if month <= len(schedule):
            cumulative_buy += schedule[month - 1]["payment"]
            current_balance = schedule[month - 1]["remaining_balance"]
        else:
            current_balance = 0.0
            
        # To get the net cost of buying AT this month, subtract the assumed resale value at this month
        # For simplicity, we'll linearly interpolate the car's depreciation from 100% to estimated_resale_value_percent
        # over the expected_ownership_years.
        current_resale_percent = 100.0 - ((100.0 - estimated_resale_value_percent) * (month / ownership_months))
        current_resale_value = vehicle_price * (current_resale_percent / 100.0)
        
        net_buy_cost_this_month = cumulative_buy + current_balance - current_resale_value
        
        if net_buy_cost_this_month < cumulative_lease and breakeven_month is None:
            breakeven_month = month
            
    # 4. Recommendation and delta
    delta = abs(total_cost_buying - total_cost_leasing)
    if total_cost_buying < total_cost_leasing:
        recommendation = f"Buying is cheaper by ${delta:,.2f} over {expected_ownership_years} years."
    elif total_cost_leasing < total_cost_buying:
        recommendation = f"Leasing is cheaper by ${delta:,.2f} over {expected_ownership_years} years."
    else:
        recommendation = "Both options cost the same over the expected ownership period."
        
    return {
        "total_cost_leasing": total_cost_leasing,
        "total_cost_buying": total_cost_buying,
        "breakeven_month": breakeven_month,
        "delta": delta,
        "recommendation": recommendation,
    }
