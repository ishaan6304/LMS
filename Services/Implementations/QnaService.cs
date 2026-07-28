using LMS.Data;
using LMS.Models.Common;
using LMS.Models.DTOs.Qna;
using LMS.Models.Entities;
using LMS.Models.Enums;
using LMS.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LMS.Services.Implementations;

public class QnaService : IQnaService
{
    private readonly ApplicationDbContext _context;

    public QnaService(ApplicationDbContext context)
    {
        _context = context;
    }

    //                               ask question (student)                               //

    public async Task<ApiResponse<string>> AskQuestionAsync(string studentId, AskQuestionRequest request)
    {
        var course = await _context.Courses.FirstOrDefaultAsync(c => c.CourseId == request.CourseId);

        if (course == null || !course.IsActive)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Course not found or is disabled."
            };
        }

        //          only ENROLLED students can ask - auditors cannot          //

        var isEnrolled = await _context.Enrollments.AnyAsync(e =>
            e.StudentId == studentId &&
            e.CourseId == request.CourseId &&
            e.Status != EnrollmentStatus.Pending);

        if (!isEnrolled)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "You can only ask questions in courses you are enrolled in."
            };
        }

        //          if a chapter was picked, it must belong to this course          //

        if (request.ChapterId.HasValue)
        {
            var chapterBelongsToCourse = await _context.Chapters.AnyAsync(ch =>
                ch.ChapterId == request.ChapterId.Value &&
                ch.CourseId == request.CourseId);

            if (!chapterBelongsToCourse)
            {
                return new ApiResponse<string>
                {
                    Success = false,
                    Message = "That chapter does not belong to the selected course."
                };
            }
        }

        var question = new CourseQuestion
        {
            CourseId = request.CourseId,
            ChapterId = request.ChapterId,
            StudentId = studentId,
            QuestionText = request.QuestionText,
            AskedAt = DateTime.UtcNow
        };

        _context.CourseQuestions.Add(question);
        await _context.SaveChangesAsync();
        return new ApiResponse<string>
        {
            Success = true,
            Message = "Question sent. The instructor will reply soon."
        };
    }

    //                               my questions (student history)                               //

    public async Task<ApiResponse<List<QuestionDto>>> GetMyQuestionsAsync(string studentId)
    {
        var questions = await _context.CourseQuestions
            .Where(q => q.StudentId == studentId)
            .OrderByDescending(q => q.AskedAt)
            .Select(q => new QuestionDto
            {
                QuestionId = q.CourseQuestionId,
                CourseId = q.CourseId,
                CourseTitle = q.Course.Title,
                ChapterTitle = q.Chapter != null ? q.Chapter.Title : null,
                StudentName = q.Student.FirstName + " " + q.Student.LastName,
                QuestionText = q.QuestionText,
                AnswerText = q.AnswerText,
                AskedAt = q.AskedAt,
                AnsweredAt = q.AnsweredAt
            })
            .ToListAsync();

        return new ApiResponse<List<QuestionDto>>
        {
            Success = true,
            Message = "Questions loaded.",
            Data = questions
        };
    }

    //                               received questions (instructor/admin)                               //

    public async Task<ApiResponse<List<QuestionDto>>> GetReceivedQuestionsAsync(string currentUserId, bool isAdmin)
    {
        var query = _context.CourseQuestions.AsQueryable();

        //          instructors only see questions on THEIR courses          //

        if (!isAdmin)
        {
            query = query.Where(q => q.Course.InstructorId == currentUserId);
        }

        var questions = await query
            .OrderBy(q => q.AnsweredAt != null)   // unanswered first
            .ThenByDescending(q => q.AskedAt)     // then newest first
            .Select(q => new QuestionDto
            {
                QuestionId = q.CourseQuestionId,
                CourseId = q.CourseId,
                CourseTitle = q.Course.Title,
                ChapterTitle = q.Chapter != null ? q.Chapter.Title : null,
                StudentName = q.Student.FirstName + " " + q.Student.LastName,
                QuestionText = q.QuestionText,
                AnswerText = q.AnswerText,
                AskedAt = q.AskedAt,
                AnsweredAt = q.AnsweredAt
            })
            .ToListAsync();

        return new ApiResponse<List<QuestionDto>>
        {
            Success = true,
            Message = "Questions loaded.",
            Data = questions
        };
    }

    //                               answer question (instructor/admin)                               //

    public async Task<ApiResponse<string>> AnswerQuestionAsync(int questionId, string currentUserId, bool isAdmin, AnswerQuestionRequest request)
    {
        var question = await _context.CourseQuestions
            .Include(q => q.Course)
            .FirstOrDefaultAsync(q => q.CourseQuestionId == questionId);

        if (question == null)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Question not found."
            };
        }

        if (!isAdmin && question.Course.InstructorId != currentUserId)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "You can only answer questions on your own courses."
            };
        }

        //          replying again simply updates the existing answer          //

        question.AnswerText = request.AnswerText;
        question.AnsweredAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return new ApiResponse<string>
        {
            Success = true,
            Message = "Reply sent. The student can now see your answer."
        };
    }
}
