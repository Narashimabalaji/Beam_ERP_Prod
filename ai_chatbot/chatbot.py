
import os
import sys
from typing import List, Dict, Tuple

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
)

from sqlalchemy import func

# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

if not NVIDIA_API_KEY:
    raise RuntimeError(
        "NVIDIA_API_KEY is not configured. "
        "Please add it to your .env file."
    )


# ============================================================
# BACKEND PATH
# ============================================================

# Current file location
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Backend directory
BACKEND_DIR = os.path.abspath(
    os.path.join(CURRENT_DIR, "..", "backend")
)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)


# ============================================================
# DATABASE IMPORTS
# ============================================================

from database import SessionLocal
import models


# ============================================================
# NVIDIA MODEL CONFIGURATION
# ============================================================

MODEL_NAME = "nvidia/nemotron-3.5-lightning-30b-a3b"

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"


# ============================================================
# INITIALIZE NVIDIA LLM
# ============================================================

llm = ChatOpenAI(
    model=MODEL_NAME,
    base_url=NVIDIA_BASE_URL,
    api_key=NVIDIA_API_KEY,

    # ERP applications should be deterministic.
    temperature=0.2,
    top_p=0.7,

    # Reasonable response limit for an ERP assistant.
    max_tokens=2048,

    # Nemotron 3.5 supports thinking control.
    # We disable thinking initially for faster ERP responses.
    extra_body={
        "chat_template_kwargs": {
            "enable_thinking": False
        }
    },
)


# ============================================================
# ERP DATABASE CONTEXT
# ============================================================

def get_erp_context() -> str:
    """
    Fetch live summary information from the ERP database.

    Returns:
        A formatted string containing current ERP information.
    """

    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # TOTAL REVENUE
        # ----------------------------------------------------

        total_revenue = (
            db.query(func.sum(models.Revenue.amount)).scalar()
            or 0
        )

        # ----------------------------------------------------
        # TOTAL EXPENSES
        # ----------------------------------------------------

        total_expenses = (
            db.query(func.sum(models.Expense.amount)).scalar()
            or 0
        )

        # ----------------------------------------------------
        # INVOICE COUNT
        # ----------------------------------------------------

        invoice_count = (
            db.query(models.Invoice).count()
        )

        # ----------------------------------------------------
        # ORDER COUNT
        # ----------------------------------------------------

        order_count = (
            db.query(models.Order).count()
        )

        # ----------------------------------------------------
        # RECENT INVOICES
        # ----------------------------------------------------

        recent_invoices = (
            db.query(models.Invoice)
            .order_by(models.Invoice.id.desc())
            .limit(5)
            .all()
        )

        if recent_invoices:

            invoices_str = "\n".join(
                [
                    (
                        f"- Invoice: {inv.invoice_no} | "
                        f"Client: {inv.client_name} | "
                        f"Amount: ${inv.total_amount:,.2f} | "
                        f"Status: {inv.status}"
                    )
                    for inv in recent_invoices
                ]
            )

        else:
            invoices_str = "No recent invoices."

        # ----------------------------------------------------
        # RECENT ORDERS
        # ----------------------------------------------------

        recent_orders = (
            db.query(models.Order)
            .order_by(models.Order.id.desc())
            .limit(5)
            .all()
        )

        if recent_orders:

            orders_str = "\n".join(
                [
                    (
                        f"- Order: {order.order_number} | "
                        f"Customer: {order.customer_name} | "
                        f"Amount: ${order.total_amount:,.2f} | "
                        f"Status: {order.status}"
                    )
                    for order in recent_orders
                ]
            )

        else:
            orders_str = "No recent orders."

        # ----------------------------------------------------
        # CALCULATE PROFIT
        # ----------------------------------------------------

        profit = float(total_revenue) - float(total_expenses)

        # ----------------------------------------------------
        # BUILD CONTEXT
        # ----------------------------------------------------

        context = f"""
### LIVE ERP FINANCIAL SUMMARY

- Total Revenue: ${float(total_revenue):,.2f}
- Total Expenses: ${float(total_expenses):,.2f}
- Estimated Profit: ${profit:,.2f}
- Total Invoices Generated: {invoice_count}
- Total Orders Placed: {order_count}

### RECENT INVOICES

{invoices_str}

### RECENT ORDERS

{orders_str}
"""

        return context

    except Exception as e:

        print(
            f"Error fetching ERP context: {e}"
        )

        return """
ERP database information is currently unavailable.
Do not invent ERP figures.
"""

    finally:

        db.close()


# ============================================================
# SYSTEM PROMPT
# ============================================================

