namespace LMS.Models.DTOs.Dashboard;

public class InstructorDashboardDto
{
    public int TotalCourses { get; set; }
    public int TotalStudentsEnrolled { get; set; }
    public List<CourseStatDto> CourseStats { get; set; } = new();
}

public class CourseStatDto
{
    public int CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int StudentCount { get; set; }
}