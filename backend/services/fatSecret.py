import aiohttp
import base64
from rapidfuzz import fuzz
import time

CLIENT_ID = "e00a107665fa42c68eb4ddd9dfe31469"
CLIENT_SECRET = "d781e7bf2d8547408b0c6112d3a805b4"

_token = None
_token_expiration = 0
_session = None

async def get_session():
    global _session
    if _session is None or _session.closed:
        _session = aiohttp.ClientSession()
    return _session

async def get_token():
    global _token
    global _token_expiration
    if (
        _token is not None
        and time.time() < _token_expiration
    ):
        return _token
    auth = base64.b64encode(
        f"{CLIENT_ID}:{CLIENT_SECRET}".encode()
    ).decode()
    headers = {
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/x-www-form-urlencoded"
    }
    data = {
        "grant_type": "client_credentials",
        "scope": "basic"
    }
    session = await get_session()
    async with session.post(
        "https://oauth.fatsecret.com/connect/token",
        headers=headers,
        data=data
    ) as response:
        result = await response.json()
        _token = result["access_token"]
        _token_expiration = (
            time.time()
            + result["expires_in"]
            - 60
        )
        return _token
        
async def search_food(name: str):
    token = await get_token()
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "method": "foods.search",
        "search_expression": name,
        "format": "json"
    }
    session = await get_session()
    async with session.get(
        "https://platform.fatsecret.com/rest/server.api",
        headers=headers,
        params=params
    ) as response:
        result = await response.json()
        foods = result["foods"]["food"]
        if not foods:
            return None
        if isinstance(foods, dict):
            foods = [foods]
        return foods
        
async def get_food(food_id: str):
    token = await get_token()
    headers = {
        "Authorization": f"Bearer {token}"
    }
    params = {
        "method": "food.get.v4",
        "food_id": food_id,
        "format": "json"
    }
    session = await get_session()
    async with session.get(
        "https://platform.fatsecret.com/rest/server.api",
        headers=headers,
        params=params
    ) as response:
        return await response.json()
        
def rank_foods(search_name: str, foods: list):
    for food in foods:
        score = fuzz.token_set_ratio(
            search_name.lower(),
            food["food_name"].lower()
        )
        if food["food_type"] == "Generic":
            score += 5

        food["score"] = score
    return sorted(
        foods,
        key=lambda x: x["score"],
        reverse=True
    )
        
async def get_food_by_name(name: str):
    foods = await search_food(name)
    if not foods:
        return None
    foods = rank_foods(name, foods)[:5]
    for best in foods:
        food = await get_food(best["food_id"])
        servings = food["food"]["servings"]["serving"]
        if isinstance(servings, dict):
            servings = [servings]
        for serving in servings:
            amount = serving.get("metric_serving_amount")
            if (
                serving.get("metric_serving_unit") == "g"
                and amount is not None
                and abs(float(amount) - 100) < 0.01
            ):
                return {
                    "food_id": best["food_id"],
                    "food_name": food["food"]["food_name"],
                    "serving": serving
                }
        gram_servings = [
            s for s in servings
            if (
                s.get("metric_serving_unit") == "g"
                and s.get("metric_serving_amount") is not None
            )
        ]
        if gram_servings:

            closest = min(
                gram_servings,
                key=lambda s: abs(float(s["metric_serving_amount"]) - 100)
            )

            return {
                "food_id": best["food_id"],
                "food_name": food["food"]["food_name"],
                "serving": closest
            }
    return None
