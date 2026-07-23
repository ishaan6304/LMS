using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Qna;

public class AskQuestionRequest
{
    [Required]
    public int CourseId { get; set; }

    //          optional - null means "about the whole course"          //
    public int? ChapterId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string QuestionText { get; set; } = string.Empty;
}
