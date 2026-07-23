using LMS.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Courses;

public class AddContentRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public ContentType ContentType { get; set; }

    [Required]
    public string ContentUrl { get; set; } = string.Empty;
}
