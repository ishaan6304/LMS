using LMS.Models.DTOs.Enrollments;
using LMS.Models.Entities;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LMS.Controllers.Api;

[ApiController]
[Route("api/enrollments")]
public class EnrollmentController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;
    private readonly UserManager<ApplicationUser> _userManager;
    //                               helper values                               //

    private string CurrentUserId => User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

    private bool IsAdmin => User.IsInRole("Admin");


    public EnrollmentController(IEnrollmentService enrollmentService,UserManager<ApplicationUser> userManager)
    {
        _enrollmentService = enrollmentService;
        _userManager = userManager;
    }

    //                               assign course                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpPost]
    public async Task<IActionResult> AssignCourse(AssignCourseRequest request)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        var isAdmin = User.IsInRole("Admin");

        var result = await _enrollmentService.AssignCourseAsync(request, currentUserId, isAdmin);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    //                               get my courses (student)                               //

    [Authorize(Roles = "Student")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMyCourses()
    {
        var studentId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "";

        var result = await _enrollmentService.GetMyCoursesAsync(studentId);

        return Ok(result);
    }

    [Authorize(Roles = "Admin,Instructor")]
    [HttpGet("course/{courseId}")]
    public async Task<IActionResult> GetCourseEnrollments(int courseId)
    {
        var user = await _userManager.GetUserAsync(User);
        var result = await _enrollmentService.GetCourseEnrollmentsAsync(courseId, user!.Id, User.IsInRole("Admin"));
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [Authorize(Roles = "Admin,Instructor")]
    [HttpDelete("{enrollmentId}")]
    public async Task<IActionResult> Unenroll(int enrollmentId)
    {
        var user = await _userManager.GetUserAsync(User);
        var result = await _enrollmentService.UnenrollAsync(enrollmentId, user!.Id, User.IsInRole("Admin"));
        return result.Success ? Ok(result) : BadRequest(result);
    }
    //                               request enrollment (student)                               //

    [Authorize(Roles = "Student")]
    [HttpPost("request")]
    public async Task<IActionResult> RequestEnrollment(RequestEnrollRequest request)
    {
        var result = await _enrollmentService.RequestEnrollmentAsync(CurrentUserId, request.CourseId);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    //                               pending requests (instructor/admin)                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests()
    {
        var result = await _enrollmentService.GetEnrollmentRequestsAsync(CurrentUserId, IsAdmin);

        return Ok(result);
    }

    //                               approve request                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpPost("requests/{enrollmentId:int}/approve")]
    public async Task<IActionResult> ApproveRequest(int enrollmentId)
    {
        var result = await _enrollmentService.ApproveRequestAsync(enrollmentId, CurrentUserId, IsAdmin);

        return result.Success ? Ok(result) : BadRequest(result);
    }

    //                               reject request                               //

    [Authorize(Roles = "Admin,Instructor")]
    [HttpPost("requests/{enrollmentId:int}/reject")]
    public async Task<IActionResult> RejectRequest(int enrollmentId)
    {
        var result = await _enrollmentService.RejectRequestAsync(enrollmentId, CurrentUserId, IsAdmin);

        return result.Success ? Ok(result) : BadRequest(result);
    }
}
