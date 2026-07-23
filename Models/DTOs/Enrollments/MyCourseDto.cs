namespace LMS.Models.DTOs.Enrollments;

public class MyCourseDto
{
    public int CourseId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string? ThumbnailUrl { get; set; }

    public string InstructorName { get; set; } = string.Empty;

    public string Status { get; set; } = string.Empty;

    public double ProgressPercentage { get; set; }

    public int ChapterCount { get; set; }
}
