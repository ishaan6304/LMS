using LMS.Models;

using LMS.Models.Enums;
namespace LMS.Models.Entities;

public class ChapterContent : BaseEntity
{
    public int ChapterContentId { get; set; }

    public int ChapterId { get; set; }

    public string Title { get; set; } = string.Empty;

    public ContentType ContentType { get; set; }

    public string ContentUrl { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public Chapter Chapter { get; set; } = null!;
}