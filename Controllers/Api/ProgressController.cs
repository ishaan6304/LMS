using LMS.Data;
using LMS.Models.Common;
using LMS.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LMS.Controllers.Api;

[ApiController]
[Route("api/progress")]
public class ProgressController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public ProgressController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    //                               toggle content complete                               //

    [Authorize(Roles = "Student")]
    [HttpPost("content/{contentId}/toggle")]
    public async Task<IActionResult> Toggle(int contentId)
    {
        var user = await _userManager.GetUserAsync(User);

        var existing = await _context.ContentProgresses
            .FirstOrDefaultAsync(p => p.StudentId == user!.Id && p.ContentId == contentId);

        if (existing != null)
        {
            _context.ContentProgresses.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new ApiResponse<string> { Success = true, Message = "Marked as not completed." });
        }

        _context.ContentProgresses.Add(new ContentProgress
        {
            StudentId = user!.Id,
            ContentId = contentId,
            CompletedOn = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new ApiResponse<string> { Success = true, Message = "Marked as completed." });
    }
}