"""
Agent orchestrator — processes user messages using Gemini with manual tool-call loop.

Accepts and returns plain dicts (matching the DB JSONB format) rather than
Pydantic Scenario objects, so the API layer handles all ORM/Pydantic conversion.
"""
import os
import json
import logging
from typing import Tuple
from datetime import datetime, timezone
from google import genai
from google.genai import types

from app.agent.tools import AGENT_TOOLS
from app.agent.prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

# Initialize client. Requires GEMINI_API_KEY environment variable.
try:
    client = genai.Client()
except Exception as e:
    logger.error(f"Failed to initialize Gemini client. Is GEMINI_API_KEY set? {e}")
    client = None

# Build a dispatch map: function_name -> callable
_TOOL_DISPATCH = {fn.__name__: fn for fn in AGENT_TOOLS}

# Names of calculation tools whose results should populate scenario result
_CALCULATION_TOOLS = {
    "tool_calculate_rent_vs_buy",
    "tool_calculate_lease_vs_buy_car",
    "tool_calculate_debt_vs_invest",
}

# Names of data-fetcher tools whose results should populate scenario inputs
_DATA_FETCHER_TOOLS = {
    "tool_get_mortgage_rate",
    "tool_get_auto_loan_rate",
    "tool_get_inflation_rate",
    "tool_get_market_return_estimate",
}

# Maximum number of tool-call round-trips before we force a text response
_MAX_TOOL_ROUNDS = 15


def _build_scenario_result(
    tool_name: str,
    tool_args: dict,
    tool_output: dict,
    existing_inputs: list[dict],
) -> dict:
    """Build a ScenarioResult dict from a calculation tool's output."""
    summary = tool_output.get("recommendation", "Calculation complete.")

    # Build assumptions from the args that were passed into the tool
    assumptions = list(existing_inputs)  # carry forward any live-data inputs
    for arg_name, arg_value in tool_args.items():
        # Don't duplicate inputs already tracked from data-fetcher tools
        if not any(inp.get("field_name") == arg_name for inp in assumptions):
            assumptions.append({
                "field_name": arg_name,
                "value": arg_value,
                "source": "user_provided",
            })

    return {
        "summary": summary,
        "numeric_breakdown": tool_output,
        "assumptions_used": assumptions,
        "computed_at": datetime.now(timezone.utc).isoformat(),
    }


def _build_data_input(tool_name: str, tool_output: dict) -> dict:
    """Build a ScenarioInput dict from a data-fetcher tool's output."""
    field_names = {
        "tool_get_mortgage_rate": "mortgage_apr",
        "tool_get_auto_loan_rate": "auto_loan_apr",
        "tool_get_inflation_rate": "inflation_rate",
        "tool_get_market_return_estimate": "market_investment_return",
    }
    return {
        "field_name": field_names.get(tool_name, tool_name),
        "value": tool_output.get("value"),
        "source": "live_data",
        "as_of_date": tool_output.get("as_of_date"),
        "citation": tool_output.get("source_name"),
    }


