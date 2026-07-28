namespace LMS.Models.DTOs.Courses;

public class ChapterContentDto
{
    public int ChapterContentId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public string ContentUrl { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public bool IsCompleted { get; set; }
    public int WatchedSeconds { get; set; }

    public int DurationSeconds { get; set; }
}
