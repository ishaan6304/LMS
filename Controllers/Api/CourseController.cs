using LMS.Models.DTOs.Courses;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LMS.Controllers.Api;

[ApiController]
[Route("api/courses")]
public class CourseController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CourseController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    //                               helper values                               //

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    private bool IsAdmin => User.IsInRole("Admin");

    //                               get courses (with optional ?search=)                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpGet]
    public async Task<IActionResult> GetCourses([FromQuery] string? search)
    {
        var result = await _courseService.GetCoursesAsync(CurrentUserId, IsAdmin, search);

        return Ok(result);
    }

    //                               get catalog (student browse, with optional ?search=)                               //

    [Authorize(Roles = "Student")]
    [HttpGet("catalog")]
    public async Task<IActionResult> GetCatalog([FromQuery] string? search)
    {
        var result = await _courseService.GetCatalogAsync(CurrentUserId, search);

        return Ok(result);
    }

    //                               create course                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpPost]
    public async Task<IActionResult> CreateCourse(CreateCourseRequest request)
    {
        var result = await _courseService.CreateCourseAsync(request, CurrentUserId, IsAdmin);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    //                               get course details                               //
    [Authorize]
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetCourse(int id)
    {
        var result = await _courseService.GetCourseDetailAsync(id, CurrentUserId, IsAdmin);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    //                               add chapter                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpPost("{id:int}/chapters")]
    public async Task<IActionResult> AddChapter(int id, CreateChapterRequest request)
    {
        var result = await _courseService.AddChapterAsync(id, request, CurrentUserId, IsAdmin);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    //                               edit course                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCourse(int id, UpdateCourseRequest request)
    {
        var result = await _courseService.UpdateCourseAsync(User, id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    //                               delete course (soft delete = disable)                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCourse(int id)
    {
        var result = await _courseService.DeleteCourseAsync(User, id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    //                               enable / disable course (ADMIN ONLY)                               //

    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}/status")]
    public async Task<IActionResult> SetCourseStatus(int id, SetCourseStatusRequest request)
    {
        var result = await _courseService.SetCourseStatusAsync(id, request.IsActive);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}