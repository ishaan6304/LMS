using LMS.Data;
using LMS.Models.Common;
using LMS.Models.DTOs.Progress;
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
        if (user == null) return Unauthorized();

        var existing = await _context.ContentProgresses
            .FirstOrDefaultAsync(p => p.StudentId == user.Id && p.ContentId == contentId);

        bool isCompleted;

        if (existing != null)
        {
            if (existing.CompletedOn != null)
            {
                existing.CompletedOn = null;
                isCompleted = false;
            }
            else
            {
                existing.CompletedOn = DateTime.UtcNow;
                isCompleted = true;
            }
        }
        else
        {
            existing = new ContentProgress
            {
                StudentId = user.Id,
                ContentId = contentId,
                CompletedOn = DateTime.UtcNow
            };
            _context.ContentProgresses.Add(existing);
            isCompleted = true;
        }

        await _context.SaveChangesAsync();

        int coursePercent = await ComputeCoursePercentAsync(user.Id, contentId);

        return Ok(new ApiResponse<ToggleProgressResponse>
        {
            Success = true,
            Message = isCompleted ? "Marked as completed." : "Marked as not completed.",
            Data = new ToggleProgressResponse
            {
                IsCompleted = isCompleted,
                CoursePercent = coursePercent
            }
        });
    }

    //                               watch time update                               //

    [Authorize(Roles = "Student")]
    [HttpPost("content/{contentId}/watch")]
    public async Task<IActionResult> Watch(int contentId, [FromBody] WatchTimeRequest dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null) return Unauthorized();

        var existing = await _context.ContentProgresses
            .FirstOrDefaultAsync(p => p.StudentId == user.Id && p.ContentId == contentId);

        if (existing == null)
        {
            existing = new ContentProgress
            {
                StudentId = user.Id,
                ContentId = contentId,
                WatchedSeconds = dto.WatchedSeconds,
                DurationSeconds = dto.DurationSeconds,
                CompletedOn = (dto.DurationSeconds > 0 && dto.WatchedSeconds >= dto.DurationSeconds) ? DateTime.UtcNow : null
            };
            _context.ContentProgresses.Add(existing);
        }
        else
        {
            existing.WatchedSeconds = Math.Max(existing.WatchedSeconds, dto.WatchedSeconds);
            existing.DurationSeconds = dto.DurationSeconds;

            if (existing.CompletedOn == null && dto.DurationSeconds > 0 && existing.WatchedSeconds >= dto.DurationSeconds)
            {
                existing.CompletedOn = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();

        int contentPercent = dto.DurationSeconds > 0
            ? (int)Math.Min(100, Math.Round((double)existing.WatchedSeconds * 100.0 / dto.DurationSeconds))
            : 0;

        bool isCompleted = existing.CompletedOn != null;
        int coursePercent = await ComputeCoursePercentAsync(user.Id, contentId);

        return Ok(new ApiResponse<WatchTimeResponse>
        {
            Success = true,
            Message = "Watch time updated.",
            Data = new WatchTimeResponse
            {
                ContentPercent = contentPercent,
                IsCompleted = isCompleted,
                CoursePercent = coursePercent
            }
        });
    }

    //                               helpers                               //

    private async Task<int> ComputeCoursePercentAsync(string studentId, int contentId)
    {
        var chapterContent = await _context.ChapterContents
            .Include(cc => cc.Chapter)
            .FirstOrDefaultAsync(cc => cc.ChapterContentId == contentId);

        if (chapterContent == null) return 0;

        var courseId = chapterContent.Chapter.CourseId;

        var allContentIds = await _context.ChapterContents
            .Where(cc => cc.Chapter.CourseId == courseId)
            .Select(cc => cc.ChapterContentId)
            .ToListAsync();

        if (allContentIds.Count == 0) return 0;

        var progressRows = await _context.ContentProgresses
            .Where(p => p.StudentId == studentId && allContentIds.Contains(p.ContentId))
            .ToListAsync();

        double doneFraction = 0;

        foreach (var id in allContentIds)
        {
            var row = progressRows.FirstOrDefault(p => p.ContentId == id);
            if (row == null) continue;

            if (row.CompletedOn != null)
            {
                doneFraction += 1.0;
            }
            else if (row.DurationSeconds > 0)
            {
                doneFraction += Math.Min(1.0, (double)row.WatchedSeconds / row.DurationSeconds);
            }
        }

        return (int)Math.Round(doneFraction * 100.0 / allContentIds.Count);
    }
}