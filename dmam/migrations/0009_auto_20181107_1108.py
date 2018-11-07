# Generated by Django 2.0 on 2018-11-07 11:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dmam', '0008_dmagisinfo'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='dmagisinfo',
            name='polygonpath',
        ),
        migrations.AddField(
            model_name='dmagisinfo',
            name='geodata',
            field=models.TextField(blank=True, null=True),
        ),
    ]
