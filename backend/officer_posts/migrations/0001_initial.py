# Generated for NUAI explicit officer posts backend.
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name='OfficerPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('post_header', models.CharField(max_length=255)),
                ('post_content', models.TextField(blank=True)),
                ('links', models.JSONField(blank=True, default=list)),
                ('photo_urls', models.JSONField(blank=True, default=list)),
                ('status', models.CharField(db_index=True, default='open', max_length=40)),
                ('effective_status', models.CharField(db_index=True, default='open', max_length=40)),
                ('author_uid', models.CharField(blank=True, max_length=160)),
                ('author_email', models.EmailField(blank=True, max_length=254)),
                ('author_name', models.CharField(blank=True, max_length=255)),
                ('author_role', models.CharField(blank=True, max_length=80)),
                ('author_photo_url', models.TextField(blank=True)),
                ('extra_data', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={'db_table': 'officer_posts', 'ordering': ['-created_at']},
        ),
    ]
