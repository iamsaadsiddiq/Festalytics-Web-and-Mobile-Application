from __future__ import annotations

import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any
from urllib.parse import quote

from app.core.config import settings

RAG_MODULE_DIR = Path(__file__).resolve().parents[1] / "ai_models" / "rag"
if str(RAG_MODULE_DIR) not in sys.path:
    sys.path.insert(0, str(RAG_MODULE_DIR))

import marriage_hall_rag as rag  # noqa: E402
from groq import Groq  # noqa: E402


_EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U00002700-\U000027BF"
    "\U00002600-\U000026FF"
    "]+",
    flags=re.UNICODE,
)


@dataclass
class RagRuntime:
    df: Any = None
    docs: Any = None
    word_vec: Any = None
    word_mat: Any = None
    char_vec: Any = None
    char_mat: Any = None
    bm25: Any = None
    client: Any = None
    meta: dict[str, Any] = field(default_factory=dict)
    image_index: dict[str, Path] = field(default_factory=dict)
    ready: bool = False


runtime = RagRuntime()


def _normalise_name(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "")
    value = value.encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-z0-9]+", "", value.lower())
    return value.strip()


def _build_image_index() -> dict[str, Path]:
    base = Path(settings.clip_hall_dir)
    index: dict[str, Path] = {}
    if not base.exists():
        return index
    for folder in base.iterdir():
        if folder.is_dir():
            index[_normalise_name(folder.name)] = folder
    return index


def _image_urls_for_hall(hall_name: str, limit: int = 3) -> list[dict[str, str]]:
    if not runtime.image_index:
        runtime.image_index = _build_image_index()
    key = _normalise_name(hall_name)
    folder = runtime.image_index.get(key)

    # Very conservative fallback for punctuation/spacing differences only.
    if folder is None:
        for candidate_key, candidate_folder in runtime.image_index.items():
            if candidate_key == key or (key and candidate_key and (key in candidate_key or candidate_key in key)):
                folder = candidate_folder
                break

    if folder is None:
        return []

    files = sorted(
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".avif"} and not p.name.startswith(".")
    )
    images = []
    for file_path in files[:limit]:
        images.append({
            "url": f"/assets/halls/{quote(folder.name)}/{quote(file_path.name)}",
            "filename": file_path.name,
        })
    return images


def clean_reply(text: str) -> str:
    text = _EMOJI_RE.sub("", text or "")
    text = text.replace("✅", "Yes").replace("❌", "No")
    text = text.replace("▸", "-").replace("•", "-").replace("→", "-")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _professionalize_markdown(text: str) -> str:
    """Keep useful Markdown, remove decorative symbols, and make the answer easy to render."""
    text = clean_reply(text)
    if not text:
        return text
    lines = []
    for raw in text.splitlines():
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped:
            lines.append("")
            continue
        # Convert numbered bold cards into proper subheadings where possible.
        m = re.match(r"^\*\*(\d+\.\s*.+?)\*\*\s*(.*)$", stripped)
        if m:
            title = m.group(1).strip()
            rest = m.group(2).strip()
            lines.append(f"### {title}{(' ' + rest) if rest else ''}")
            continue
        # Remove leftover decorative leading markers.
        stripped = re.sub(r"^[\-\s]*[A-Z ]{2,}:\s*", lambda m: m.group(0), stripped)
        lines.append(stripped)
    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def load_rag() -> None:
    if runtime.ready:
        return

    if not settings.rag_groq_api_key:
        raise RuntimeError("RAG_GROQ_API_KEY is missing in backend/.env")

    rag.DATA_PATH = settings.rag_data_path
    rag.STATE_DIR = settings.rag_state_dir

    runtime.client = Groq(api_key=settings.rag_groq_api_key)

    (
        runtime.df,
        runtime.docs,
        runtime.word_vec,
        runtime.word_mat,
        runtime.char_vec,
        runtime.char_mat,
        runtime.bm25,
    ) = rag.bootstrap(settings.rag_data_path, settings.rag_state_dir)

    meta_path = Path(settings.rag_state_dir) / "meta.json"
    if meta_path.exists():
        runtime.meta = json.loads(meta_path.read_text(encoding="utf-8"))
    else:
        runtime.meta = {"total_halls": len(runtime.df) if runtime.df is not None else 0}

    runtime.image_index = _build_image_index()
    runtime.ready = True



def _to_number(value: Any, default: float = 0.0) -> float:
    try:
        if value is None:
            return float(default)
        text = str(value).replace(",", "").strip()
        if not text or text.lower() in {"nan", "none", "not available"}:
            return float(default)
        found = re.findall(r"\d+(?:\.\d+)?", text)
        return float(found[0]) if found else float(default)
    except Exception:
        return float(default)


def _format_pkr(amount: float) -> str:
    return f"PKR {int(round(float(amount), 0)):,}"


