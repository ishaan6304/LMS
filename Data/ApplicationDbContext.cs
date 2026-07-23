using LMS.Models.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LMS.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }


    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<Course> Courses => Set<Course>();

    public DbSet<ChapterContent> ChapterContents => Set<ChapterContent>();

    public DbSet<ContentProgress> ContentProgresses { get; set; }
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    public DbSet<CourseQuestion> CourseQuestions => Set<CourseQuestion>();

    public DbSet<Category> Categories => Set<Category>();



    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Course>()
            .Property(c => c.Price)
            .HasPrecision(18, 2);

        builder.Entity<Course>()
        .HasOne(c => c.Instructor)
        .WithMany(u => u.Courses)
        .HasForeignKey(c => c.InstructorId)
        .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Enrollment>()
            .HasOne(e => e.Student)
            .WithMany(u => u.Enrollments)
            .HasForeignKey(e => e.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Enrollment>()
            .HasOne(e => e.Course)
            .WithMany(c => c.Enrollments)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Course>()
            .Property(c => c.IsActive)
            .HasDefaultValue(true);

        builder.Entity<CourseQuestion>()
            .HasOne(q => q.Course)
            .WithMany()
            .HasForeignKey(q => q.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<CourseQuestion>()
            .HasOne(q => q.Chapter)
            .WithMany()
            .HasForeignKey(q => q.ChapterId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<CourseQuestion>()
            .HasOne(q => q.Student)
            .WithMany()
            .HasForeignKey(q => q.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Category>()
            .HasIndex(c => c.Name)
            .IsUnique();
    }
}
