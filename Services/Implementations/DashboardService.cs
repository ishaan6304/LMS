using System.Security.Claims;
using LMS.Data;
using LMS.Models.Common;
using LMS.Models.DTOs.Dashboard;
using LMS.Models.Entities;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LMS.Services.Implementations;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public DashboardService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    //                               admin stats                               //

    public async Task<ApiResponse<AdminDashboardDto>> GetAdminStatsAsync()
    {
        var students = await _userManager.GetUsersInRoleAsync("Student");
        var instructors = await _userManager.GetUsersInRoleAsync("Instructor");
        var totalCourses = await _context.Courses.CountAsync();

        return new ApiResponse<AdminDashboardDto>
        {
            Success = true,
            Message = "Admin stats loaded.",
            Data = new AdminDashboardDto
            {
                TotalStudents = students.Count,
                TotalInstructors = instructors.Count,
                TotalCourses = totalCourses
            }
        };
    }

    //                               instructor stats                               //

    public async Task<ApiResponse<InstructorDashboardDto>> GetInstructorStatsAsync(ClaimsPrincipal principal)
    {
        var user = await _userManager.GetUserAsync(principal);

        if (user == null)
            return new ApiResponse<InstructorDashboardDto> { Success = false, Message = "User not found." };

        var courseStats = await _context.Courses
            .Where(c => c.InstructorId == user.Id)
            .Select(c => new CourseStatDto
            {
                CourseId = c.CourseId,
                Title = c.Title,
                StudentCount = _context.Enrollments.Count(e => e.CourseId == c.CourseId)
            })
            .ToListAsync();

        return new ApiResponse<InstructorDashboardDto>
        {
            Success = true,
            Message = "Instructor stats loaded.",
            Data = new InstructorDashboardDto
            {
                TotalCourses = courseStats.Count,
                TotalStudentsEnrolled = courseStats.Sum(c => c.StudentCount),
                CourseStats = courseStats
            }
        };
    }

    //                               student stats                               //

    public async Task<ApiResponse<StudentDashboardDto>> GetStudentStatsAsync(ClaimsPrincipal principal)
    {
        var user = await _userManager.GetUserAsync(principal);

        if (user == null)
            return new ApiResponse<StudentDashboardDto> { Success = false, Message = "User not found." };

        var enrolled = await _context.Enrollments.CountAsync(e => e.StudentId == user.Id);

        return new ApiResponse<StudentDashboardDto>
        {
            Success = true,
            Message = "Student stats loaded.",
            Data = new StudentDashboardDto { EnrolledCourses = enrolled }
        };
    }
}