from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("interns", "0002_alter_intern_table"),
    ]

    operations = [
        migrations.AlterField(
            model_name="intern",
            name="status",
            field=models.CharField(
                choices=[
                    ("active", "Active"),
                    ("transitioning", "Transitioning"),
                    ("deactivated", "Deactivated"),
                ],
                default="active",
                max_length=20,
            ),
        ),
    ]
