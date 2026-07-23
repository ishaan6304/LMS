using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Enrollments;

public class AssignCourseRequest
{
    [Required]
    public string StudentId { get; set; } = string.Empty;

    [Required]
    public int CourseId { get; set; }
}
