"""Export Northfield's demo data and price tables from pricewright-api for the prototype.

Run it with pricewright-api's environment, from this repository's root:

    uv run --project ../pricewright-api python prototype/tools/export_demo.py ../pricewright-api

It seeds the demo on pricewright-api's in-memory fakes, as its tests do, and prices every product
with the real engine, so the prototype shows exactly what the API would. Quantities only change a
price at a volume bracket, so each product gets one price per tier and bracket, not per quantity.
"""

from __future__ import annotations

import asyncio
import json
import subprocess
import sys
from datetime import UTC, date, datetime, time
from decimal import Decimal
from pathlib import Path
from typing import Any

AS_OF = date(2026, 10, 19)
OUT = Path("prototype/data/demo.json")
GOLDEN = Path("tests/fixtures/engine-prices.json")


def main(api: Path) -> None:
    sys.path.insert(0, str(api.resolve()))
    data = asyncio.run(export(api))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    golden = data.pop("golden")
    OUT.write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    GOLDEN.write_text(json.dumps(golden, separators=(",", ":")) + "\n", encoding="utf-8", newline="\n")
    print(f"{GOLDEN}: {len(golden)} quotes priced by the engine")
    print(f"{OUT}: {len(data['products'])} products, {len(data['quotes'])} quotes")


def money(value: Any) -> str:
    return f"{value.amount:.2f}" if value.amount == value.amount.quantize(Decimal("0.01")) else str(value.amount)


