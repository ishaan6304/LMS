namespace LMS.Models.DTOs.Enrollments;
public class EnrollmentRequestDto
{
    public int EnrollmentId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public string StudentEmail { get; set; } = string.Empty;

    public string CourseTitle { get; set; } = string.Empty;

    public DateTime RequestedOn { get; set; }
}