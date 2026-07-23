namespace LMS.Models.DTOs.Courses;

public class CourseDto
{
    public int CourseId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string? ThumbnailUrl { get; set; }

    public decimal Price { get; set; }

    public int DurationHours { get; set; }

    public string Category { get; set; } = string.Empty;

    public string Level { get; set; } = string.Empty;

    public string Language { get; set; } = string.Empty;

    public string InstructorName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public int ChapterCount { get; set; }
}
