using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Enrollments;
public class RequestEnrollRequest
{
    [Required]
    public int CourseId { get; set; }
}