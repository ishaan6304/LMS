using LMS.Models.DTOs.Qna;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LMS.Controllers.Api;

[ApiController]
[Route("api/qna")]
public class QnaController : ControllerBase
{
    private readonly IQnaService _qnaService;

    public QnaController(IQnaService qnaService)
    {
        _qnaService = qnaService;
    }

    //                               helper values                               //

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    private bool IsAdmin => User.IsInRole("Admin");

    //                               ask question (student)                               //

    [Authorize(Roles = "Student")]
    [HttpPost]
    public async Task<IActionResult> AskQuestion([FromBody] AskQuestionRequest request)
    {
        var result = await _qnaService.AskQuestionAsync(CurrentUserId, request);

        return Ok(result);
    }

    //                               my questions (student history)                               //

    [Authorize(Roles = "Student")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyQuestions()
    {
        var result = await _qnaService.GetMyQuestionsAsync(CurrentUserId);

        return Ok(result);
    }

    //                               received questions (instructor/admin)                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpGet("received")]
    public async Task<IActionResult> GetReceivedQuestions()
    {
        var result = await _qnaService.GetReceivedQuestionsAsync(CurrentUserId, IsAdmin);

        return Ok(result);
    }

    //                               answer a question (instructor/admin)                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpPost("{questionId:int}/answer")]
    public async Task<IActionResult> AnswerQuestion(int questionId, [FromBody] AnswerQuestionRequest request)
    {
        var result = await _qnaService.AnswerQuestionAsync(questionId, CurrentUserId, IsAdmin, request);

        return Ok(result);
    }
}
