namespace LMS.Models.DTOs.Courses;

public class CourseDetailDto
{
    public int CourseId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? ThumbnailUrl { get; set; }

    public string InstructorName { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Level { get; set; } = string.Empty;

    public string Language { get; set; } = string.Empty;

    public bool IsActive { get; set; }
    public string? MyEnrollmentStatus { get; set; }

    public List<ChapterDto> Chapters { get; set; } = new();
}