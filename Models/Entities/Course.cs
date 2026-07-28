using LMS.Models;
using LMS.Models.Enums;
namespace LMS.Models.Entities;

public class Course : BaseEntity
{
    public int CourseId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? ThumbnailUrl { get; set; }

    public decimal Price { get; set; }

    public int DurationHours { get; set; }

    public string InstructorId { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    public ApplicationUser Instructor { get; set; } = null!;
    public string Category { get; set; } = string.Empty;

    public CourseLevel Level { get; set; }

    public CourseLanguage Language { get; set; }

    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}