BEAM_SYSTEM_PROMPT = """
You are the Internal ERP AI Assistant for the management team
at Beam Signage & IT Solutions.

Your role is to help management understand business data,
financial information, orders and invoices.

You have access to live ERP information supplied below.

============================================================
BEHAVIOR RULES
============================================================

1. Be professional, concise and analytical.

2. Answer ERP-related questions using ONLY the ERP data
   supplied in the Live ERP Context.

3. NEVER invent financial figures.

4. NEVER invent customers, invoices, orders or transactions.

5. If the requested information is not available in the
   supplied ERP context, clearly tell the user that the
   current AI assistant only has access to the available
   ERP summary and recent transactions.

6. When presenting financial numbers, format them clearly.

7. When useful, use:
   - bullet points
   - tables
   - bold text
   - short summaries

8. If the user asks for calculations using the supplied
   ERP data, calculate them accurately.

9. If the user asks something unrelated to ERP/business data,
   politely explain that you are primarily an ERP assistant.

10. Do not claim that you performed an action in the ERP
    unless an actual ERP API/tool performed that action.

============================================================
LIVE ERP CONTEXT
============================================================

{context}

============================================================
END ERP CONTEXT
============================================================
"""


# ============================================================
# TOKEN EXTRACTION
# ============================================================

def extract_token_usage(response) -> Tuple[int, int]:
    """
    Extract input/output token usage from a LangChain response.

    Returns:
        (input_tokens, output_tokens)
    """

    input_tokens = 0
    output_tokens = 0

    # --------------------------------------------------------
    # LangChain usage_metadata
    # --------------------------------------------------------

    usage_metadata = getattr(
        response,
        "usage_metadata",
        None
    )

    if usage_metadata:

        input_tokens = (
            usage_metadata.get("input_tokens", 0)
            or usage_metadata.get("prompt_tokens", 0)
            or 0
        )

        output_tokens = (
            usage_metadata.get("output_tokens", 0)
            or usage_metadata.get("completion_tokens", 0)
            or 0
        )

        return (
            int(input_tokens),
            int(output_tokens)
        )

    # --------------------------------------------------------
    # Response metadata
    # --------------------------------------------------------

    response_metadata = getattr(
        response,
        "response_metadata",
        None
    )

    if response_metadata:

        token_usage = response_metadata.get(
            "token_usage",
            {}
        )

        input_tokens = (
            token_usage.get("prompt_tokens", 0)
            or token_usage.get("input_tokens", 0)
            or 0
        )

        output_tokens = (
            token_usage.get("completion_tokens", 0)
            or token_usage.get("output_tokens", 0)
            or 0
        )

    return (
        int(input_tokens),
        int(output_tokens)
    )


# ============================================================
# CHATBOT RESPONSE
# ============================================================

async def get_chatbot_response(
    user_message: str,
    conversation_history: List[Dict],
    **kwargs
) -> Tuple[str, int, int]:
    """
    Send a user message to the NVIDIA ERP AI assistant.

    Args:
        user_message:
            Current user question.

        conversation_history:
            Previous conversation messages.

    Returns:
        tuple:
            (
                response_text,
                input_tokens,
                output_tokens
            )
    """

    # ========================================================
    # GET LIVE ERP DATA
    # ========================================================

    erp_context = get_erp_context()

    # ========================================================
    # BUILD SYSTEM MESSAGE
    # ========================================================

    system_message = SystemMessage(
        content=BEAM_SYSTEM_PROMPT.format(
            context=erp_context
        )
    )

    messages = [
        system_message
    ]

    # ========================================================
    # ADD CONVERSATION HISTORY
    # ========================================================

    for msg in conversation_history:

        role = msg.get("role")
        content = msg.get("content", "")

        if not content:
            continue

        if role == "user":

            messages.append(
                HumanMessage(
                    content=content
                )
            )

        elif role == "assistant":

            messages.append(
                AIMessage(
                    content=content
                )
            )

        elif role == "system":

            # Avoid allowing arbitrary historical system
            # prompts to override the ERP system prompt.
            continue

    # ========================================================
    # CURRENT USER MESSAGE
    # ========================================================

    messages.append(
        HumanMessage(
            content=user_message
        )
    )

    # ========================================================
    # CALL NVIDIA
    # ========================================================

    try:

        response = llm.invoke(messages)

        # ----------------------------------------------------
        # RESPONSE CONTENT
        # ----------------------------------------------------

        response_content = response.content

        # ----------------------------------------------------
        # TOKEN USAGE
        # ----------------------------------------------------

        input_tokens, output_tokens = (
            extract_token_usage(response)
        )

        return (
            response_content,
            input_tokens,
            output_tokens
        )

    except Exception as e:

        print(
            "=========================================="
        )

        print(
            "NVIDIA API ERROR"
        )

        print(
            f"Error: {e}"
        )

        print(
            "=========================================="
        )

        return (
            "I'm having trouble connecting to the AI "
            "service right now. Please try again later.",
            0,
            0
        )


# ============================================================
# SIMPLE TEST
# ============================================================

if __name__ == "__main__":

    import asyncio

    async def test():

        reply, input_tokens, output_tokens = (
            await get_chatbot_response(
                user_message=(
                    "Give me a summary of the current "
                    "ERP business performance."
                ),
                conversation_history=[]
            )
        )

        print("\n================================")
        print("AI RESPONSE")
        print("================================\n")

        print(reply)

        print("\n================================")
        print("TOKEN USAGE")
        print("================================")

        print(
            f"Input tokens : {input_tokens}"
        )

        print(
            f"Output tokens: {output_tokens}"
        )

    asyncio.run(test())

