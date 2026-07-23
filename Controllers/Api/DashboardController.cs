using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LMS.Controllers.Api;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [Authorize(Roles = "Admin")]
    [HttpGet("admin")]
    public async Task<IActionResult> AdminStats()
        => Ok(await _dashboardService.GetAdminStatsAsync());

    [Authorize(Roles = "Instructor")]
    [HttpGet("instructor")]
    public async Task<IActionResult> InstructorStats()
        => Ok(await _dashboardService.GetInstructorStatsAsync(User));

    [Authorize(Roles = "Student")]
    [HttpGet("student")]
    public async Task<IActionResult> StudentStats()
        => Ok(await _dashboardService.GetStudentStatsAsync(User));
}