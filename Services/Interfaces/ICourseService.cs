using LMS.Models.Common;
using LMS.Models.DTOs.Courses;
using System.Security.Claims;

namespace LMS.Services.Interfaces;

public interface ICourseService
{
    Task<ApiResponse<CourseDto>> CreateCourseAsync(CreateCourseRequest request, string currentUserId, bool isAdmin);

    Task<ApiResponse<List<CourseDto>>> GetCoursesAsync(string currentUserId, bool isAdmin, string? search);

    Task<ApiResponse<List<CatalogCourseDto>>> GetCatalogAsync(string studentId, string? search);

    Task<ApiResponse<CourseDetailDto>> GetCourseDetailAsync(int courseId, string currentUserId, bool isAdmin);

    Task<ApiResponse<ChapterDto>> AddChapterAsync(int courseId, CreateChapterRequest request, string currentUserId, bool isAdmin);

    Task<ApiResponse<ChapterContentDto>> AddContentAsync(int chapterId, AddContentRequest request, string currentUserId, bool isAdmin);
    Task<ApiResponse<string>> UpdateCourseAsync(ClaimsPrincipal principal, int courseId, UpdateCourseRequest request);
    Task<ApiResponse<string>> DeleteCourseAsync(ClaimsPrincipal principal, int courseId);
    Task<ApiResponse<string>> SetCourseStatusAsync(int courseId, bool isActive);
    Task<ApiResponse<string>> DeleteChapterAsync(ClaimsPrincipal principal, int chapterId);
    Task<ApiResponse<string>> DeleteContentAsync(ClaimsPrincipal principal, int contentId);
}