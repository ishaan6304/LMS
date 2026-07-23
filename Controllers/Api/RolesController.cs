using LMS.Models.Common;
using LMS.Models.DTOs.Roles;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LMS.Controllers.Api;

[ApiController]
[Route("api/roles")]
[Authorize(Roles = "Admin")]
public class RolesController : ControllerBase
{
    //          roles live in the AspNetRoles table,          //
    //          so we use Identity's RoleManager (no service needed)          //

    private readonly RoleManager<IdentityRole> _roleManager;

    public RolesController(RoleManager<IdentityRole> roleManager)
    {
        _roleManager = roleManager;
    }

    //                               list roles                               //

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleManager.Roles
            .OrderBy(r => r.Name)
            .Select(r => r.Name ?? "")
            .ToListAsync();

        return Ok(new ApiResponse<List<string>>
        {
            Success = true,
            Message = "Roles loaded.",
            Data = roles
        });
    }

    //                               create role                               //

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
    {
        var name = request.Name.Trim();

        if (name == "")
        {
            return Ok(new ApiResponse<string>
            {
                Success = false,
                Message = "Role name cannot be empty."
            });
        }

        if (await _roleManager.RoleExistsAsync(name))
        {
            return Ok(new ApiResponse<string>
            {
                Success = false,
                Message = "This role already exists."
            });
        }

        var result = await _roleManager.CreateAsync(new IdentityRole(name));

        if (!result.Succeeded)
        {
            return Ok(new ApiResponse<string>
            {
                Success = false,
                Message = "Role creation failed.",
                Errors = result.Errors.Select(e => e.Description).ToList()
            });
        }

        return Ok(new ApiResponse<string>
        {
            Success = true,
            Message = "Role '" + name + "' created. Note: new roles have no dashboard yet - those users land on their profile page after login."
        });
    }
}
