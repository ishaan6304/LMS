namespace LMS.Models.DTOs.Progress;

public class ToggleProgressResponse
{
    public bool IsCompleted { get; set; }

    public int CoursePercent { get; set; }
}
