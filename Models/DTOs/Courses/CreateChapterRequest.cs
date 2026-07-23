using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Courses;

public class CreateChapterRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;
}
