using LMS.Models;
using LMS.Models.Enums;

namespace LMS.Models.Entities;

public class Enrollment : BaseEntity
{
    public int EnrollmentId { get; set; }

    public string StudentId { get; set; } = string.Empty;

    public int CourseId { get; set; }

    public EnrollmentStatus Status { get; set; }

    public double ProgressPercentage { get; set; }

    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    public DateTime? CompletedAt { get; set; }

    public ApplicationUser Student { get; set; } = null!;

    public Course Course { get; set; } = null!;

}
