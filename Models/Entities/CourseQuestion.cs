using LMS.Models;

namespace LMS.Models.Entities;

//          one question a student asked about a course          //
//          AnswerText stays null until the instructor replies          //

public class CourseQuestion : BaseEntity
{
    public int CourseQuestionId { get; set; }

    public int CourseId { get; set; }

    //          optional: which chapter the doubt is about          //
    public int? ChapterId { get; set; }

    public string StudentId { get; set; } = string.Empty;

    public string QuestionText { get; set; } = string.Empty;

    public string? AnswerText { get; set; }

    public DateTime AskedAt { get; set; } = DateTime.UtcNow;

    public DateTime? AnsweredAt { get; set; }

    public Course Course { get; set; } = null!;

    public Chapter? Chapter { get; set; }

    public ApplicationUser Student { get; set; } = null!;
}
