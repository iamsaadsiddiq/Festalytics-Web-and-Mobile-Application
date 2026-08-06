"""
═══════════════════════════════════════════════════════════════
 ELITE MARRIAGE HALL RAG — Lahore (v4.0)
 ▸ BM25 + TF-IDF (word + char) hybrid retrieval
 ▸ All 39 columns indexed & answered
 ▸ Correct phone numbers (leading zero restored)
 ▸ Amenity / weekday / rating / venue-type query support
 ▸ Saves full RAG state to disk for backend reuse
 ▸ Powered by Groq LLM (llama-3.3-70b-versatile)
 ▸ Humorous guard for free / under-1000 PKR requests
═══════════════════════════════════════════════════════════════
"""

# ─── 0. INSTALL ──────────────────────────────────────────────
# pip install groq python-dotenv openpyxl scikit-learn rank_bm25

import os, re, json, pickle, math
from pathlib import Path
from dotenv import load_dotenv

import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from rank_bm25 import BM25Okapi

# ─── Load .env (search from this file's directory upward) ────
load_dotenv(dotenv_path=Path(__file__).resolve().parent / ".env")

# ════════════════════════════════════════════════════════════
# 1. CONFIGURATION
# ════════════════════════════════════════════════════════════

API_KEY    = os.getenv("GROQ_API_KEY", "")          # ← loaded from .env
DATA_PATH  = "/marriage_halls_realistic_enhanced.xlsx"
STATE_DIR  = "./rag_state"
CHAT_MODEL = "llama-3.3-70b-versatile"              # Groq model
TOP_K      = 12                                     # retrieve top-K before final re-rank

# ════════════════════════════════════════════════════════════
# 2. ROMAN URDU + AREA DICTIONARIES
# ════════════════════════════════════════════════════════════

ROMAN_URDU_MAP = {
    "shadi":       "marriage wedding",
    "shaadi":      "marriage wedding",
    "hall chahiye":"need hall",
    "chahye":      "need",
    "chahiye":     "need",
    "chaiye":      "need",
    "dhoondo":     "find",
    "batao":       "show suggest",
    "dikhao":      "show",
    "mehnga":      "expensive premium luxury",
    "mehengi":     "expensive premium luxury",
    "sasta":       "cheap affordable budget",
    "sasti":       "cheap affordable budget",
    "munasib":     "affordable reasonable budget",
    "acha":        "good best",
    "achi":        "good best",
    "behtareen":   "best premium top rated",
    "qareeb":      "near",
    "nazdeek":     "near",
    "ilaqa":       "area location",
    "jaga":        "venue hall",
    "jagah":       "venue hall",
    "log":         "guests people",
    "banday":      "guests people",
    "bande":       "guests people",
    "afrad":       "guests people",
    "mehmaan":     "guests people",
    "mehmaanon":   "guests people",
    "capacity":    "capacity guests",
    "gunjaish":    "capacity guests",
    "mutton":      "mutton",
    "bakra":       "mutton",
    "beef":        "beef",
    "chicken":     "chicken",
    "murgha":      "chicken",
    "rate":        "price rate",
    "qeemat":      "price",
    "keemat":      "price",
    "per head":    "per head",
    "fi banda":    "per head",
    "per banda":   "per head",
    "under":       "under below less than",
    "se kam":      "less than under below",
    "kam se kam":  "minimum",
    "zyada":       "maximum",
    "tak":         "up to under",
    "budget":      "budget affordable",
    "premium":     "premium luxury",
    "luxury":      "luxury premium",
    "royal":       "royal premium",
    "ac":          "air conditioned",
    "ac hall":     "air conditioned hall",
    "thanda":      "air conditioned cool",
    "parking":     "parking",
    "bridal room": "bridal room",
    "bridal":      "bridal room",
    "generator":   "generator backup power",
    "genset":      "generator backup",
    "bijli":       "generator electricity power",
    "decor":       "decoration in house",
    "sajawat":     "decoration",
    "lawn":        "lawn outdoor marquee",
    "marquee":     "marquee lawn outdoor",
    "weekday":     "weekday discount",
    "week day":    "weekday discount",
    "discount":    "discount weekday cheaper",
    "rating":      "rating reviews top rated",
    "reviews":     "reviews rating",
    "top":         "top rated best",
    "walima":      "walima wedding reception",
    "barat":       "barat wedding",
    "mehndi":      "mehndi event",
    "hotel":       "hotel banquet",
    "club":        "club garrison venue",
    # Free/cheap Urdu terms
    "muft":        "free no cost",
    "free":        "free no cost",
    "bedone paise":"free no cost",
    "bina paise":  "free no cost",
    "bilkul sasta":"very cheap budget",
    "ek rupee":    "one rupee free",
}

AREA_ALIASES = {
    "johar":            "Johar Town",
    "johar town":       "Johar Town",
    "dha":              "DHA",
    "dha phase 8":      "DHA Phase 8",
    "defence":          "DHA",
    "defense":          "DHA",
    "gulberg":          "Gulberg",
    "gulberg 3":        "Gulberg (III)",
    "gulberg iii":      "Gulberg (III)",
    "model town":       "Model Town",
    "garden town":      "Garden Town",
    "faisal town":      "Faisal Town",
    "township":         "Township",
    "wapda town":       "Wapda Town",
    "bahria":           "Bahria Town",
    "bahria town":      "Bahria Town",
    "cantt":            "Cantt",
    "iqbal town":       "Allama Iqbal Town",
    "allama iqbal":     "Allama Iqbal Town",
    "muslim town":      "Muslim Town",
    "sabzazar":         "Sabzazar",
    "marghzar":         "Marghzar",
    "raiwind":          "Raiwind Road",
    "raiwind road":     "Raiwind Road",
}


# ════════════════════════════════════════════════════════════
# 3. UTILITIES
# ════════════════════════════════════════════════════════════

def normalize_col(c):
    c = str(c).strip().lower()
    c = re.sub(r"[^a-z0-9]+", "_", c)
    return re.sub(r"_+", "_", c).strip("_")

def clean(x):
    if pd.isna(x): return ""
    return str(x).strip()

