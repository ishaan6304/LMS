using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Qna;

public class AnswerQuestionRequest
{
    [Required]
    [MaxLength(4000)]
    public string AnswerText { get; set; } = string.Empty;
}
