using LMS.Models.Common;
using LMS.Models.DTOs.Auth;
using LMS.Models.DTOs.Users;
using System.Security.Claims;

namespace LMS.Services.Interfaces;

public interface IAuthService
{

    Task<ApiResponse<string>> LoginAsync(LoginRequest request);

    Task<ApiResponse<UserDto>> GetMeAsync(ClaimsPrincipal principal);
    Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordRequest request);
    Task<ApiResponse<string>> UpdateProfileAsync(ClaimsPrincipal principal, UpdateProfileRequest request);
    Task<ApiResponse<string>> ChangePasswordAsync(ClaimsPrincipal principal, ChangePasswordRequest request);
    Task LogoutAsync();
}
