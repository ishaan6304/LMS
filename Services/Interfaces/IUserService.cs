using LMS.Models.Common;
using LMS.Models.DTOs.Users;

namespace LMS.Services.Interfaces;

public interface IUserService
{
    Task<ApiResponse<string>> CreateUserAsync(CreateUserRequest request);

    Task<ApiResponse<List<UserDto>>> GetUsersByRoleAsync(string role);
}