def to_num(x, default=0.0):
    if pd.isna(x): return float(default)
    nums = re.findall(r"\d+(?:\.\d+)?", str(x).replace(",", ""))
    return float(nums[0]) if nums else float(default)

def fix_phone(x):
    """Restore leading zero stripped from Pakistani mobile numbers."""
    if pd.isna(x) or str(x).strip() in ("", "nan", "0"):
        return "Not available"
    s = str(x).strip()
    s = s.split(".")[0]
    if re.match(r"^3\d{9}$", s):
        return "0" + s
    if re.match(r"^03\d{9}$", s):
        return s
    if re.match(r"^\d{7,11}$", s):
        return "0" + s if not s.startswith("0") else s
    return s

def normalize_query(q: str) -> str:
    q = q.lower().strip()
    q = q.replace("rs.", "rs").replace("pkr.", "pkr")
    q = re.sub(r"\s+", " ", q)
    extra = []
    for phrase, repl in ROMAN_URDU_MAP.items():
        if phrase in q:
            extra.append(repl)
    for alias, official in AREA_ALIASES.items():
        if alias in q.lower():
            extra.append(official.lower())
    return q + (" " + " ".join(extra) if extra else "")

def yesno(x):
    if pd.isna(x): return "unknown"
    s = str(x).strip().lower()
    return "Yes" if s in ("yes", "1", "true", "y") else ("No" if s in ("no", "0", "false", "n") else clean(x))


# ════════════════════════════════════════════════════════════
# 3b. FREE / ULTRA-CHEAP REQUEST GUARD
# ════════════════════════════════════════════════════════════

_FREE_KEYWORDS_EN = [
    "free", "no cost", "zero cost", "without charge", "no charge",
    "complimentary", "at no cost", "0 rupees", "zero rupees",
]
_FREE_KEYWORDS_UR = [
    "muft", "bedone paise", "bina paise", "free wala", "muft wala",
    "free hall chahiye", "muft hall", "ek rupee", "zero rate",
    "bilkul free", "free me",
]
_CHEAP_THRESHOLD = 1000   # PKR per head

def is_free_or_ultra_cheap_request(q: str) -> tuple[bool, str]:
    """
    Returns (True, flavour) if the query is asking for:
      - A free hall (any language / Roman Urdu)
      - A hall under PKR 1,000 per head
    flavour is 'free' or 'cheap'
    """
    ql = q.lower()

    # Free keywords
    if any(kw in ql for kw in _FREE_KEYWORDS_EN + _FREE_KEYWORDS_UR):
        return True, "free"

    # Price explicitly 0
    max_p = extract_max_price(q)
    if max_p is not None and max_p == 0:
        return True, "free"

    # Under 1000 PKR
    if max_p is not None and 0 < max_p < _CHEAP_THRESHOLD:
        return True, "cheap"

    return False, ""

def humorous_free_response(q: str, flavour: str) -> str:
    """Return a funny but warm response for free/under-1000 requests."""
    lang = detect_language(q)

    if lang == "roman_urdu":
        if flavour == "free":
            return (
                "😂 Bhai/Aapi, free marriage hall? Lahore mein?! "
                "Suno, chai free milti hai, nikah free hota hai — "
                "lekin hall? Hall wale toh pani ka bhi hisaab rakhte hain! 💧\n\n"
                "Hamare database mein **koi bhi free hall nahi hai** — "
                "aur honestly, agr koi 'free hall' offer kare toh seedha bhaag jaein 😅\n\n"
                "Agar **budget-friendly** options chahiye hain to batayen — "
                "hum aapko **PKR 1,500–2,500/head** wale best value halls dikhate hain "
                "jo wallet bhi nahi todenge aur izzat bhi bani rahegi! 🏛️💍"
            )
        else:  # cheap < 1000
            return (
                f"😄 PKR 1,000 se kam mein marriage hall? Aap toh bade creative hain! "
                "Itne mein toh sirf **napkin** milta hai — woh bhi ek طرف سے used 😂\n\n"
                "Lahore ke kisi bhi decent hall mein **minimum PKR 1,500/head** se shuru hota hai.\n\n"
                "Humara suggestion hai: thoda budget barha lein — "
                "aap ki shaadi ek baar hoti hai (hopefully 😉)! "
                "Bataiye kitna budget hai, hum aapko **best value halls** suggest karein ge! 🤝"
            )
    else:
        if flavour == "free":
            return (
                "😂 A **free** marriage hall in Lahore? That's adorable!\n\n"
                "The only free things at a wedding venue are the awkward "
                "compliments from distant relatives and the stale breath mints "
                "at the exit. 😅\n\n"
                "We have **zero free halls** in our database — and if someone "
                "offers you one, run! 🏃‍♂️\n\n"
                "If you're looking for **budget-friendly** options, we've got "
                "great halls from **PKR 1,500–2,500/head** that'll keep your "
                "wallet intact and your guests impressed. Just say the word! 💍"
            )
        else:  # cheap < 1000
            return (
                f"😄 Under PKR 1,000 per head for a marriage hall? "
                "Bold strategy! At that price, you might get a lovely "
                "tent in someone's backyard — BYOP (Bring Your Own Pillar). 🏕️😂\n\n"
                "Realistically, decent halls in Lahore start from around "
                "**PKR 1,500/head**. \n\n"
                "Your wedding day is (hopefully) once in a lifetime — "
                "let's find you the best value for a realistic budget. "
                "What's your actual per-head budget? We'll get you sorted! 🎊"
            )


# ════════════════════════════════════════════════════════════
# 4. DATA LOADING — ALL 39 COLUMNS
# ════════════════════════════════════════════════════════════

