namespace LMS.Models.DTOs.Qna;

//          one Q&A row - used by BOTH the student history          //
//          and the instructor received-questions list          //

public class QuestionDto
{
    public int QuestionId { get; set; }

    public int CourseId { get; set; }

    public string CourseTitle { get; set; } = string.Empty;

    //          null = question about the whole course          //
    public string? ChapterTitle { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public string QuestionText { get; set; } = string.Empty;

    public string? AnswerText { get; set; }

    public DateTime AskedAt { get; set; }

    public DateTime? AnsweredAt { get; set; }
}
