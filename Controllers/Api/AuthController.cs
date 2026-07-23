using LMS.Models.DTOs.Auth;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Antiforgery;

namespace LMS.Controllers.Api;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }
    //       csrf  token
    [HttpGet("csrf-token")]
    public IActionResult GetCsrfToken([FromServices] IAntiforgery antiforgery)
    {
        var tokens = antiforgery.GetAndStoreTokens(HttpContext);

        return Ok(new { success = true, data = new { token = tokens.RequestToken } });
    }


    //    mail
    [HttpGet("test-mail")]
    public async Task<IActionResult> TestMail([FromServices] IEmailService emailService)
    {
        await emailService.SendAsync("ishaanmohammed509@gmail.com", "LMS test", "<b>It works!</b>");
        return Ok("sent");
    }


    //                               login                               //

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);

        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }

    //                               get current user                               //

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var result = await _authService.GetMeAsync(User);

        if (!result.Success)
        {
            return Unauthorized(result);
        }

        return Ok(result);
    }

    //                               logout                               //

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _authService.LogoutAsync();

        return Ok(new { success = true, message = "Logged out." });
    }

    //        forgot passs

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    => Ok(await _authService.ForgotPasswordAsync(request));

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var result = await _authService.ResetPasswordAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    //            update profile

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
    {
        var result = await _authService.UpdateProfileAsync(User, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // update  password
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        var result = await _authService.ChangePasswordAsync(User, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