def _parse_total_budget(message: str) -> float | None:
    text = (message or "").lower().replace(",", "")
    if not any(word in text for word in ["budget", "total", "overall", "cost", "amount", "pkr", "rs", "rupees", "lakh", "lac", "million", "crore"]):
        return None

    unit_patterns = [
        (r"(\d+(?:\.\d+)?)\s*(?:million|millions|m\b)", 1_000_000),
        (r"(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)", 100_000),
        (r"(\d+(?:\.\d+)?)\s*(?:crore|crores)", 10_000_000),
    ]
    for pattern, multiplier in unit_patterns:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1)) * multiplier

    money_patterns = [
        r"(?:budget|total|overall|amount|cost)\D{0,20}(\d{6,9})",
        r"(?:rs|pkr|rupees)\D{0,10}(\d{6,9})",
        r"(\d{6,9})\D{0,20}(?:budget|total|overall|amount|cost|rs|pkr|rupees)",
    ]
    for pattern in money_patterns:
        match = re.search(pattern, text)
        if match:
            return float(match.group(1))
    return None


def _is_cost_calculation_query(message: str) -> bool:
    text = (message or "").lower()
    return any(word in text for word in ["budget", "calculate", "calculation", "total", "cost", "expense", "estimate", "under", "near", "around"])


def _budget_calculation_response(message: str, df: Any) -> tuple[str, dict[str, Any], int, int, Any] | None:
    """Deterministic budget module for total-budget plus guest-count questions."""
    if df is None or not _is_cost_calculation_query(message):
        return None

    total_budget = _parse_total_budget(message)
    guests = rag.extract_guest_count(message)
    if not total_budget or not guests:
        return None

    dish = rag.extract_dish(message) or "chicken"
    price_col = f"r_one_dish_{dish}"
    if price_col not in df.columns:
        price_col = "r_one_dish_chicken"
        dish = "chicken"

    filtered, filters = rag.apply_filters(message, df, strict=False)
    search_space = filtered.copy() if filtered is not None and len(filtered) > 0 else df.copy()

    if "r_capacity_sitting" in search_space.columns and "r_minimum_guests" in search_space.columns:
        capacity_mask = (search_space["r_capacity_sitting"] >= guests) & (search_space["r_minimum_guests"] <= guests)
        if capacity_mask.sum() > 0:
            search_space = search_space[capacity_mask].copy()

    if price_col not in search_space.columns or len(search_space) == 0:
        return None

    rows = []
    for _, row in search_space.iterrows():
        per_head = _to_number(row.get(price_col), 0)
        if per_head <= 0:
            continue
        food_total = per_head * guests
        service_rate = _to_number(row.get("r_service_charge_pct"), 0)
        gst_rate = _to_number(row.get("r_gst_rate_pct"), 0)
        service_total = food_total * service_rate / 100
        gst_total = (food_total + service_total) * gst_rate / 100
        estimated_total = food_total + service_total + gst_total
        difference = estimated_total - total_budget
        rows.append({
            "row": row,
            "per_head": per_head,
            "food_total": food_total,
            "service_total": service_total,
            "gst_total": gst_total,
            "estimated_total": estimated_total,
            "difference": difference,
            "abs_difference": abs(difference),
            "within_budget": estimated_total <= total_budget,
        })

    if not rows:
        return None

    rows.sort(key=lambda item: (0 if item["within_budget"] else 1, item["abs_difference"], -_to_number(item["row"].get("r_rating"), 0)))
    selected_rows = rows[:5]
    selected = search_space.loc[[item["row"].name for item in selected_rows]].copy()

    target_per_head = total_budget / guests if guests else 0
    area = filters.get("area") or "Lahore"
    dish_label = dish.title()

    lines = [
        "# Budget Calculation",
        f"Total budget: {_format_pkr(total_budget)}",
        f"Guest count: {int(guests):,}",
        f"Requested menu: {dish_label}",
        f"Target per head from your budget: {_format_pkr(target_per_head)}",
        f"Search area: {area}",
        "",
        "## Best Matches Near Your Budget",
    ]

    for idx, item in enumerate(selected_rows, start=1):
        row = item["row"]
        name = str(row.get("r_hall_name", "Selected Hall")).strip()
        row_area = str(row.get("r_area", "")).strip()
        capacity = int(_to_number(row.get("r_capacity_sitting"), 0))
        rating = _to_number(row.get("r_rating"), 0)
        diff = item["difference"]
        if diff <= 0:
            diff_text = f"{_format_pkr(abs(diff))} under budget"
        else:
            diff_text = f"{_format_pkr(diff)} over budget"
        lines.extend([
            f"### {idx}. {name}",
            f"- Area: {row_area}",
            f"- Capacity: up to {capacity:,} guests",
            f"- {dish_label} per head: {_format_pkr(item['per_head'])}",
            f"- Food subtotal: {_format_pkr(item['food_total'])}",
            f"- Service charge estimate: {_format_pkr(item['service_total'])}",
            f"- GST estimate: {_format_pkr(item['gst_total'])}",
            f"- Estimated total: {_format_pkr(item['estimated_total'])}",
            f"- Budget difference: {diff_text}",
            f"- Rating: {rating:.1f}",
            "",
        ])

    best = selected_rows[0]
    best_name = str(best["row"].get("r_hall_name", "the first option")).strip()
    if best["within_budget"]:
        recommendation = f"{best_name} is the closest safe option because it remains within your total budget after service and GST estimates."
    else:
        recommendation = f"{best_name} is the closest option, but it is above your total budget. Reduce guest count, negotiate decor, or ask for a simpler menu to bring it closer."

    lines.extend([
        "## Recommendation",
        recommendation,
        "",
        "## Calculation Note",
        "These totals are estimates from the RAG dataset. Final quotes can change with date, decor scope, taxes, service charges, and negotiations.",
    ])

    return "\n".join(lines), filters, len(search_space), len(selected_rows), selected


