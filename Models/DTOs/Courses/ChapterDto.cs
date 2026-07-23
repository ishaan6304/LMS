namespace LMS.Models.DTOs.Courses;

public class ChapterDto
{
    public int ChapterId { get; set; }

    public string Title { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public List<ChapterContentDto> Contents { get; set; } = new();
}