def process_message(scenario: dict, user_text: str) -> Tuple[dict, str]:
    """
    Process a user message for a given scenario using Gemini.

    Args:
        scenario: Dict with keys: type, inputs, result, conversation
        user_text: The user's message text

    Returns:
        Tuple of (updated_scenario_dict, agent_response_text)
    """
    if not client:
        scenario.setdefault("conversation", [])
        scenario["conversation"].append({"role": "user", "content": user_text})
        error_msg = "System error: LLM client is not configured. Please set GEMINI_API_KEY."
        scenario["conversation"].append({"role": "assistant", "content": error_msg})
        return scenario, error_msg

    # Build history from scenario conversation
    history = []
    for msg in scenario.get("conversation", []):
        history.append(
            types.Content(
                role="user" if msg["role"] == "user" else "model",
                parts=[types.Part.from_text(text=msg["content"])]
            )
        )

    # Add the new user message to the history we send to the model
    history.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_text)]
        )
    )

    # Inject current scenario state into the system instruction
    inputs_list = scenario.get("inputs", [])
    state_json = json.dumps({
        "type": scenario.get("type", "custom"),
        "inputs_gathered": inputs_list,
        "last_result": scenario.get("result"),
    }, default=str)

    full_system_prompt = f"{SYSTEM_PROMPT}\n\nCURRENT SCENARIO STATE:\n{state_json}"

    # Declare tools for the model but do NOT use automatic calling
    config = types.GenerateContentConfig(
        system_instruction=full_system_prompt,
        tools=AGENT_TOOLS,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        temperature=0.1,
    )

    agent_text = ""

    try:
        contents = list(history)

        for round_num in range(_MAX_TOOL_ROUNDS):
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config=config,
            )

            # Check if the model wants to call tools
            tool_calls = []
            text_parts = []

            for part in response.candidates[0].content.parts:
                if part.function_call:
                    tool_calls.append(part.function_call)
                elif part.text:
                    text_parts.append(part.text)

            if not tool_calls:
                agent_text = "\n".join(text_parts) if text_parts else ""
                break

            # Execute each tool call
            contents.append(response.candidates[0].content)

            function_response_parts = []

            for fc in tool_calls:
                fn_name = fc.name
                fn_args = dict(fc.args) if fc.args else {}

                logger.info(f"[ORCHESTRATOR] Executing tool: {fn_name} with args: {fn_args}")

                fn = _TOOL_DISPATCH.get(fn_name)
                if fn is None:
                    logger.error(f"[ORCHESTRATOR] Unknown tool requested: {fn_name}")
                    fn_result = {"error": f"Unknown tool: {fn_name}"}
                else:
                    try:
                        fn_result = fn(**fn_args)
                    except Exception as e:
                        logger.error(f"[ORCHESTRATOR] Tool {fn_name} raised an error: {e}")
                        fn_result = {"error": str(e)}

                logger.info(f"[ORCHESTRATOR] Tool {fn_name} returned: {fn_result}")

                # ── Capture results onto the scenario ──
                if fn_name in _CALCULATION_TOOLS and "error" not in fn_result:
                    scenario["result"] = _build_scenario_result(
                        fn_name, fn_args, fn_result, inputs_list
                    )
                    logger.info(f"[ORCHESTRATOR] Updated scenario result from {fn_name}")

                elif fn_name in _DATA_FETCHER_TOOLS and "error" not in fn_result:
                    data_input = _build_data_input(fn_name, fn_result)
                    # Replace existing input with same field_name, or append
                    inputs_list = [
                        inp for inp in inputs_list
                        if inp.get("field_name") != data_input["field_name"]
                    ]
                    inputs_list.append(data_input)
                    scenario["inputs"] = inputs_list
                    logger.info(f"[ORCHESTRATOR] Updated scenario inputs with {data_input['field_name']}")

                function_response_parts.append(
                    types.Part.from_function_response(
                        name=fn_name,
                        response=fn_result,
                    )
                )

            contents.append(
                types.Content(
                    role="user",
                    parts=function_response_parts,
                )
            )
        else:
            logger.warning("[ORCHESTRATOR] Hit max tool rounds without final text response")
            agent_text = "I'm sorry, I encountered a processing issue. Please try rephrasing your question."

    except Exception as e:
        logger.error(f"Error communicating with Gemini: {e}", exc_info=True)
        if "401 UNAUTHENTICATED" in str(e) or "API key not valid" in str(e) or "API_KEY_INVALID" in str(e):
            agent_text = "System error: The Gemini API key configured in the backend is invalid or missing. Please check the GEMINI_API_KEY in your .env file."
        else:
            agent_text = "I'm sorry, I encountered an error processing your request."

    # Update scenario conversation
    scenario.setdefault("conversation", [])
    scenario["conversation"].append({"role": "user", "content": user_text})
    scenario["conversation"].append({"role": "assistant", "content": agent_text})

    return scenario, agent_text