def load_dataset(path: str) -> pd.DataFrame:
    p = Path(path)
    if p.suffix.lower() == ".xlsx":
        df = pd.read_excel(path, engine="openpyxl")
    elif p.suffix.lower() in (".xls",):
        df = pd.read_excel(path)
    else:
        df = pd.read_csv(path, encoding="utf-8-sig")

    df.columns = [normalize_col(c) for c in df.columns]
    df = df.fillna("")

    # ── Phone (restore leading zero) ──────────────────────
    df["r_phone_1"] = df["phone_1"].apply(fix_phone)
    df["r_phone_2"] = df["phone_2"].apply(fix_phone)

    # ── Numeric fields ────────────────────────────────────
    for col in ["one_dish_chicken", "one_dish_beef", "one_dish_mutton",
                "capacity_sitting", "minimum_guests", "parking_capacity",
                "number_of_lawns", "number_of_banquet_halls",
                "weekday_discount_pct", "weekday_chicken_price", "weekend_chicken_price",
                "peak_season_surcharge_pct", "gst_rate_pct", "service_charge_pct",
                "advance_booking_pct", "estimated_bill_300_guests",
                "rating", "review_count"]:
        df[f"r_{col}"] = df[col].apply(lambda x: to_num(x, 0))

    # ── Boolean amenities ─────────────────────────────────
    for col in ["is_air_conditioned", "decoration_in_house", "bridal_room", "generator_backup"]:
        df[f"r_{col}"] = df[col].apply(yesno)

    # ── Text fields ───────────────────────────────────────
    for col in ["hall_name", "area", "full_address", "description",
                "package_details", "price_range", "category", "venue_type",
                "menu_price_tier", "keywords", "last_verified", "city",
                "contact_verification_status", "data_quality_note"]:
        df[f"r_{col}"] = df[col].apply(clean)

    # capacity alias
    df["r_capacity_max"] = df["r_capacity_sitting"]
    df["r_capacity_min"] = df["r_minimum_guests"]

    print(f"✓ Loaded {len(df)} halls with {len(df.columns)} columns.")
    return df.reset_index(drop=True)


# ════════════════════════════════════════════════════════════
# 5. BUILD RICH DOCUMENT PER HALL (for indexing)
# ════════════════════════════════════════════════════════════

def build_document(row) -> str:
    """Craft a searchable, human-readable text block from ALL columns."""
    phone_str = row["r_phone_1"]
    if row["r_phone_2"] and row["r_phone_2"] != "Not available":
        phone_str += f" / {row['r_phone_2']}"

    ac    = row["r_is_air_conditioned"]
    decor = row["r_decoration_in_house"]
    brid  = row["r_bridal_room"]
    gen   = row["r_generator_backup"]

    amenities = []
    if ac    == "Yes": amenities.append("Air Conditioned")
    if decor == "Yes": amenities.append("In-House Decoration")
    if brid  == "Yes": amenities.append("Bridal Room")
    if gen   == "Yes": amenities.append("Generator Backup")

    wd_dis = int(row["r_weekday_discount_pct"])
    wd_chk = int(row["r_weekday_chicken_price"])
    we_chk = int(row["r_weekend_chicken_price"])
    gst    = int(row["r_gst_rate_pct"])
    svc    = int(row["r_service_charge_pct"])
    adv    = int(row["r_advance_booking_pct"])
    peak   = int(row["r_peak_season_surcharge_pct"])
    bill   = int(row["r_estimated_bill_300_guests"])

    core = f"""
Hall Name: {row['r_hall_name']}
Area: {row['r_area']}
City: {row['r_city']}
Full Address: {row['r_full_address']}
Category: {row['r_category']}
Venue Type: {row['r_venue_type']}
Menu Price Tier: {row['r_menu_price_tier']}
Rating: {row['r_rating']:.1f} / 5.0  ({int(row['r_review_count'])} reviews)

CAPACITY & LAYOUT
  Sitting Capacity: {int(row['r_capacity_sitting'])} guests
  Minimum Guests:   {int(row['r_minimum_guests'])}
  Lawns:            {int(row['r_number_of_lawns'])}
  Banquet Halls:    {int(row['r_number_of_banquet_halls'])}
  Parking Spaces:   {int(row['r_parking_capacity'])}

FOOD PRICES (per head, base rate)
  Chicken One-Dish: PKR {int(row['r_one_dish_chicken'])}
  Beef    One-Dish: PKR {int(row['r_one_dish_beef'])}
  Mutton  One-Dish: PKR {int(row['r_one_dish_mutton'])}

PRICING DETAILS
  Price Range:             {row['r_price_range']}
  Weekday Discount:        {wd_dis}%
  Weekday Chicken Price:   PKR {wd_chk}
  Weekend Chicken Price:   PKR {we_chk}
  Peak Season Surcharge:   {peak}%
  GST:                     {gst}%
  Service Charge:          {svc}%
  Advance Booking %:       {adv}%
  Est. Bill (300 guests):  PKR {bill:,}

AMENITIES
  Air Conditioned:       {ac}
  In-House Decoration:   {decor}
  Bridal Room:           {brid}
  Generator Backup:      {gen}
  Amenities list:        {', '.join(amenities) if amenities else 'None listed'}

DESCRIPTION
{row['r_description']}

PACKAGE DETAILS
{row['r_package_details']}

KEYWORDS
{row['r_keywords']}

CONTACT
  Phone 1: {row['r_phone_1']}
  Phone 2: {row['r_phone_2']}
  Last Verified: {row['r_last_verified']}
  Contact Verification: {row['r_contact_verification_status']}
"""

    booster = """
marriage wedding shaadi shadi banquet hall venue event booking catering decor walima barat mehndi
lahore area ilaqa jagah jaga guests capacity log banday mehmaan
budget affordable sasta munasib cheap premium luxury royal grand
chicken murgha beef mutton bakra per head rate qeemat price
air conditioned ac thanda parking bridal room generator genset bijli bijli backup
marquee lawn outdoor banquet hotel club garrison
weekday discount cheaper season peak
top rated best acha achi behtareen
"""
    return core + booster


# ════════════════════════════════════════════════════════════
# 6. INDEX BUILDING
# ════════════════════════════════════════════════════════════

