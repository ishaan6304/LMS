using LMS.Data;
using LMS.Models.Common;
using LMS.Models.DTOs.Enrollments;
using LMS.Models.Entities;
using LMS.Models.Enums;
using LMS.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LMS.Services.Implementations;

public class EnrollmentService : IEnrollmentService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;

    public EnrollmentService(ApplicationDbContext context, UserManager<ApplicationUser> userManager, IEmailService emailService)
    {
        _context = context;
        _userManager = userManager;
        _emailService = emailService;
    }


    private async Task TrySendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        try
        {
            await _emailService.SendAsync(toEmail, subject, htmlBody);
        }
        catch
        {
        }
    }

    //                               assign course to student                           //

    public async Task<ApiResponse<string>> AssignCourseAsync(AssignCourseRequest request, string currentUserId, bool isAdmin)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == request.CourseId);

        if (course == null)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Course not found."
            };
        }

        if (!course.IsActive)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "This course is disabled and cannot be assigned."
            };
        }

        if (!isAdmin && course.InstructorId != currentUserId)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "You can only assign your own courses."
            };
        }

        var student = await _userManager.FindByIdAsync(request.StudentId);

        if (student == null)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Student not found."
            };
        }

        var isStudent = await _userManager.IsInRoleAsync(student, "Student");

        if (!isStudent)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Courses can only be assigned to students."
            };
        }

        var existing = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.StudentId == request.StudentId && e.CourseId == request.CourseId);

        if (existing != null)
        {
            //          if the student already REQUESTED it, assigning = approving          //

            if (existing.Status == EnrollmentStatus.Pending)
            {
                existing.Status = EnrollmentStatus.Active;
                await _context.SaveChangesAsync();

                await TrySendEmailAsync(student.Email!,
                    "Enrollment approved: " + course.Title,
                    "<p>Hi " + student.FirstName + ",</p>" +
                    "<p>Your enrollment request for <b>" + course.Title + "</b> has been approved. " +
                    "The course is now in your <b>My Courses</b> section.</p>" +
                    "<p>Happy learning!<br/>LMS Team</p>");

                return new ApiResponse<string>
                {
                    Success = true,
                    Message = "Student had a pending request - it has been approved."
                };
            }

            return new ApiResponse<string>
            {
                Success = false,
                Message = "This student is already assigned to this course."
            };
        }

        var enrollment = new Enrollment
        {
            StudentId = request.StudentId,
            CourseId = request.CourseId,
            Status = EnrollmentStatus.Active,
            ProgressPercentage = 0
        };

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        //          SMTP notification: student got a new course          //

        await TrySendEmailAsync(student.Email!,
            "New course assigned: " + course.Title,
            "<p>Hi " + student.FirstName + ",</p>" +
            "<p>You have been enrolled in a new course: <b>" + course.Title + "</b>.</p>" +
            "<p>Login here 👉 pacelms.runasp.net to start learning</p>" +
            "<p>Happy learning!<br/>LMS Team</p>");

        return new ApiResponse<string>
        {
            Success = true,
            Message = "Course assigned successfully."
        };
    }

    //                               request enrollment (student)                               //

    public async Task<ApiResponse<string>> RequestEnrollmentAsync(string studentId, int courseId)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == courseId);

        if (course == null || !course.IsActive)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Course not found or is disabled."
            };
        }

        var existing = await _context.Enrollments
            .FirstOrDefaultAsync(e => e.StudentId == studentId && e.CourseId == courseId);

        if (existing != null)
        {
            var message = existing.Status == EnrollmentStatus.Pending ? "You have already requested to enroll in this course. Please wait for approval."
                : "You are already enrolled in this course.";

            return new ApiResponse<string> { Success = false, Message = message };
        }

        //          a request is just an enrollment row with Status = Pending          //

        var enrollment = new Enrollment
        {
            StudentId = studentId,
            CourseId = courseId,
            Status = EnrollmentStatus.Pending,
            ProgressPercentage = 0
        };

        _context.Enrollments.Add(enrollment);
        await _context.SaveChangesAsync();

        return new ApiResponse<string>
        {
            Success = true,
            Message = "Enrollment request sent. The instructor will review it."
        };
    }

    //                               get enrollment requests (instructor/admin)                               //

    public async Task<ApiResponse<List<EnrollmentRequestDto>>> GetEnrollmentRequestsAsync(string currentUserId, bool isAdmin)
    {
        var query = _context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .Where(e => e.Status == EnrollmentStatus.Pending);

        //          instructors only see requests for THEIR courses          //

        if (!isAdmin)
        {
            query = query.Where(e => e.Course.InstructorId == currentUserId);
        }

        var requests = await query
            .OrderBy(e => e.EnrolledAt)
            .Select(e => new EnrollmentRequestDto
            {
                EnrollmentId = e.EnrollmentId,
                StudentName = e.Student.FirstName + " " + e.Student.LastName,
                StudentEmail = e.Student.Email!,
                CourseTitle = e.Course.Title,
                RequestedOn = e.EnrolledAt
            })
            .ToListAsync();

        return new ApiResponse<List<EnrollmentRequestDto>>
        {
            Success = true,
            Message = "Requests loaded.",
            Data = requests
        };
    }

    //                               approve request                               //

    public async Task<ApiResponse<string>> ApproveRequestAsync(int enrollmentId, string currentUserId, bool isAdmin)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

        if (enrollment == null || enrollment.Status != EnrollmentStatus.Pending)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Request not found (it may already be handled)."
            };
        }

        if (!isAdmin && enrollment.Course.InstructorId != currentUserId)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "You can only approve requests for your own courses."
            };
        }

        //          flip Pending -> Active: course now shows in student's My Courses          //

        enrollment.Status = EnrollmentStatus.Active;
        await _context.SaveChangesAsync();

        //          SMTP notification: request approved          //

        await TrySendEmailAsync(enrollment.Student.Email!,
            "Enrollment approved: " + enrollment.Course.Title,
            "<p>Hi " + enrollment.Student.FirstName + ",</p>" +
            "<p>Your enrollment request for <b>" + enrollment.Course.Title + "</b> has been approved. " +
            "The course is now in your <b>My Courses</b> section.</p>" +
            "<p>Happy learning!<br/>LMS Team</p>");

        return new ApiResponse<string>
        {
            Success = true,
            Message = "Request approved. The student has been notified by email."
        };
    }

    //                               reject request                               //

    public async Task<ApiResponse<string>> RejectRequestAsync(int enrollmentId, string currentUserId, bool isAdmin)
    {
        var enrollment = await _context.Enrollments
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

        if (enrollment == null || enrollment.Status != EnrollmentStatus.Pending)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Request not found (it may already be handled)."
            };
        }

        if (!isAdmin && enrollment.Course.InstructorId != currentUserId)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "You can only reject requests for your own courses."
            };
        }

        //          reject = remove the pending row, student may request again later          //

        _context.Enrollments.Remove(enrollment);
        await _context.SaveChangesAsync();

        return new ApiResponse<string>
        {
            Success = true,
            Message = "Request rejected."
        };
    }

    //                               get my courses                               //

    public async Task<ApiResponse<List<MyCourseDto>>> GetMyCoursesAsync(string studentId)
    {
        //          only APPROVED enrollments in ACTIVE courses appear here          //

        var enrollments = await _context.Enrollments
            .Include(e => e.Course)
            .ThenInclude(c => c.Instructor)
            .Include(e => e.Course)
            .ThenInclude(c => c.Chapters)
            .ThenInclude(ch => ch.Contents)
            .Where(e => e.StudentId == studentId
                && e.Status != EnrollmentStatus.Pending
                && e.Course.IsActive)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync();

        //                               compute progress percent                               //

        var progressRows = await _context.ContentProgresses
    .Where(p => p.StudentId == studentId)
    .ToListAsync();

        var myCourses = new List<MyCourseDto>();

        foreach (var enrollment in enrollments)
        {
            var contentIds = enrollment.Course.Chapters
                .SelectMany(ch => ch.Contents)
                .Select(cc => cc.ChapterContentId)
                .ToList();


            double doneFraction = 0;

            foreach (var id in contentIds)
            {
                var row = progressRows.FirstOrDefault(p => p.ContentId == id);

                if (row == null) continue;

                if (row.CompletedOn != null)
                    doneFraction += 1;
                else if (row.DurationSeconds > 0)
                    doneFraction += Math.Min(1.0, (double)row.WatchedSeconds / row.DurationSeconds);
            }

            var progressPercentage = contentIds.Count == 0
                ? 0
                : (int)Math.Round(doneFraction * 100.0 / contentIds.Count);

            myCourses.Add(new MyCourseDto
            {
                CourseId = enrollment.Course.CourseId,
                Title = enrollment.Course.Title,
                ShortDescription = enrollment.Course.ShortDescription,
                ThumbnailUrl = enrollment.Course.ThumbnailUrl,
                InstructorName = enrollment.Course.Instructor.FirstName + " " + enrollment.Course.Instructor.LastName,
                Status = enrollment.Status.ToString(),
                ProgressPercentage = progressPercentage,
                ChapterCount = enrollment.Course.Chapters.Count
            });
        }

        return new ApiResponse<List<MyCourseDto>>
        {
            Success = true,
            Message = "My courses loaded.",
            Data = myCourses
        };
    }
    ///**********************************************************
    //                               get course enrollments                               //

    public async Task<ApiResponse<List<EnrolledStudentDto>>> GetCourseEnrollmentsAsync(int courseId, string currentUserId, bool isAdmin)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == courseId);

        if (course == null)
        {
            return new ApiResponse<List<EnrolledStudentDto>>
            {
                Success = false,
                Message = "Course not found."
            };
        }

        if (!isAdmin && course.InstructorId != currentUserId)
        {
            return new ApiResponse<List<EnrolledStudentDto>>
            {
                Success = false,
                Message = "You can only view enrollments for your own courses."
            };
        }


        var students = await _context.Enrollments
            .Where(e => e.CourseId == courseId && e.Status != EnrollmentStatus.Pending)
            .Join(_context.Users,
                e => e.StudentId,
                u => u.Id,
                (e, u) => new EnrolledStudentDto
                {
                    EnrollmentId = e.EnrollmentId,
                    StudentName = u.FirstName + " " + u.LastName,
                    Email = u.Email!,
                    ProgressPercentage = (int)Math.Round(e.ProgressPercentage)
                })
            .ToListAsync();

        return new ApiResponse<List<EnrolledStudentDto>>
        {
            Success = true,
            Message = "Enrollments llllloaded.",
            Data = students
        };
    }

    //                               unenroll student                               //

    public async Task<ApiResponse<string>> UnenrollAsync(int enrollmentId, string currentUserId, bool isAdmin)
    {
        var enrollment = await _context.Enrollments.FirstOrDefaultAsync(e => e.EnrollmentId == enrollmentId);

        if (enrollment == null)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Enrollment not found."
            };
        }

        var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == enrollment.CourseId);

        if (course == null || (!isAdmin && course.InstructorId != currentUserId))
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "You can only remove students from your own courses."
            };
        }

        _context.Enrollments.Remove(enrollment);
        await _context.SaveChangesAsync();

        return new ApiResponse<string>
        {
            Success = true,
            Message = "Student removed from course."
        };
    }
}