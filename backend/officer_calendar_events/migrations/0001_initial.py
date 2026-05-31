# Generated for NUAI explicit officer calendar events backend.
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='OfficerCalendarEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True)),
                ('event_date', models.CharField(blank=True, db_index=True, max_length=20)),
                ('end_date', models.CharField(blank=True, max_length=20)),
                ('all_day', models.BooleanField(default=True)),
                ('start_time', models.CharField(blank=True, max_length=20)),
                ('end_time', models.CharField(blank=True, max_length=20)),
                ('location', models.CharField(blank=True, max_length=255)),
                ('category', models.CharField(blank=True, db_index=True, max_length=120)),
                ('custom_category', models.CharField(blank=True, max_length=160)),
                ('audience', models.JSONField(blank=True, default=list)),
                ('status', models.CharField(db_index=True, default='active', max_length=40)),
                ('cover_image_url', models.TextField(blank=True)),
                ('contact_name', models.CharField(blank=True, max_length=255)),
                ('contact_email', models.EmailField(blank=True, max_length=254)),
                ('tags', models.JSONField(blank=True, default=list)),
                ('posted_on', models.CharField(blank=True, max_length=120)),
                ('created_by_uid', models.CharField(blank=True, max_length=160)),
                ('created_by_name', models.CharField(blank=True, max_length=255)),
                ('created_by_email', models.EmailField(blank=True, max_length=254)),
                ('updated_by_uid', models.CharField(blank=True, max_length=160)),
                ('updated_by_name', models.CharField(blank=True, max_length=255)),
                ('updated_by_email', models.EmailField(blank=True, max_length=254)),
                ('extra_data', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'officer_calendar_events', 'ordering': ['-created_at']},
        ),
    ]
