# Generated by Django 2.0 on 2019-05-28 16:37

import django.contrib.gis.db.models.fields
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ggis', '0004_fenceshape_geomjson'),
    ]

    operations = [
        migrations.AddField(
            model_name='fenceshape',
            name='geomdata',
            field=django.contrib.gis.db.models.fields.GeometryField(blank=True, null=True, srid=0),
        ),
    ]