def build_index(df: pd.DataFrame):
    docs = [build_document(row) for _, row in df.iterrows()]

    word_vec = TfidfVectorizer(
        lowercase=True, ngram_range=(1, 3), max_features=40000, min_df=1
    )
    word_mat = word_vec.fit_transform(docs)

    char_vec = TfidfVectorizer(
        lowercase=True, analyzer="char_wb", ngram_range=(3, 5),
        max_features=30000, min_df=1
    )
    char_mat = char_vec.fit_transform(docs)

    tokenized = [d.lower().split() for d in docs]
    bm25 = BM25Okapi(tokenized)

    print(f"✓ Index built: {len(docs)} documents, "
          f"{word_mat.shape[1]:,} word-features, "
          f"{char_mat.shape[1]:,} char-features.")

    return docs, word_vec, word_mat, char_vec, char_mat, bm25


# ════════════════════════════════════════════════════════════
# 7. SAVE / LOAD RAG STATE
# ════════════════════════════════════════════════════════════

def save_state(df, docs, word_vec, word_mat, char_vec, char_mat, bm25,
               state_dir=STATE_DIR):
    from scipy.sparse import save_npz
    path = Path(state_dir)
    path.mkdir(parents=True, exist_ok=True)

    df.to_parquet(path / "halls.parquet", index=False)

    with open(path / "word_vec.pkl",  "wb") as f: pickle.dump(word_vec, f)
    with open(path / "char_vec.pkl",  "wb") as f: pickle.dump(char_vec, f)
    with open(path / "bm25.pkl",      "wb") as f: pickle.dump(bm25,     f)
    with open(path / "docs.pkl",      "wb") as f: pickle.dump(docs,     f)

    save_npz(str(path / "word_mat.npz"), word_mat)
    save_npz(str(path / "char_mat.npz"), char_mat)

    meta = {
        "total_halls":   len(df),
        "areas":         sorted(df["r_area"].unique().tolist()),
        "venue_types":   sorted(df["r_venue_type"].unique().tolist()),
        "price_tiers":   sorted(df["r_menu_price_tier"].unique().tolist()),
        "model":         CHAT_MODEL,
        "top_k":         TOP_K,
    }
    with open(path / "meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print(f"✓ RAG state saved → {path.resolve()}")


def load_state(state_dir=STATE_DIR):
    from scipy.sparse import load_npz
    path = Path(state_dir)

    df       = pd.read_parquet(path / "halls.parquet")
    with open(path / "word_vec.pkl",  "rb") as f: word_vec = pickle.load(f)
    with open(path / "char_vec.pkl",  "rb") as f: char_vec = pickle.load(f)
    with open(path / "bm25.pkl",      "rb") as f: bm25     = pickle.load(f)
    with open(path / "docs.pkl",      "rb") as f: docs     = pickle.load(f)

    word_mat = load_npz(str(path / "word_mat.npz"))
    char_mat = load_npz(str(path / "char_mat.npz"))

    print(f"✓ RAG state loaded from {path.resolve()} ({len(df)} halls)")
    return df, docs, word_vec, word_mat, char_vec, char_mat, bm25


# ════════════════════════════════════════════════════════════
# 8. QUERY UNDERSTANDING
# ════════════════════════════════════════════════════════════

def extract_guest_count(q: str):
    q = normalize_query(q).replace(",", "")
    patterns = [
        r"(\d{2,5})\s*(?:guests?|people|persons?|pax|log|banday|bande|afrad|mehmaan)",
        r"(?:guests?|people|persons?|pax|log|banday|bande|afrad|mehmaan)\s*(\d{2,5})",
        r"capacity\s*(?:of|for)?\s*(\d{2,5})",
        r"for\s*(\d{2,5})\s*(?:people|guests?|log|mehmaan)",
        r"(\d{2,5})\s*(?:ki|ke)?\s*(?:capacity|gunjaish)",
    ]
    for p in patterns:
        m = re.search(p, q)
        if m:
            nums = re.findall(r"\d{2,5}", m.group(0))
            if nums: return int(nums[-1])
    return None

def extract_max_price(q: str):
    q = normalize_query(q).replace(",", "")
    patterns = [
        r"(?:less than|under|below|max|maximum|up to|upto|within|<=|se kam|tak)\s*(?:rs|pkr)?\s*(\d{1,6})",
        r"(?:rs|pkr)?\s*(\d{3,6})\s*(?:per head|/head|head|fi banda|per banda|per person)",
        r"rate\s*(?:less than|under|below|up to|se kam|tak)?\s*(?:rs|pkr)?\s*(\d{3,6})",
        r"(?:qeemat|keemat|price)\s*(?:less than|under|below|se kam|tak)?\s*(?:rs|pkr)?\s*(\d{3,6})",
        r"(\d{3,6})\s*(?:se kam|tak)",
        r"budget\s*(?:rs|pkr)?\s*(\d{3,6})",
        r"(?:rs|pkr)?\s*0\s*(?:per head|/head|free|muft)",  # explicitly 0
    ]
    for p in patterns:
        m = re.search(p, q)
        if m:
            nums = re.findall(r"\d+", m.group(0))
            if nums: return int(nums[-1])
    return None

def extract_min_price(q: str):
    q = normalize_query(q).replace(",", "")
    patterns = [
        r"(?:more than|above|minimum|at least|>=|se zyada)\s*(?:rs|pkr)?\s*(\d{3,6})",
        r"(?:rs|pkr)?\s*(\d{3,6})\s*(?:se zyada|se upar|plus)",
    ]
    for p in patterns:
        m = re.search(p, q)
        if m:
            nums = re.findall(r"\d{3,6}", m.group(0))
            if nums: return int(nums[-1])
    return None

def extract_dish(q: str):
    q = normalize_query(q)
    if "mutton" in q or "bakra" in q:   return "mutton"
    if "beef"   in q:                   return "beef"
    if "chicken" in q or "murgha" in q: return "chicken"
    return None

def extract_area(q: str, df: pd.DataFrame):
    q_norm = normalize_query(q).lower()
    dataset_areas = sorted(df["r_area"].unique().tolist(), key=len, reverse=True)
    for area in dataset_areas:
        if area.lower() in q_norm:
            return area
    for alias, official in sorted(AREA_ALIASES.items(), key=lambda x: -len(x[0])):
        if alias in q_norm:
            return official
    return None

def extract_amenities(q: str) -> dict:
    q = q.lower()
    return {
        "ac":        any(w in q for w in ["ac ", " ac", "air condition", "air-condition", "thanda", "cool"]),
        "parking":   "parking" in q,
        "bridal":    "bridal" in q,
        "generator": any(w in q for w in ["generator", "genset", "bijli", "backup power"]),
        "decor":     any(w in q for w in ["decor", "decoration", "sajawat"]),
        "lawn":      any(w in q for w in ["lawn", "marquee", "outdoor", "open air"]),
        "weekday":   any(w in q for w in ["weekday", "week day", "discount", "cheaper day"]),
    }

def extract_min_rating(q: str):
    q = q.lower()
    m = re.search(r"rating\s*(?:above|over|>=|more than|atleast|at least)?\s*(\d(?:\.\d)?)", q)
    if m: return float(m.group(1))
    if any(w in q for w in ["top rated", "best rated", "highly rated", "4 star", "4.5"]): return 4.0
    return None

def detect_intent(q: str) -> str:
    q = normalize_query(q).lower()
    if any(w in q for w in ["cheap", "affordable", "budget", "sasta", "munasib", "low cost", "low price"]):
        return "budget"
    if any(w in q for w in ["luxury", "premium", "royal", "grand", "mehnga", "behtareen", "5 star"]):
        return "premium"
    if any(w in q for w in ["best", "top", "highest rated", "most popular", "recommend"]):
        return "top_rated"
    if any(w in q for w in ["weekday", "week day", "discount", "cheaper"]):
        return "weekday_deal"
    return "standard"

def extract_venue_type(q: str) -> str | None:
    q = q.lower()
    if any(w in q for w in ["lawn", "marquee", "outdoor", "open air"]): return "Marquee / Lawn"
    if any(w in q for w in ["hotel"]):                                   return "Hotel Banquet"
    if any(w in q for w in ["club", "garrison"]):                        return "Club / Garrison Venue"
    if any(w in q for w in ["banquet hall", "banquet"]):                 return "Banquet Hall"
    return None

def is_hall_question(q: str) -> bool:
    q = normalize_query(q)
    keywords = [
        "marriage", "wedding", "banquet", "hall", "venue", "event", "walima",
        "barat", "mehndi", "guests", "guest", "people", "capacity", "mutton",
        "beef", "chicken", "per head", "package", "booking", "decor", "catering",
        "johar", "dha", "gulberg", "model town", "garden town", "faisal town",
        "township", "wapda town", "bahria", "lahore", "price", "rate", "budget",
        "cheap", "affordable", "premium", "luxury", "shadi", "shaadi", "sasta",
        "mehnga", "qeemat", "keemat", "jagah", "jaga", "mehmaan", "banday",
        "lawn", "marquee", "parking", "generator", "bridal", "ac", "rating",
        "weekday", "discount", "raiwind", "cantt", "sabzazar", "marghzar",
        "allama iqbal", "iqbal town", "free", "muft",
    ]
    return any(k in q for k in keywords)

def detect_language(q: str) -> str:
    roman = ["shaadi", "shadi", "chahiye", "chaiye", "batao", "dikhao",
             "sasta", "mehnga", "qeemat", "keemat", "banday", "bande",
             "log", "mehmaan", "jagah", "jaga", "se kam", "tak", "acha",
             "achi", "bijli", "thanda", "walima", "barat", "mehndi",
             "muft", "bedone paise", "bina paise"]
    return "roman_urdu" if any(w in q.lower() for w in roman) else "english"


# ════════════════════════════════════════════════════════════
# 9. FILTER — HARD CONSTRAINTS
# ════════════════════════════════════════════════════════════

def apply_filters(q: str, df: pd.DataFrame, strict: bool = True):
    filt = df.copy()

    area       = extract_area(q, df)
    guests     = extract_guest_count(q)
    dish       = extract_dish(q)
    max_price  = extract_max_price(q)
    min_price  = extract_min_price(q)
    amenities  = extract_amenities(q)
    min_rating = extract_min_rating(q)
    venue_type = extract_venue_type(q)
    intent     = detect_intent(q)

    filters = {
        "area": area, "guests": guests, "dish": dish,
        "max_price": max_price, "min_price": min_price,
        "amenities": amenities, "min_rating": min_rating,
        "venue_type": venue_type, "intent": intent,
    }

    if area:
        mask = filt["r_area"].str.contains(
            re.escape(area.split()[0]), case=False, na=False
        )
        if mask.sum() > 0:
            filt = filt[mask]

    if guests:
        cap_mask = (
            (filt["r_capacity_sitting"] >= guests) &
            (filt["r_minimum_guests"]   <= guests)
        )
        if cap_mask.sum() > 0:
            filt = filt[cap_mask]

    if strict and max_price and max_price >= _CHEAP_THRESHOLD:
        if dish:
            col = f"r_one_dish_{dish}"
            price_mask = (filt[col] > 0) & (filt[col] <= max_price)
        else:
            price_mask = (
                ((filt["r_one_dish_chicken"] > 0) & (filt["r_one_dish_chicken"] <= max_price)) |
                ((filt["r_one_dish_beef"]    > 0) & (filt["r_one_dish_beef"]    <= max_price)) |
                ((filt["r_one_dish_mutton"]  > 0) & (filt["r_one_dish_mutton"]  <= max_price))
            )
        if price_mask.sum() > 0:
            filt = filt[price_mask]

    if min_price and dish:
        col = f"r_one_dish_{dish}"
        mask = filt[col] >= min_price
        if mask.sum() > 0:
            filt = filt[mask]

    if min_rating:
        mask = filt["r_rating"] >= min_rating
        if mask.sum() > 0:
            filt = filt[mask]

    if amenities["ac"]:
        mask = filt["r_is_air_conditioned"].str.lower() == "yes"
        if mask.sum() > 0: filt = filt[mask]
    if amenities["bridal"]:
        mask = filt["r_bridal_room"].str.lower() == "yes"
        if mask.sum() > 0: filt = filt[mask]
    if amenities["generator"]:
        mask = filt["r_generator_backup"].str.lower() == "yes"
        if mask.sum() > 0: filt = filt[mask]
    if amenities["decor"]:
        mask = filt["r_decoration_in_house"].str.lower() == "yes"
        if mask.sum() > 0: filt = filt[mask]
    if amenities["lawn"]:
        mask = filt["r_number_of_lawns"] > 0
        if mask.sum() > 0: filt = filt[mask]

    if venue_type:
        mask = filt["r_venue_type"].str.contains(
            venue_type.split("/")[0].strip(), case=False, na=False
        )
        if mask.sum() > 0: filt = filt[mask]

    return filt, filters


# ════════════════════════════════════════════════════════════
# 10. HYBRID RETRIEVAL  (BM25 + TF-IDF word + TF-IDF char)
# ════════════════════════════════════════════════════════════

def retrieve(q: str, candidate_df: pd.DataFrame,
             df_full: pd.DataFrame, docs,
             word_vec, word_mat, char_vec, char_mat, bm25,
             top_k: int = TOP_K):

    exp_q = normalize_query(q)
    candidate_idx = list(candidate_df.index) if not candidate_df.empty else list(df_full.index)

    tokens   = exp_q.lower().split()
    bm25_all = np.array(bm25.get_scores(tokens))
    bm25_scores = bm25_all[candidate_idx]
    if bm25_scores.max() > 0:
        bm25_scores = bm25_scores / bm25_scores.max()

    wq    = word_vec.transform([exp_q])
    w_all = cosine_similarity(word_mat[candidate_idx], wq).reshape(-1)

    cq    = char_vec.transform([exp_q])
    c_all = cosine_similarity(char_mat[candidate_idx], cq).reshape(-1)

    # 40% BM25 + 40% word-TF-IDF + 20% char-TF-IDF
    combined = 0.40 * bm25_scores + 0.40 * w_all + 0.20 * c_all

    filters = {
        "area":       extract_area(q, df_full),
        "guests":     extract_guest_count(q),
        "dish":       extract_dish(q),
        "max_price":  extract_max_price(q),
        "min_rating": extract_min_rating(q),
        "intent":     detect_intent(q),
        "amenities":  extract_amenities(q),
    }

    final_scores = []
    for local_i, row_idx in enumerate(candidate_idx):
        row   = df_full.loc[row_idx]
        score = float(combined[local_i])

        if filters["area"] and filters["area"].split()[0].lower() in row["r_area"].lower():
            score += 0.25

        g = filters["guests"]
        if g:
            if row["r_minimum_guests"] <= g <= row["r_capacity_sitting"]:
                score += 0.30
                center = (row["r_minimum_guests"] + row["r_capacity_sitting"]) / 2
                score += max(0, 0.10 - abs(center - g) / 5000)
            else:
                score -= 0.20

        dish = filters["dish"]
        mp   = filters["max_price"]
        if dish and mp and mp >= _CHEAP_THRESHOLD:
            p = row[f"r_one_dish_{dish}"]
            if p > 0:
                if p <= mp:       score += 0.30
                elif p <= mp*1.2: score += 0.05
                else:             score -= 0.25

        score += (row["r_rating"] - 4.0) * 0.08

        intent = filters["intent"]
        avg_p  = (row["r_one_dish_chicken"] + row["r_one_dish_beef"] + row["r_one_dish_mutton"]) / 3

        if intent == "budget":
            score += max(0, 0.20 - avg_p / 30000)
            if row["r_menu_price_tier"].lower() == "budget": score += 0.10

        elif intent == "premium":
            score += min(0.20, avg_p / 30000)
            if row["r_menu_price_tier"].lower() == "premium": score += 0.10

        elif intent == "top_rated":
            score += (row["r_rating"] - 3.8) * 0.15
            score += min(0.10, row["r_review_count"] / 5000)

        elif intent == "weekday_deal":
            score += row["r_weekday_discount_pct"] / 100 * 0.30

        am = filters["amenities"]
        if am["ac"]        and row["r_is_air_conditioned"]  == "Yes": score += 0.10
        if am["bridal"]    and row["r_bridal_room"]          == "Yes": score += 0.10
        if am["generator"] and row["r_generator_backup"]     == "Yes": score += 0.10
        if am["decor"]     and row["r_decoration_in_house"]  == "Yes": score += 0.10
        if am["lawn"]      and row["r_number_of_lawns"]  > 0:         score += 0.15

        final_scores.append(score)

    ranked = sorted(zip(candidate_idx, final_scores), key=lambda x: -x[1])[:top_k]
    result_df = df_full.loc[[i for i, _ in ranked]].copy()
    result_df["_score"] = [s for _, s in ranked]
    return result_df


# ════════════════════════════════════════════════════════════
# 11. BUILD STRUCTURED RECORD FOR LLM CONTEXT
# ════════════════════════════════════════════════════════════

def make_record(row) -> dict:
    phone_str = row["r_phone_1"]
    if row["r_phone_2"] and row["r_phone_2"] != "Not available":
        phone_str += f" / {row['r_phone_2']}"
    return {
        "name":               row["r_hall_name"],
        "area":               row["r_area"],
        "address":            row["r_full_address"],
        "category":           row["r_category"],
        "venue_type":         row["r_venue_type"],
        "rating":             round(float(row["r_rating"]), 1),
        "review_count":       int(row["r_review_count"]),
        "capacity_sitting":   int(row["r_capacity_sitting"]),
        "minimum_guests":     int(row["r_minimum_guests"]),
        "lawns":              int(row["r_number_of_lawns"]),
        "banquet_halls":      int(row["r_number_of_banquet_halls"]),
        "parking_spaces":     int(row["r_parking_capacity"]),
        "chicken_price":      int(row["r_one_dish_chicken"]),
        "beef_price":         int(row["r_one_dish_beef"]),
        "mutton_price":       int(row["r_one_dish_mutton"]),
        "weekday_discount":   f"{int(row['r_weekday_discount_pct'])}%",
        "weekday_chicken":    int(row["r_weekday_chicken_price"]),
        "weekend_chicken":    int(row["r_weekend_chicken_price"]),
        "peak_surcharge":     f"{int(row['r_peak_season_surcharge_pct'])}%",
        "gst":                f"{int(row['r_gst_rate_pct'])}%",
        "service_charge":     f"{int(row['r_service_charge_pct'])}%",
        "advance_booking":    f"{int(row['r_advance_booking_pct'])}% advance",
        "est_bill_300":       f"PKR {int(row['r_estimated_bill_300_guests']):,}",
        "price_range":        row["r_price_range"],
        "menu_price_tier":    row["r_menu_price_tier"],
        "air_conditioned":    row["r_is_air_conditioned"],
        "in_house_decor":     row["r_decoration_in_house"],
        "bridal_room":        row["r_bridal_room"],
        "generator_backup":   row["r_generator_backup"],
        "package_details":    row["r_package_details"],
        "description":        row["r_description"],
        "phone":              phone_str,
        "last_verified":      row["r_last_verified"],
        "score":              round(float(row["_score"]), 4),
    }


# ════════════════════════════════════════════════════════════
# 12. TEMPLATE FALLBACK  (used when Groq is unavailable)
# ════════════════════════════════════════════════════════════

def _amenity_icon(val: str) -> str:
    return "Yes" if str(val).lower() == "yes" else "No"

def fallback_answer(q: str, results, filters: dict, exact_count: int) -> str:
    lang    = detect_language(q)
    records = [make_record(row) for _, row in results.head(5).iterrows()]
    dish    = filters.get("dish")

    if lang == "roman_urdu":
        if exact_count > 0:
            intro = f"Bilkul! Aapki zaroorat ke mutabiq **{exact_count} halls** mile hain "
        else:
            intro = "Bilkul exact match nahi mila, lekin yeh nearest options hain:"
        footer = "\nKya aap aur sasta, ya aur premium, ya kisi specific area ka option chahte hain? "
        note   = "\n> *Ye rates estimate hain — final rates hall se confirm karen.*"
    else:
        if exact_count > 0:
            intro = f"Great news! Found **{exact_count} halls** matching your requirements. Here are the top picks:"
        else:
            intro = "No exact match found for your filters, but here are the closest alternatives:"
        footer = "\nWould you like to filter by cheaper options, premium halls, or a specific area?"
        note   = "\n> *Prices are estimates — please confirm final rates directly with the hall.*"

    lines = [intro, ""]

    for i, r in enumerate(records, 1):
        ac_icon    = _amenity_icon(r["air_conditioned"])
        brid_icon  = _amenity_icon(r["bridal_room"])
        gen_icon   = _amenity_icon(r["generator_backup"])
        decor_icon = _amenity_icon(r["in_house_decor"])

        if dish == "mutton":
            price_line = f"Mutton: **PKR {r['mutton_price']:,}/head**  |  Chicken: PKR {r['chicken_price']:,}  |  Beef: PKR {r['beef_price']:,}"
        elif dish == "beef":
            price_line = f"Beef: **PKR {r['beef_price']:,}/head**  |  Chicken: PKR {r['chicken_price']:,}  |  Mutton: PKR {r['mutton_price']:,}"
        else:
            price_line = f"Chicken: **PKR {r['chicken_price']:,}/head**  |  Beef: PKR {r['beef_price']:,}  |  Mutton: PKR {r['mutton_price']:,}"

        wd_line = ""
        if r.get("weekday_discount") and r["weekday_discount"] not in ("0%", ""):
            wd_line = f"\n   Weekday discount: **{r['weekday_discount']} off** → PKR {r['weekday_chicken']:,}/head"

        block = f"""**{i}. {r['name']}** ({r['area']}) Rating: {r['rating']} ({r['review_count']} reviews)
   Capacity: {r['minimum_guests']}–{r['capacity_sitting']} guests  |  {r['venue_type']}
   {price_line}{wd_line}
   AC: {ac_icon}  Decor: {decor_icon}  Bridal Room: {brid_icon}  Generator: {gen_icon}
   Est. bill (300 guests): {r['est_bill_300']}  |  Tier: {r['menu_price_tier']}
   Address: {r['address']}
   Phone: {r['phone']}"""

        lines.append(block)
        lines.append("")

    lines.append(note)
    lines.append(footer)
    return "\n".join(lines)


# ════════════════════════════════════════════════════════════
# 13. GROQ FINAL ANSWER  (with retry + fallback)
# ════════════════════════════════════════════════════════════

def generate_answer(q: str, results, filters: dict, exact_count: int,
                    client) -> str:
    """
    Generate a consultant-quality answer using Groq LLM.
    Falls back to template answer if Groq is unavailable.
    """
    import time

    records = [make_record(row) for _, row in results.iterrows()]
    lang    = detect_language(q)

    system = """
You are an expert, warm, and trusted Lahore marriage hall booking consultant.

PERSONALITY
- Friendly, conversational, feels like a knowledgeable local friend helping plan a wedding.
- Never robotic, never refuse. Always guide.
- Concise but detailed where it matters.

STRICT RULES
- ONLY answer questions about marriage halls, wedding venues, banquets, packages, prices, areas,
  capacity, amenities, catering, and related wedding topics.
- Use ONLY the provided retrieved records — never invent hall names, prices, addresses, or phones.
- ALWAYS include the full phone number exactly as given (starts with 0 for Pakistani numbers).
- If 0 exact matches, clearly say so, then show nearest alternatives.
- Always add: "Rates are estimates — confirm final pricing directly with the hall."
- If user writes in Roman Urdu, reply in warm Roman Urdu mixed with English.
- If user writes in English, reply in friendly professional English.

ANSWER FORMAT
- Use clean professional Markdown only.
- Do not use emojis or decorative symbols.
- Use a short level-2 heading at the top.
- Use one short introductory paragraph acknowledging the query.
- State how many matching halls were found, or explain that nearest alternatives are shown.
- For each hall, use a level-3 heading and concise bullet points.
- Show 3 to 5 halls maximum.
- For each hall include: area, rating with review count, capacity range, venue type, food prices, weekday deal if available, amenities, estimated bill for 300 guests, full address, phone number, and one sentence explaining why it fits.
- Use **bold** only for key labels and hall names.
- End with one helpful follow-up question.
- Always add this note exactly once: "Rates are estimates — confirm final pricing directly with the hall."
"""

    prompt = f"""
USER QUERY: {q}
LANGUAGE STYLE: {lang}

DETECTED FILTERS:
{json.dumps({k: v for k, v in filters.items() if v}, indent=2, ensure_ascii=False)}

EXACT MATCHES FOUND: {exact_count}

RETRIEVED RECORDS:
{json.dumps(records, indent=2, ensure_ascii=False)}

Write the final consultant response now.
"""

    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=CHAT_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user",   "content": prompt},
                ],
                temperature=0.30,
                max_tokens=2048,
            )
            return response.choices[0].message.content

        except Exception as e:
            err_str = str(e).lower()
            is_rate  = "rate_limit" in err_str or "429" in err_str or "too many" in err_str
            is_last  = attempt == 1

            if is_rate and not is_last:
                print("⏳ Groq rate limit hit — waiting 20s then retrying…")
                time.sleep(20)
                continue

            print(f"Groq unavailable ({type(e).__name__}), using fallback answer.")
            return fallback_answer(q, results, filters, exact_count)


