from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from accounts.models import ChildProfile
from content.models import Puzzle


class Progress(models.Model):
    """Best result a child has had on one puzzle (1 to 3 stars). Missing row = not played yet."""

    child = models.ForeignKey(ChildProfile, on_delete=models.CASCADE, related_name="progress")
    puzzle = models.ForeignKey(Puzzle, on_delete=models.CASCADE, related_name="progress")
    stars = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(3)])
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "progress"
        constraints = [models.UniqueConstraint(fields=["child", "puzzle"], name="one_result_per_child_puzzle")]

    def __str__(self) -> str:
        return f"{self.child.nickname} - {self.puzzle.slug}: {self.stars}★"
