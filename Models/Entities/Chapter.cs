using LMS.Models;

namespace LMS.Models.Entities;

public class Chapter : BaseEntity
{
    public int ChapterId { get; set; }

    public int CourseId { get; set; }

    public string Title { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public string YoutubeUrl { get; set; } = string.Empty;

    public string? AssignmentUrl { get; set; }

    public Course Course { get; set; } = null!;

    public ICollection<ChapterContent> Contents { get; set; } = new List<ChapterContent>();
}
