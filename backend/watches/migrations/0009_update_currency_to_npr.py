from django.db import migrations


def update_currency_to_rs(apps, schema_editor):
    Watch = apps.get_model('watches', 'Watch')
    Watch.objects.filter(currency='CHF').update(currency='Rs')


def reverse_currency(apps, schema_editor):
    Watch = apps.get_model('watches', 'Watch')
    Watch.objects.filter(currency='Rs').update(currency='CHF')


class Migration(migrations.Migration):

    dependencies = [
        ('watches', '0008_ingest_run'),
    ]

    operations = [
        migrations.RunPython(update_currency_to_rs, reverse_currency),
    ]
