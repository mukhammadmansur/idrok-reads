"""Idempotently seed the two subscription tiers the product sells."""

from django.core.management.base import BaseCommand

from core.models import SubscriptionPlan


PLANS = [
    {
        "slug": "oilaviy",
        "name": "Oilaviy",
        "price": 33000,
        "period": "/oy",
        "max_children": 1,
        "note": "Bitta farzand uchun. Barcha ertaklar, ilmiy va tarixiy "
        "kitoblar + Premium mavzular.",
        "featured": False,
        "order": 1,
    },
    {
        "slug": "premium-oila",
        "name": "Premium oila",
        "price": 119000,
        "period": "/oy",
        "max_children": None,  # unlimited children on one plan
        "note": "Bir nechta farzand — bitta tarif hammasi uchun. "
        "Premium kitoblar, pushti va arvoh olamlari, cheksiz profil.",
        "featured": True,
        "order": 2,
    },
]


class Command(BaseCommand):
    help = "Create or update the two IdrokReads subscription plans."

    def handle(self, *args, **options):
        for plan in PLANS:
            fields = dict(plan)
            slug = fields.pop("slug")
            SubscriptionPlan.objects.update_or_create(slug=slug, defaults=fields)
            self.stdout.write(f"[ok] {slug}: {plan['price']} UZS")
        self.stdout.write(self.style.SUCCESS("Subscription plans saved."))
