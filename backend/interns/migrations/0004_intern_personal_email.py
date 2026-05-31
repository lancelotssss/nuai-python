# Generated for NUAI intern first-login requirement gate.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("interns", "0003_alter_intern_status_transitioning"),
    ]

    operations = [
        migrations.AddField(
            model_name="intern",
            name="personal_email",
            field=models.EmailField(blank=True, max_length=150, null=True),
        ),
    ]