async def export(api: Path) -> dict[str, Any]:
    from pricewright.demo.seed import DEFAULT_SEED, seed_demo
    from pricewright.domain.pricing import LineRequest, price_quote
    from pricewright.domain.pricing_rules import RuleKind
    from tests.fakes import FakePasswordHasher, FakeUnitOfWork, InMemoryDatabase

    database = InMemoryDatabase()
    await seed_demo(
        unit_of_work=lambda: FakeUnitOfWork(database),
        hasher=FakePasswordHasher(),
        as_of=AS_OF,
        seed=DEFAULT_SEED,
    )
    tenant = next(t for t in database.tenants.values() if t.name == "Northfield Supply")
    settings = tenant.settings
    at = datetime.combine(AS_OF, time(12), tzinfo=UTC)
    mine = lambda rows: [r for r in rows if r.tenant_id == tenant.id]  # noqa: E731

    people = {u.id: u for u in mine(database.users.values())}
    accounts = {a.id: a for a in mine(database.service_accounts.values())}
    categories = {c.id: c.name for c in mine(database.product_categories.values())}
    customers = sorted(mine(database.customers.values()), key=lambda c: c.account_number)
    products = sorted(mine(database.products.values()), key=lambda p: p.sku)
    rules = mine(database.pricing_rules.values())

    def actor(value: Any) -> str:
        if value is None:
            return ""
        if not hasattr(value, "id"):  # a bare user id, as decided_by is
            return people[value].full_name if value in people else "System"
        if value.id in people:
            return people[value.id].full_name
        if value.id in accounts:
            return accounts[value.id].name
        return "System"

    def step(adjustment: Any) -> dict[str, Any]:
        return {
            "stage": str(adjustment.stage),
            "label": adjustment.label,
            "rate": None if adjustment.rate is None else str(adjustment.rate),
            "unit_price": str(adjustment.unit_price.amount),
        }

    breakpoints = sorted(
        {Decimal(1)}
        | {
            bracket.min_quantity
            for rule in rules
            if rule.kind is RuleKind.VOLUME_TIER and rule.is_effective(at)
            for bracket in rule.brackets
        }
    )
    by_tier = {}
    for customer in customers:
        by_tier.setdefault(str(customer.tier), customer)

    def price_table(product: Any) -> dict[str, list[dict[str, Any]]]:
        table: dict[str, list[dict[str, Any]]] = {}
        for tier, customer in by_tier.items():
            rows: list[dict[str, Any]] = []
            for quantity in breakpoints:
                line = price_quote(
                    customer, [LineRequest(product, quantity)], settings=settings, rules=rules, at=at
                ).lines[0]
                row = {
                    "from": str(quantity),
                    "steps": [step(a) for a in line.breakdown.steps],
                    "net_unit_price": str(line.breakdown.net_unit_price.amount),
                    "below_margin_floor": line.below_margin_floor,
                }
                if not rows or rows[-1]["steps"] != row["steps"]:
                    rows.append(row)
            table[tier] = rows
        return table

    quotes = sorted(
        mine(database.quotes.values()), key=lambda q: (q.created_at, q.revision), reverse=True
    )

    def quote(q: Any) -> dict[str, Any]:
        totals = q.totals
        return {
            "id": str(q.id),
            "number": q.number if q.revision == 1 else f"{q.number}-R{q.revision}",
            "customer_id": str(q.customer_id),
            "status": str(q.status),
            "created_by": actor(q.created_by),
            "created_at": q.created_at.isoformat(),
            "status_changed_at": None if q.status_changed_at is None else q.status_changed_at.isoformat(),
            "valid_until": q.valid_until.isoformat(),
            "list_subtotal": money(totals.list_subtotal),
            "net_subtotal": money(totals.net_subtotal),
            "tax": money(totals.tax),
            "total": money(totals.total),
            "notes": q.notes,
            "lines": [
                {
                    "sku": line.sku,
                    "name": line.product_name,
                    "unit": str(line.unit),
                    "quantity": str(line.quantity),
                    "list_unit_price": str(line.pricing.breakdown.list_unit_price.amount),
                    "net_unit_price": str(line.pricing.breakdown.net_unit_price.amount),
                    "net_total": money(line.pricing.net_total),
                    "below_margin_floor": line.pricing.below_margin_floor,
                    "steps": [step(a) for a in line.pricing.breakdown.steps],
                }
                for line in q.lines
            ],
            "approvals": [
                {
                    "status": str(a.status),
                    "requested_by": actor(a.requested_by),
                    "requested_at": a.requested_at.isoformat(),
                    "reasons": [str(r) for r in a.reasons],
                    "discount": str(a.discount),
                    "decided_by": actor(a.decided_by),
                    "comment": a.comment,
                }
                for a in q.approvals
            ],
        }

    task_card = [("FST-0063", 60), ("OFP-0036", 12), ("SAF-0936", 48), ("JAN-0979", 20), ("SAF-0829", 100)]
    by_sku = {p.sku: p for p in products}
    sample = [products[i] for i in range(0, len(products), 7)] + [by_sku[s] for s, _ in task_card]
    quantities = [1, 9, 10, 12, 24, 25, 39, 40, 48, 49, 50, 60, 100, 137]

    def golden_quote(customer: Any, lines: list[tuple[Any, int]]) -> dict[str, Any]:
        priced = price_quote(
            customer,
            [LineRequest(product, Decimal(qty)) for product, qty in lines],
            settings=settings,
            rules=rules,
            at=at,
        )
        return {
            "tier": str(customer.tier),
            "lines": [
                {
                    "sku": product.sku,
                    "quantity": qty,
                    "net_unit_price": str(line.breakdown.net_unit_price.amount),
                    "list_total": money(line.list_total),
                    "net_total": money(line.net_total),
                }
                for (product, qty), line in zip(lines, priced.lines, strict=True)
            ],
            "list_subtotal": money(priced.list_subtotal),
            "net_subtotal": money(priced.net_subtotal),
            "tax": money(priced.tax),
            "total": money(priced.total),
            "discount": str(priced.discount),
            "requires_approval": priced.requires_approval,
        }

    golden = [
        golden_quote(customer, [(product, qty)])
        for customer in by_tier.values()
        for product in sample
        for qty in quantities
    ]
    stonegate = next(c for c in customers if c.name == "Stonegate Storage Centers LLC")
    golden.append(golden_quote(stonegate, [(by_sku[s], q) for s, q in task_card]))
    for offset, customer in enumerate(by_tier.values()):
        chosen = [(sample[(offset * 5 + i * 3) % len(sample)], quantities[i]) for i in range(6)]
        golden.append(golden_quote(customer, chosen))

    commit = subprocess.run(
        ["git", "-C", str(api), "describe", "--tags", "--always", "--dirty"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()
    return {
        "source": {"release": commit, "seed": DEFAULT_SEED, "as_of": AS_OF.isoformat()},
        "tenant": {
            "name": tenant.name,
            "currency": settings.currency,
            "tax_rate": str(settings.tax_rate),
            "approval_threshold": str(settings.approval_threshold),
            "quote_prefix": settings.quote_prefix,
            "quote_validity_days": settings.quote_validity_days,
        },
        "people": [
            {"id": str(u.id), "name": u.full_name, "email": u.email, "role": str(u.role)}
            for u in people.values()
        ],
        "customers": [
            {
                "id": str(c.id),
                "account_number": c.account_number,
                "name": c.name,
                "tier": str(c.tier),
                "payment_terms_days": c.payment_terms_days,
                "email": c.email,
                "is_active": c.is_active,
            }
            for c in customers
        ],
        "products": [
            {
                "id": str(p.id),
                "sku": p.sku,
                "name": p.name,
                "category": categories.get(p.category_id, ""),
                "unit": str(p.unit),
                "list_price": str(p.list_price.amount),
                "unit_cost": str(p.unit_cost.amount),
                "is_active": p.is_active,
                "prices": price_table(p),
            }
            for p in products
        ],
        "quotes": [quote(q) for q in quotes],
        "golden": golden,
    }


if __name__ == "__main__":
    main(Path(sys.argv[1]))
