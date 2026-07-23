namespace LMS.Models.DTOs.Enrollments;

public class EnrolledStudentDto
{
    public int EnrollmentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public double CourseProgress { get; set; }
}