# ════════════════════════════════════════════════════════════
# 14. MAIN ANSWER FUNCTION
# ════════════════════════════════════════════════════════════

def answer(q: str, df, docs, word_vec, word_mat, char_vec, char_mat, bm25,
           client) -> str:
    q = q.strip()
    if not q:
        return "Please ask a marriage hall related question."

    # ── Guard: off-topic ──────────────────────────────────
    if not is_hall_question(q):
        lang = detect_language(q)
        if lang == "roman_urdu":
            return ("Main aapka marriage hall assistant hoon  "
                    "Mujhse area, guests capacity, food package, "
                    "per-head price ya koi bhi hall related sawal poochh saktay hain!")
        return ("I'm your Lahore marriage hall assistant  "
                "Ask me about halls by area, guest capacity, food package, "
                "per-head price, amenities, or budget.")

    # ── Guard: free / ultra-cheap request ─────────────────
    is_cheap, flavour = is_free_or_ultra_cheap_request(q)
    if is_cheap:
        return humorous_free_response(q, flavour)

    # ── Strict filter first ───────────────────────────────
    strict_df, filters = apply_filters(q, df, strict=True)
    exact_count = len(strict_df)

    if exact_count > 0:
        search_space = strict_df
    else:
        relaxed_df, _ = apply_filters(q, df, strict=False)
        search_space = relaxed_df if len(relaxed_df) > 0 else df

    results = retrieve(q, search_space, df, docs,
                       word_vec, word_mat, char_vec, char_mat, bm25, TOP_K)

    intent = detect_intent(q)
    dish   = extract_dish(q)
    p_col  = f"r_one_dish_{dish}" if dish else "r_one_dish_chicken"

    if intent == "budget":
        results = results.sort_values([p_col, "_score"], ascending=[True, False])
    elif intent == "premium":
        results = results.sort_values([p_col, "_score"], ascending=[False, False])
    elif intent == "top_rated":
        results = results.sort_values(["r_rating", "_score"], ascending=[False, False])
    elif intent == "weekday_deal":
        results = results.sort_values(["r_weekday_discount_pct", "_score"], ascending=[False, False])
    else:
        results = results.sort_values("_score", ascending=False)

    return generate_answer(q, results.head(TOP_K), filters, exact_count, client)


