using LMS.Models.Enums;
using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Courses;

public class UpdateCourseRequest
{
    [Required]
    public string Title { get; set; } = string.Empty;

    public string? ShortDescription { get; set; }

    [Required]
    public string Description { get; set; } = string.Empty;

    public string? ThumbnailUrl { get; set; }

    public decimal Price { get; set; }

    public int DurationHours { get; set; }

    //          category is a string now - must match a row in the Categories table          //
    [Required]
    public string Category { get; set; } = string.Empty;

    public CourseLevel Level { get; set; }

    public CourseLanguage Language { get; set; }
}
