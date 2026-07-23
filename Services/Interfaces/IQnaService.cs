using LMS.Models.Common;
using LMS.Models.DTOs.Qna;

namespace LMS.Services.Interfaces;

public interface IQnaService
{
    Task<ApiResponse<string>> AskQuestionAsync(string studentId, AskQuestionRequest request);

    Task<ApiResponse<List<QuestionDto>>> GetMyQuestionsAsync(string studentId);

    Task<ApiResponse<List<QuestionDto>>> GetReceivedQuestionsAsync(string currentUserId, bool isAdmin);

    Task<ApiResponse<string>> AnswerQuestionAsync(int questionId, string currentUserId, bool isAdmin, AnswerQuestionRequest request);
}
