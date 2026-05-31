# Generated for NUAI explicit officer perks & discounts backend.
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='OfficerPerksDiscount',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('company_name', models.CharField(max_length=255)),
                ('post_header', models.CharField(max_length=255)),
                ('category', models.CharField(blank=True, db_index=True, max_length=120)),
                ('custom_category', models.CharField(blank=True, max_length=160)),
                ('post_content', models.TextField(blank=True)),
                ('photo_urls', models.JSONField(blank=True, default=list)),
                ('links', models.JSONField(blank=True, default=list)),
                ('requirements', models.JSONField(blank=True, default=list)),
                ('start_date', models.CharField(blank=True, max_length=20)),
                ('end_date', models.CharField(blank=True, max_length=20)),
                ('all_day', models.BooleanField(default=True)),
                ('start_time', models.CharField(blank=True, max_length=20)),
                ('end_time', models.CharField(blank=True, max_length=20)),
                ('location', models.CharField(blank=True, max_length=255)),
                ('posted_on', models.CharField(blank=True, max_length=120)),
                ('status', models.CharField(db_index=True, default='active', max_length=40)),
                ('effective_status', models.CharField(db_index=True, default='active', max_length=40)),
                ('closed_reason', models.CharField(blank=True, max_length=120, null=True)),
                ('closed_by_system', models.BooleanField(default=False)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
                ('reopened_at', models.DateTimeField(blank=True, null=True)),
                ('author_uid', models.CharField(blank=True, max_length=160)),
                ('author_email', models.EmailField(blank=True, max_length=254)),
                ('author_name', models.CharField(blank=True, max_length=255)),
                ('author_role', models.CharField(blank=True, max_length=80)),
                ('extra_data', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'officer_perks_discounts', 'ordering': ['-created_at']},
        ),
    ]
