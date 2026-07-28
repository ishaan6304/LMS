namespace LMS.Models.Entities;

public class ContentProgress
{
    public int ContentProgressId { get; set; }
    public string StudentId { get; set; } = string.Empty;
    public int ContentId { get; set; }
    public DateTime? CompletedOn { get; set; }

    public int WatchedSeconds { get; set; }

    public int DurationSeconds { get; set; }
}