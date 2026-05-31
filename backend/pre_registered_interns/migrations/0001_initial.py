from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="PreRegisteredIntern",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("student_id", models.CharField(max_length=50, unique=True)),
                ("full_name", models.CharField(max_length=255)),
                ("gender", models.CharField(blank=True, max_length=50, null=True)),
                ("nu_email", models.EmailField(max_length=150, unique=True)),
                ("course", models.CharField(blank=True, max_length=150, null=True)),
                ("course_full_name", models.CharField(blank=True, max_length=255, null=True)),
                ("school_program_code", models.CharField(blank=True, max_length=100, null=True)),
                ("school_program_full_name", models.CharField(blank=True, max_length=255, null=True)),
                ("role", models.CharField(choices=[("intern", "Intern")], default="intern", max_length=30)),
                ("status", models.CharField(choices=[("pre-registered", "Pre-Registered"), ("claimed", "Claimed"), ("deactivated", "Deactivated")], default="pre-registered", max_length=30)),
                ("claimed", models.BooleanField(default=False)),
                ("claimed_at", models.DateTimeField(blank=True, null=True)),
                ("claimed_by_email", models.EmailField(blank=True, max_length=150, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "pre_registered_interns_table",
                "ordering": ["-created_at"],
            },
        ),
    ]
