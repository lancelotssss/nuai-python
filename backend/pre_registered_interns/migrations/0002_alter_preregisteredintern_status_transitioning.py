from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("pre_registered_interns", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="preregisteredintern",
            name="status",
            field=models.CharField(
                choices=[
                    ("pre-registered", "Pre-Registered"),
                    ("transitioning", "Transitioning"),
                    ("claimed", "Claimed"),
                    ("deactivated", "Deactivated"),
                ],
                default="pre-registered",
                max_length=30,
            ),
        ),
    ]
