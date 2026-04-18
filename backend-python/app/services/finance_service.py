import numpy as np
from scipy.stats import pearsonr


SECTOR_BASE = {
    "Energy": 0.0004, "IT": 0.0008, "Finance": 0.0003, "FMCG": 0.0002,
    "Healthcare": 0.0005, "Metals": 0.0006, "Auto": 0.0004,
    "Pharma": 0.0005, "Realty": 0.0003, "Infra": 0.0003,
    "Technology": 0.0008, "Consumer Discretionary": 0.0004,
}


# def simulate_returns(ticker: str, sector: str) -> np.ndarray:
#     np.random.seed(abs(hash(ticker)) % (2 ** 32))
#     base = SECTOR_BASE.get(sector, 0.0004)
#     sector_factor = np.random.normal(base, 0.018, 252)
#     stock_noise = np.random.normal(0, 0.006, 252)
#     return 0.7 * sector_factor + 0.3 * stock_noise


def compute_correlation_matrix(returns_dict: dict):
    tickers = list(returns_dict.keys())
    matrix = {}
    for t in tickers:
        matrix[t] = {}
        for t2 in tickers:
            if t == t2:
                matrix[t][t2] = 1.0
            else:
                r, _ = pearsonr(returns_dict[t], returns_dict[t2])
                matrix[t][t2] = round(float(r), 4)
    return matrix, tickers


def average_pairwise_correlation(returns_dict: dict) -> float:
    tickers = list(returns_dict.keys())
    n = len(tickers)
    if n < 2:
        return 0.0
    total, count = 0.0, 0
    for i in range(n):
        for j in range(i + 1, n):
            r, _ = pearsonr(returns_dict[tickers[i]], returns_dict[tickers[j]])
            total += r
            count += 1
    return total / count


def sector_diversity_bonus(holdings: list) -> float:
    sector_counts = {}
    for h in holdings:
        s = h["sector"]
        sector_counts[s] = sector_counts.get(s, 0) + 1
    total = sum(sector_counts.values())
    probs = [c / total for c in sector_counts.values()]
    n = len(probs)
    if n == 1:
        return 0.5
    entropy = -sum(p * np.log(p) for p in probs if p > 0)
    max_entropy = np.log(n)
    normalized = entropy / max_entropy
    return 0.7 + normalized * 0.5


def concentration_penalty(holdings: list) -> float:
    total_value = sum(h["value"] for h in holdings)
    weights = [h["value"] / total_value for h in holdings]
    hhi = sum(w ** 2 for w in weights)
    n = len(weights)
    min_hhi = 1 / n
    normalized_hhi = (hhi - min_hhi) / (1 - min_hhi + 1e-9)
    return normalized_hhi


def compute_diversification_score(holdings: list, returns_dict: dict) -> float:
    avg_corr = average_pairwise_correlation(returns_dict)
    corr_score = (1 - avg_corr) * 100

    bonus = sector_diversity_bonus(holdings)
    sector_score = ((bonus - 0.7) / 0.5) * 100

    penalty = concentration_penalty(holdings)
    conc_score = (1 - penalty) * 100

    final = 0.5 * corr_score + 0.3 * sector_score + 0.2 * conc_score
    return round(max(0, min(100, final)), 1)


def sector_breakdown(holdings: list) -> list:
    totals = {}
    for h in holdings:
        totals[h["sector"]] = totals.get(h["sector"], 0) + h["value"]
    grand = sum(totals.values())
    return [
        {"sector": s, "value": round(v, 2), "pct": round(v / grand * 100, 1)}
        for s, v in totals.items()
    ]


def compute_leaderboard(holdings: list) -> list:
    total_value = sum(h["value"] for h in holdings)
    rows = []
    for h in holdings:
        roi = (h["current_price"] - h["avg_buy_price"]) / h["avg_buy_price"] * 100
        gain = (h["current_price"] - h["avg_buy_price"]) * h["quantity"]
        rows.append({
            "ticker": h["ticker"],
            "sector": h["sector"],
            "roi": round(roi, 2),
            "gain": round(gain, 2),
            "value": round(h["value"], 2),
            "weight": round(h["value"] / total_value * 100, 1),
            "current_price": h["current_price"],
            "avg_buy_price": h["avg_buy_price"],
            "quantity": h["quantity"],
        })
    rows.sort(key=lambda x: x["roi"], reverse=True)
    for i, r in enumerate(rows):
        r["rank"] = i + 1
    return rows
