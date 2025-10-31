import json
import os
from functools import lru_cache


class DistanceProvider:
    def getDistanceKm(self, from_city: str, to_city: str) -> int:  # pragma: no cover
        raise NotImplementedError


class OfflineMatrixProvider(DistanceProvider):
    def __init__(self, matrix_path: str | None = None) -> None:
        self.matrix_path = matrix_path or os.path.join(
            os.path.dirname(__file__), "offline_matrix.json"
        )

    @lru_cache(maxsize=1)
    def _load(self) -> dict:
        with open(self.matrix_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def getDistanceKm(self, from_city: str, to_city: str) -> int:
        data = self._load()
        frm = data.get(from_city)
        if frm and to_city in frm:
            return int(frm[to_city])
        # Try symmetric
        rev = data.get(to_city)
        if rev and from_city in rev:
            return int(rev[from_city])
        raise ValueError(f"Distance not found for {from_city} -> {to_city}")


