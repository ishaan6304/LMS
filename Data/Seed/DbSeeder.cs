using LMS.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LMS.Data.Seed;

public static class DbSeeder
{
    public static async Task SeedRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        string[] roles =
        {
            "Admin",
            "Instructor",
            "Student"
        };

        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }
    }

    public static async Task SeedAdminAsync(UserManager<ApplicationUser> userManager)
    {
        const string email = "admin@lms.com";

        var admin = await userManager.FindByEmailAsync(email);

        if (admin != null)
            return;

        admin = new ApplicationUser
        {
            FirstName = "System",
            LastName = "Administrator",
            UserName = email,
            Email = email,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(admin, "Password@123");

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, "Admin");
        }
    }

    //                               seed default categories                               //

    public static async Task SeedCategoriesAsync(ApplicationDbContext context)
    {
        //          only seed once - if any category exists, do nothing          //

        if (await context.Categories.AnyAsync())
            return;

        string[] names =
        {
            "Programming",
            "AI",
            "Database",
            "Cloud",
            "DevOps"
        };

        foreach (var name in names)
        {
            context.Categories.Add(new Category { Name = name });
        }

        await context.SaveChangesAsync();
    }
}
