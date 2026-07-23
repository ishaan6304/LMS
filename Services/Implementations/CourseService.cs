using LMS.Data;
using LMS.Helpers;
using LMS.Models.Common;
using LMS.Models.DTOs.Courses;
using LMS.Models.Entities;
using LMS.Models.Enums;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace LMS.Services.Implementations;

public class CourseService : ICourseService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;

    public CourseService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _userManager = userManager;
    }

    //                               create course                               //

    public async Task<ApiResponse<CourseDto>> CreateCourseAsync(CreateCourseRequest request, string currentUserId, bool isAdmin)
    {
        var instructorId = currentUserId;

        if (isAdmin && !string.IsNullOrEmpty(request.InstructorId))
        {
            instructorId = request.InstructorId;
        }

        var instructor = await _context.Users.FirstOrDefaultAsync(u => u.Id == instructorId);

        if (instructor == null)
        {
            return new ApiResponse<CourseDto>
            {
                Success = false,
                Message = "Instructor not found."
            };
        }

        //          category must exist in the Categories table          //

        var categoryExists = await _context.Categories.AnyAsync(c => c.Name == request.Category);

        if (!categoryExists)
        {
            return new ApiResponse<CourseDto>
            {
                Success = false,
                Message = "Unknown category. Ask an admin to add it first."
            };
        }

        var course = new Course
        {
            Title = request.Title,
            Slug = SlugHelper.GenerateSlug(request.Title),
            ShortDescription = request.ShortDescription,
            Description = request.Description,
            ThumbnailUrl = request.ThumbnailUrl,
            Price = request.Price,
            DurationHours = request.DurationHours,
            Category = request.Category,
            Level = request.Level,
            Language = request.Language,
            InstructorId = instructorId,
            IsActive = true
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return new ApiResponse<CourseDto>
        {
            Success = true,
            Message = "Course created successfully.",
            Data = MapToCourseDto(course, instructor, 0)
        };
    }

    //                               get courses (admin/instructor, with search)                               //

    public async Task<ApiResponse<List<CourseDto>>> GetCoursesAsync(string currentUserId, bool isAdmin, string? search)
    {
        var query = _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Chapters)
            .AsQueryable();

        if (!isAdmin)
        {
            query = query.Where(c => c.InstructorId == currentUserId);
        }

        //          SEARCH: EF translates Contains() into SQL LIKE '%term%'          //

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c =>
                c.Title.Contains(search) ||
                c.Description.Contains(search) ||
                (c.ShortDescription != null && c.ShortDescription.Contains(search)));
        }

        var courses = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

        var courseDtos = new List<CourseDto>();

        foreach (var course in courses)
        {
            courseDtos.Add(MapToCourseDto(course, course.Instructor, course.Chapters.Count));
        }

        return new ApiResponse<List<CourseDto>>
        {
            Success = true,
            Message = "Courses loaded.",
            Data = courseDtos
        };
    }

    //                               get catalog (student browse, with search)                               //

    public async Task<ApiResponse<List<CatalogCourseDto>>> GetCatalogAsync(string studentId, string? search)
    {
        //          students only ever see ACTIVE (not soft-deleted) courses          //

        var query = _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Chapters)
            .Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(c =>
                c.Title.Contains(search) ||
                c.Description.Contains(search) ||
                (c.ShortDescription != null && c.ShortDescription.Contains(search)));
        }

        var courses = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();

        //          this student's enrollments: courseId -> status          //

        var myEnrollments = await _context.Enrollments
            .Where(e => e.StudentId == studentId)
            .ToDictionaryAsync(e => e.CourseId, e => e.Status);

        var catalog = new List<CatalogCourseDto>();

        foreach (var course in courses)
        {
            var hasEnrollment = myEnrollments.TryGetValue(course.CourseId, out var status);

            catalog.Add(new CatalogCourseDto
            {
                CourseId = course.CourseId,
                Title = course.Title,
                ShortDescription = course.ShortDescription,
                ThumbnailUrl = course.ThumbnailUrl,
                Category = course.Category,
                Level = course.Level.ToString(),
                Language = course.Language.ToString(),
                InstructorName = course.Instructor.FirstName + " " + course.Instructor.LastName,
                ChapterCount = course.Chapters.Count,
                EnrollmentStatus = hasEnrollment ? status.ToString() : null
            });
        }

        return new ApiResponse<List<CatalogCourseDto>>
        {
            Success = true,
            Message = "Catalog loaded.",
            Data = catalog
        };
    }

    //                               get course details                               //

    public async Task<ApiResponse<CourseDetailDto>> GetCourseDetailAsync(int courseId, string currentUserId, bool isAdmin)
    {
        var course = await _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Chapters)
            .ThenInclude(ch => ch.Contents)
            .FirstOrDefaultAsync(c => c.CourseId == courseId);

        if (course == null)
        {
            return new ApiResponse<CourseDetailDto>
            {
                Success = false,
                Message = "Course not found."
            };
        }

        var isOwner = course.InstructorId == currentUserId;

        //          AUDIT MODE: any logged-in user may view an ACTIVE course.          //
        //          Disabled courses stay visible only to admin and the owner.          //

        if (!isAdmin && !isOwner && !course.IsActive)
        {
            return new ApiResponse<CourseDetailDto>
            {
                Success = false,
                Message = "This course is currently disabled."
            };
        }

        //          this user's enrollment (null when auditing)          //

        var enrollment = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == currentUserId);

        //                               completed content ids for this user                               //

        var completedIds = await _context.ContentProgresses
            .Where(p => p.StudentId == currentUserId)
            .Select(p => p.ContentId)
            .ToListAsync();

        var detail = new CourseDetailDto
        {
            CourseId = course.CourseId,
            Title = course.Title,
            ShortDescription = course.ShortDescription,
            Description = course.Description,
            ThumbnailUrl = course.ThumbnailUrl,
            InstructorName = course.Instructor.FirstName + " " + course.Instructor.LastName,
            Category = course.Category,
            Level = course.Level.ToString(),
            Language = course.Language.ToString(),
            IsActive = course.IsActive,
            MyEnrollmentStatus = enrollment?.Status.ToString()
        };

        foreach (var chapter in course.Chapters.OrderBy(ch => ch.DisplayOrder))
        {
            var chapterDto = new ChapterDto
            {
                ChapterId = chapter.ChapterId,
                Title = chapter.Title,
                DisplayOrder = chapter.DisplayOrder
            };

            foreach (var content in chapter.Contents.OrderBy(co => co.DisplayOrder))
            {
                chapterDto.Contents.Add(new ChapterContentDto
                {
                    ChapterContentId = content.ChapterContentId,
                    Title = content.Title,
                    ContentType = content.ContentType.ToString(),
                    ContentUrl = content.ContentUrl,
                    DisplayOrder = content.DisplayOrder,
                    IsCompleted = completedIds.Contains(content.ChapterContentId)
                });
            }

            detail.Chapters.Add(chapterDto);
        }

        return new ApiResponse<CourseDetailDto>
        {
            Success = true,
            Message = "Course loaded.",
            Data = detail
        };
    }

    //                               add chapter                               //

    public async Task<ApiResponse<ChapterDto>> AddChapterAsync(int courseId, CreateChapterRequest request, string currentUserId, bool isAdmin)
    {
        var course = await _context.Courses
            .Include(c => c.Chapters)
            .FirstOrDefaultAsync(c => c.CourseId == courseId);

        if (course == null)
        {
            return new ApiResponse<ChapterDto>
            {
                Success = false,
                Message = "Course not found."
            };
        }

        if (!isAdmin && course.InstructorId != currentUserId)
        {
            return new ApiResponse<ChapterDto>
            {
                Success = false,
                Message = "You can only add chapters to your own courses."
            };
        }

        var chapter = new Chapter
        {
            CourseId = courseId,
            Title = request.Title,
            DisplayOrder = course.Chapters.Count + 1
        };

        _context.Chapters.Add(chapter);
        await _context.SaveChangesAsync();

        return new ApiResponse<ChapterDto>
        {
            Success = true,
            Message = "Chapter added successfully.",
            Data = new ChapterDto
            {
                ChapterId = chapter.ChapterId,
                Title = chapter.Title,
                DisplayOrder = chapter.DisplayOrder
            }
        };
    }

    //                               add chapter content                               //

    public async Task<ApiResponse<ChapterContentDto>> AddContentAsync(int chapterId, AddContentRequest request, string currentUserId, bool isAdmin)
    {
        var chapter = await _context.Chapters
            .Include(ch => ch.Course)
            .Include(ch => ch.Contents)
            .FirstOrDefaultAsync(ch => ch.ChapterId == chapterId);

        if (chapter == null)
        {
            return new ApiResponse<ChapterContentDto>
            {
                Success = false,
                Message = "Chapter not found."
            };
        }

        if (!isAdmin && chapter.Course.InstructorId != currentUserId)
        {
            return new ApiResponse<ChapterContentDto>
            {
                Success = false,
                Message = "You can only add content to your own courses."
            };
        }

        var content = new ChapterContent
        {
            ChapterId = chapterId,
            Title = request.Title,
            ContentType = request.ContentType,
            ContentUrl = request.ContentUrl,
            DisplayOrder = chapter.Contents.Count + 1
        };

        _context.ChapterContents.Add(content);
        await _context.SaveChangesAsync();

        return new ApiResponse<ChapterContentDto>
        {
            Success = true,
            Message = request.ContentType.ToString() + " added successfully.",
            Data = new ChapterContentDto
            {
                ChapterContentId = content.ChapterContentId,
                Title = content.Title,
                ContentType = content.ContentType.ToString(),
                ContentUrl = content.ContentUrl,
                DisplayOrder = content.DisplayOrder
            }
        };
    }

    //                               map course to dto                               //

    private static CourseDto MapToCourseDto(Course course, ApplicationUser instructor, int chapterCount)
    {
        return new CourseDto
        {
            CourseId = course.CourseId,
            Title = course.Title,
            ShortDescription = course.ShortDescription,
            ThumbnailUrl = course.ThumbnailUrl,
            Price = course.Price,
            DurationHours = course.DurationHours,
            Category = course.Category,
            Level = course.Level.ToString(),
            Language = course.Language.ToString(),
            InstructorName = instructor.FirstName + " " + instructor.LastName,
            ChapterCount = chapterCount,
            IsActive = course.IsActive
        };
    }

    //                               can manage course                               //

    private async Task<bool> CanManageCourseAsync(ClaimsPrincipal principal, Course course)
    {
        var user = await _userManager.GetUserAsync(principal);

        if (user == null) return false;
        if (await _userManager.IsInRoleAsync(user, "Admin")) return true;

        return course.InstructorId == user.Id;
    }

    //                               update course                               //

    public async Task<ApiResponse<string>> UpdateCourseAsync(ClaimsPrincipal principal, int courseId, UpdateCourseRequest request)
    {
        var course = await _context.Courses.FindAsync(courseId);

        if (course == null)
            return new ApiResponse<string> { Success = false, Message = "Course not found." };

        if (!await CanManageCourseAsync(principal, course))
            return new ApiResponse<string> { Success = false, Message = "You cannot edit this course." };

        //          category must exist in the Categories table          //

        var categoryExists = await _context.Categories.AnyAsync(c => c.Name == request.Category);

        if (!categoryExists)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Unknown category. Ask an admin to add it first."
            };
        }

        course.Title = request.Title;
        course.Description = request.Description;
        course.Category = request.Category;
        course.Level = request.Level;
        course.Language = request.Language;
        course.ThumbnailUrl = request.ThumbnailUrl;

        await _context.SaveChangesAsync();

        return new ApiResponse<string> { Success = true, Message = "Course updated." };
    }

    //                               delete course (SOFT DELETE)                               //

    public async Task<ApiResponse<string>> DeleteCourseAsync(ClaimsPrincipal principal, int courseId)
    {
        var course = await _context.Courses.FindAsync(courseId);

        if (course == null)
            return new ApiResponse<string> { Success = false, Message = "Course not found." };

        if (!await CanManageCourseAsync(principal, course))
            return new ApiResponse<string> { Success = false, Message = "You cannot delete this course." };

        //          soft delete: we DO NOT remove the row anymore.          //
        //          Chapters, contents, enrollments and progress all survive,          //
        //          so an admin can bring the course back exactly as it was.          //

        course.IsActive = false;
        course.DeletedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ApiResponse<string> { Success = true, Message = "Course disabled. An admin can re-enable it later." };
    }

    //                               enable / disable course (admin)                               //

    public async Task<ApiResponse<string>> SetCourseStatusAsync(int courseId, bool isActive)
    {
        var course = await _context.Courses.FindAsync(courseId);

        if (course == null)
            return new ApiResponse<string> { Success = false, Message = "Course not found." };

        course.IsActive = isActive;
        course.DeletedAt = isActive ? null : DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new ApiResponse<string>
        {
            Success = true,
            Message = isActive ? "Course enabled." : "Course disabled."
        };
    }

    //                               delete chapter                               //

    public async Task<ApiResponse<string>> DeleteChapterAsync(ClaimsPrincipal principal, int chapterId)
    {
        var chapter = await _context.Chapters
            .Include(ch => ch.Contents)
            .FirstOrDefaultAsync(ch => ch.ChapterId == chapterId);

        if (chapter == null)
            return new ApiResponse<string> { Success = false, Message = "Chapter not found." };

        var course = await _context.Courses.FindAsync(chapter.CourseId);

        if (course == null || !await CanManageCourseAsync(principal, course))
            return new ApiResponse<string> { Success = false, Message = "You cannot delete this chapter." };

        _context.Chapters.Remove(chapter);
        await _context.SaveChangesAsync();

        return new ApiResponse<string> { Success = true, Message = "Chapter deleted." };
    }

    //                               delete content                               //

    public async Task<ApiResponse<string>> DeleteContentAsync(ClaimsPrincipal principal, int contentId)
    {
        var content = await _context.ChapterContents.FindAsync(contentId);

        if (content == null)
            return new ApiResponse<string> { Success = false, Message = "Content not found." };

        var chapter = await _context.Chapters.FindAsync(content.ChapterId);
        var course = await _context.Courses.FindAsync(chapter!.CourseId);

        if (course == null || !await CanManageCourseAsync(principal, course))
            return new ApiResponse<string> { Success = false, Message = "You cannot delete this content." };

        _context.ChapterContents.Remove(content);
        await _context.SaveChangesAsync();

        return new ApiResponse<string> { Success = true, Message = "Content link deleted." };
    }
}