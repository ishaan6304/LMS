using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Qna;

public class AskQuestionRequest
{
    [Required]
    public int CourseId { get; set; }
    public int? ChapterId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string QuestionText { get; set; } = string.Empty;
}
