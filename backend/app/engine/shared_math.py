def monthly_amortization_payment(principal: float, annual_rate: float, term_months: int) -> float:
    """
    Calculate the fixed monthly payment for an amortizing loan.
    If the annual rate is 0, the payment is simply principal / term_months.
    """
    if principal <= 0 or term_months <= 0:
        return 0.0
        
    if annual_rate == 0:
        return principal / term_months
        
    monthly_rate = annual_rate / 12.0
    payment = principal * (monthly_rate * (1 + monthly_rate)**term_months) / ((1 + monthly_rate)**term_months - 1)
    return payment

def amortization_schedule(principal: float, annual_rate: float, term_months: int) -> list[dict]:
    """
    Generate a month-by-month amortization schedule.
    Each dict contains: month, payment, interest, principal, remaining_balance
    """
    schedule = []
    if principal <= 0 or term_months <= 0:
        return schedule
        
    monthly_payment = monthly_amortization_payment(principal, annual_rate, term_months)
    monthly_rate = annual_rate / 12.0
    balance = principal
    
    for month in range(1, term_months + 1):
        interest_payment = balance * monthly_rate
        
        # Handle the final month to clear out any small rounding differences
        if month == term_months:
            principal_payment = balance
            payment = principal_payment + interest_payment
            balance = 0.0
        else:
            principal_payment = monthly_payment - interest_payment
            balance -= principal_payment
            payment = monthly_payment
            
        schedule.append({
            "month": month,
            "payment": payment,
            "interest": interest_payment,
            "principal": principal_payment,
            "remaining_balance": max(0.0, balance)
        })
        
    return schedule

def future_value(principal: float, annual_rate: float, years: int, monthly_contribution: float = 0.0) -> float:
    """
    Calculate the future value of an investment with a starting principal, an annual growth rate,
    and an optional monthly contribution. Assumes compounding occurs monthly.
    """
    if years < 0:
        return principal
        
    months = int(years * 12)
    monthly_rate = annual_rate / 12.0
    
    if monthly_rate == 0:
        return principal + (monthly_contribution * months)
        
    # Compound the starting principal
    fv_principal = principal * ((1 + monthly_rate) ** months)
    
    # Compound the monthly contributions
    if monthly_contribution > 0:
        fv_contributions = monthly_contribution * (((1 + monthly_rate) ** months - 1) / monthly_rate)
    else:
        fv_contributions = 0.0
        
    return fv_principal + fv_contributions

def present_value_of_series(cashflows: list[float], discount_rate: float) -> float:
    """
    Calculate the present value of a series of cash flows.
    The cashflows are assumed to occur at regular intervals (e.g., years).
    discount_rate is the per-interval discount rate.
    """
    pv = 0.0
    for t, cf in enumerate(cashflows):
        pv += cf / ((1 + discount_rate) ** t)
    return pv

def inflation_adjust(amount: float, annual_inflation_rate: float, years: int) -> float:
    """
    Adjust an amount for inflation over a given number of years.
    Returns what the future amount would cost in today's money (discounted by inflation),
    or what today's amount will cost in the future (compounded by inflation).
    If we are projecting a future cost given today's cost, we compound.
    """
    return amount * ((1 + annual_inflation_rate) ** years)