def _run_rag(message: str) -> tuple[str, dict[str, Any], int, int, Any]:
    if not runtime.ready or runtime.df is None:
        raise RuntimeError("RAG index is not ready yet.")

    message = (message or "").strip()
    if not message:
        return "Please ask a marriage hall question.", {}, 0, 0, None

    if not rag.is_hall_question(message):
        lang = rag.detect_language(message)
        if lang == "roman_urdu":
            return (
                "Main aapka marriage hall assistant hoon. Hall, price, area, capacity ya amenities ke baare mein poochhen.",
                {},
                0,
                0,
                None,
            )
        return (
            "I am your Lahore marriage hall assistant. Ask me about halls by area, capacity, price, food package, amenities, or budget.",
            {},
            0,
            0,
            None,
        )

    is_cheap, flavour = rag.is_free_or_ultra_cheap_request(message)
    if is_cheap:
        return rag.humorous_free_response(message, flavour), {}, 0, 0, None

    budget_answer = _budget_calculation_response(message, runtime.df)
    if budget_answer is not None:
        return budget_answer

    strict_df, filters = rag.apply_filters(message, runtime.df, strict=True)
    exact_count = len(strict_df)

    if exact_count > 0:
        search_space = strict_df
    else:
        relaxed_df, _ = rag.apply_filters(message, runtime.df, strict=False)
        search_space = relaxed_df if len(relaxed_df) > 0 else runtime.df

    results = rag.retrieve(
        message,
        search_space,
        runtime.df,
        runtime.docs,
        runtime.word_vec,
        runtime.word_mat,
        runtime.char_vec,
        runtime.char_mat,
        runtime.bm25,
        rag.TOP_K,
    )

    intent = rag.detect_intent(message)
    dish = rag.extract_dish(message)
    price_column = f"r_one_dish_{dish}" if dish else "r_one_dish_chicken"

    if intent == "budget":
        results = results.sort_values([price_column, "_score"], ascending=[True, False])
    elif intent == "premium":
        results = results.sort_values([price_column, "_score"], ascending=[False, False])
    elif intent == "top_rated":
        results = results.sort_values(["r_rating", "_score"], ascending=[False, False])
    elif intent == "weekday_deal":
        results = results.sort_values(["r_weekday_discount_pct", "_score"], ascending=[False, False])
    else:
        results = results.sort_values("_score", ascending=False)

    selected = results.head(min(5, rag.TOP_K)).copy()
    reply = rag.generate_answer(
        message,
        selected,
        filters,
        exact_count,
        runtime.client,
    )
    return reply, filters, exact_count, min(len(results), len(selected)), selected


def _hall_cards(selected: Any) -> list[dict[str, Any]]:
    if selected is None:
        return []
    cards = []
    for _, row in selected.iterrows():
        name = str(row.get("r_hall_name", "")).strip()
        if not name:
            continue
        images = _image_urls_for_hall(name)
        if not images:
            continue
        try:
            rating = round(float(row.get("r_rating", 0)), 1)
        except Exception:
            rating = None
        cards.append({
            "name": name,
            "area": str(row.get("r_area", "")).strip(),
            "address": str(row.get("r_full_address", "")).strip(),
            "rating": rating,
            "capacity_sitting": int(row.get("r_capacity_sitting", 0) or 0),
            "minimum_guests": int(row.get("r_minimum_guests", 0) or 0),
            "images": images,
        })
    return cards


def ask_rag(message: str) -> dict[str, Any]:
    reply, filters, exact_count, shown, selected = _run_rag(message)
    clean_filters = {k: v for k, v in filters.items() if v and v != "standard" and v != {}}
    halls = _hall_cards(selected)
    return {
        "reply": _professionalize_markdown(reply),
        "filters_used": clean_filters,
        "exact_matches": exact_count,
        "halls_shown": shown,
        "halls": halls,
        "model": getattr(rag, "CHAT_MODEL", settings.groq_text_model),
    }


def get_areas() -> list[str]:
    if not runtime.ready or runtime.df is None:
        return []
    return sorted(runtime.df["r_area"].unique().tolist())


def get_suggestions() -> list[str]:
    return [
        "Best halls in Johar Town for 400 guests under PKR 3500 chicken",
        "Show me AC halls with bridal room in DHA",
        "Cheapest mutton per head in Gulberg",
        "Top rated premium halls in Model Town",
        "Which halls give weekday discounts?",
        "Outdoor lawn marquee halls in Lahore",
    ]
