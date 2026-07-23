using LMS.Models.DTOs.Courses;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LMS.Controllers.Api;

[ApiController]
[Route("api/chapters")]
public class ChapterController : ControllerBase
{
    private readonly ICourseService _courseService;

    public ChapterController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    //                               add video or assignment                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpPost("{id}/contents")]
    public async Task<IActionResult> AddContent(int id, AddContentRequest request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        var isAdmin = User.IsInRole("Admin");

        var result = await _courseService.AddContentAsync(id, request, currentUserId, isAdmin);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    //    edit  CHAPTER

    [Authorize(Roles = "Admin,Instructor")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteChapter(int id)
    {
        var result = await _courseService.DeleteChapterAsync(User, id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin,Instructor")]
    [HttpDelete("contents/{contentId}")]
    public async Task<IActionResult> DeleteContent(int contentId)
    {
        var result = await _courseService.DeleteContentAsync(User, contentId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
