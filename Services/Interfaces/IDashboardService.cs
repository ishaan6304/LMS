using System.Security.Claims;
using LMS.Models.Common;
using LMS.Models.DTOs.Dashboard;

namespace LMS.Services.Interfaces;

public interface IDashboardService
{
    Task<ApiResponse<AdminDashboardDto>> GetAdminStatsAsync();
    Task<ApiResponse<InstructorDashboardDto>> GetInstructorStatsAsync(ClaimsPrincipal principal);
    Task<ApiResponse<StudentDashboardDto>> GetStudentStatsAsync(ClaimsPrincipal principal);
}