# ════════════════════════════════════════════════════════════
# 15. BOOTSTRAP  (build or load, then save)
# ════════════════════════════════════════════════════════════

def bootstrap(data_path: str = DATA_PATH, state_dir: str = STATE_DIR,
              force_rebuild: bool = False):
    state = Path(state_dir)
    if not force_rebuild and (state / "halls.parquet").exists():
        return load_state(state_dir)

    df   = load_dataset(data_path)
    docs, wv, wm, cv, cm, bm = build_index(df)
    save_state(df, docs, wv, wm, cv, cm, bm, state_dir)
    return df, docs, wv, wm, cv, cm, bm


# ════════════════════════════════════════════════════════════
# 16. ENTRY POINT
# ════════════════════════════════════════════════════════════

if __name__ == "__main__":
    from groq import Groq

    print("=" * 60)
    print("  ELITE MARRIAGE HALL RAG  v4.0  (Groq Edition)")
    print("=" * 60)

    if not API_KEY:
        raise RuntimeError("GROQ_API_KEY not found. Check your .env file.")

    client = Groq(api_key=API_KEY)

    df, docs, wv, wm, cv, cm, bm = bootstrap(DATA_PATH, STATE_DIR, force_rebuild=False)

    tests = [
        "I need a marriage hall in Johar Town for 500 guests, mutton rate under 4000 per head",
        "Mujhe Johar Town me 500 logon ke liye shaadi hall chahiye, mutton rate 4000 se kam ho",
        "Show me air conditioned halls with bridal room and generator backup in DHA",
        "What are the cheapest chicken per head halls in Gulberg under 2500?",
        "Top rated premium halls in Model Town for 300 guests with in-house decoration",
        "Which halls give weekday discounts and what is the weekend vs weekday chicken price?",
        # Free / ultra-cheap guards
        "Do you have any free marriage halls in Lahore?",
        "Koi muft hall hai kya Lahore mein?",
        "Show me halls under PKR 500 per head",
        "Hall chahiye 800 rupees mein",
        # Off-topic guard
        "Who is Ronaldo?",
    ]

    for i, q in enumerate(tests, 1):
        print(f"\n{'═'*60}")
        print(f"TEST {i}: {q}")
        print("═" * 60)
        print(answer(q, df, docs, wv, wm, cv, cm, bm, client))

    print("\n\nChatbot ready. Type 'exit' to quit.\n")
    while True:
        user_q = input("You: ").strip()
        if user_q.lower() in ("exit", "quit", "stop", "bye"):
            print("Bot: Allah Hafiz! Wishing you a perfect wedding ")
            break
        try:
            print("\nBot:", answer(user_q, df, docs, wv, wm, cv, cm, bm, client), "\n")
        except Exception as e:
            print(f"\nBot: Sorry, something went wrong — {e}\n")
