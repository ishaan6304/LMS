using LMS.Models.Common;
using LMS.Models.DTOs.Users;
using LMS.Models.Entities;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace LMS.Services.Implementations;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IEmailService _emailService;

    public UserService(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, IEmailService emailService)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _emailService = emailService;
    }

    //                               create user                               //

    public async Task<ApiResponse<string>> CreateUserAsync(CreateUserRequest request)
    {
        //          roles are dynamic now - any role in the AspNetRoles table          //
        //          is allowed, except Admin (there is only one admin)          //

        if (request.Role == "Admin")
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "You cannot create another admin."
            };
        }

        if (!await _roleManager.RoleExistsAsync(request.Role))
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Unknown role. Create it first in Manage Roles."
            };
        }

        var existingUser = await _userManager.FindByEmailAsync(request.Email);

        if (existingUser != null)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "A user with this email already exists."
            };
        }

        var user = new ApplicationUser
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            UserName = request.Email,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Errors = result.Errors.Select(x => x.Description).ToList(),
                Message = "User creation failed."
            };
        }

        await _userManager.AddToRoleAsync(user, request.Role);

        //                               welcome email                               //

        try
        {
            await _emailService.SendAsync(
                request.Email,
                "Your LMS account is ready 🎓",
                $"<h3>Welcome, {request.FirstName}!</h3>" +
                $"<p>The admin created your <b>{request.Role}</b> account.</p>" +
                $"<p><b>Email:</b> {request.Email}<br/><b>Password:</b> {request.Password}</p>" +
                $"<p><a href='http://localhost:5202'>Login here</a></p>");
        }
        catch (Exception)
        {

        }

        return new ApiResponse<string>
        {
            Success = true,
            Message = request.Role + " created successfully."
        };
    }

    //                               get users by role                               //

    public async Task<ApiResponse<List<UserDto>>> GetUsersByRoleAsync(string role)
    {
        //          dynamic check against the AspNetRoles table          //

        if (!await _roleManager.RoleExistsAsync(role))
        {
            return new ApiResponse<List<UserDto>>
            {
                Success = false,
                Message = "Unknown role."
            };
        }

        var users = await _userManager.GetUsersInRoleAsync(role);

        var userDtos = new List<UserDto>();

        foreach (var user in users.OrderBy(u => u.FirstName))
        {
            userDtos.Add(new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? "",
                Role = role
            });
        }

        return new ApiResponse<List<UserDto>>
        {
            Success = true,
            Message = "Users loaded.",
            Data = userDtos
        };
    }
}
