using LMS.Models.Common;
using LMS.Models.DTOs.Auth;
using LMS.Models.DTOs.Users;
using LMS.Models.Entities;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using System.Net;
using System.Security.Claims;

namespace LMS.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IEmailService _emailService;

    public AuthService(UserManager<ApplicationUser> userManager, SignInManager<ApplicationUser> signInManager,IEmailService emailService)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _emailService = emailService;
    }

   

    //                               login                               //

    public async Task<ApiResponse<string>> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Invalid email or password."
            };
        }

        var result = await _signInManager.PasswordSignInAsync(user, request.Password, false, false);

        if (!result.Succeeded)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Invalid email or password."
            };
        }

        var roles = await _userManager.GetRolesAsync(user);

        return new ApiResponse<string>
        {
            Success = true,
            Message = "Login successful.",
            Data = roles.FirstOrDefault()
        };
    }

    //                               get current user                               //

    public async Task<ApiResponse<UserDto>> GetMeAsync(ClaimsPrincipal principal)
    {
        var user = await _userManager.GetUserAsync(principal);

        if (user == null)
        {
            return new ApiResponse<UserDto>
            {
                Success = false,
                Message = "User not found."
            };
        }

        var roles = await _userManager.GetRolesAsync(user);

        var userDto = new UserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email ?? "",
            Role = roles.FirstOrDefault() ?? ""
        };

        return new ApiResponse<UserDto>
        {
            Success = true,
            Message = "User loaded.",
            Data = userDto
        };
    }

    //                               logout                               //

    public async Task LogoutAsync()
    {
        await _signInManager.SignOutAsync();
    }

    ///                     forgot pass

    public async Task<ApiResponse<string>> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user != null)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var link = "http://localhost:5202/reset-password.html"
                     + "?email=" + WebUtility.UrlEncode(request.Email)
                     + "&token=" + WebUtility.UrlEncode(token);

            await _emailService.SendAsync(request.Email, "Reset your LMS password",
                $"<p>Click below to reset your password:</p><p><a href='{link}'>Reset password</a></p>");
        }

        return new ApiResponse<string> { Success = true, Message = "If that email exists, a reset link has been sent." };
    }

    //                               reset password                               //

    public async Task<ApiResponse<string>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
            return new ApiResponse<string> { Success = false, Message = "Invalid reset request." };

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

        if (!result.Succeeded)
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Reset failed.",
                Errors = result.Errors.Select(e => e.Description).ToList()
            };

        return new ApiResponse<string> { Success = true, Message = "Password changed. You can login now." };
    }

    //                               update profile                               //

    public async Task<ApiResponse<string>> UpdateProfileAsync(ClaimsPrincipal principal, UpdateProfileRequest request)
    {
        var user = await _userManager.GetUserAsync(principal);

        if (user == null)
            return new ApiResponse<string> { Success = false, Message = "User not found." };

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;

        await _userManager.UpdateAsync(user);

        return new ApiResponse<string> { Success = true, Message = "Profile updated." };
    }

    //                               change password                               //

    public async Task<ApiResponse<string>> ChangePasswordAsync(ClaimsPrincipal principal, ChangePasswordRequest request)
    {
        var user = await _userManager.GetUserAsync(principal);

        if (user == null)
            return new ApiResponse<string> { Success = false, Message = "User not found." };

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

        if (!result.Succeeded)
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Password change failed.",
                Errors = result.Errors.Select(e => e.Description).ToList()
            };

        return new ApiResponse<string> { Success = true, Message = "Password changed." };
    }
}
