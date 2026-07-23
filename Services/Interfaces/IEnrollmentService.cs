using LMS.Models.Common;
using LMS.Models.DTOs.Enrollments;

namespace LMS.Services.Interfaces;

public interface IEnrollmentService
{
    Task<ApiResponse<string>> AssignCourseAsync(AssignCourseRequest request, string currentUserId, bool isAdmin);
    Task<ApiResponse<List<EnrolledStudentDto>>> GetCourseEnrollmentsAsync(int courseId, string currentUserId, bool isAdmin);
    Task<ApiResponse<string>> UnenrollAsync(int enrollmentId, string currentUserId, bool isAdmin);
    Task<ApiResponse<List<MyCourseDto>>> GetMyCoursesAsync(string studentId);
    Task<ApiResponse<string>> RequestEnrollmentAsync(string studentId, int courseId);
    Task<ApiResponse<List<EnrollmentRequestDto>>> GetEnrollmentRequestsAsync(string currentUserId, bool isAdmin);
    Task<ApiResponse<string>> ApproveRequestAsync(int enrollmentId, string currentUserId, bool isAdmin);
    Task<ApiResponse<string>> RejectRequestAsync(int enrollmentId, string currentUserId, bool isAdmin);
}