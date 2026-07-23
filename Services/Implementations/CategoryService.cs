using LMS.Data;
using LMS.Models.Common;
using LMS.Models.DTOs.Categories;
using LMS.Models.Entities;
using LMS.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace LMS.Services.Implementations;

public class CategoryService : ICategoryService
{
    private readonly ApplicationDbContext _context;

    public CategoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    //                               list categories                               //

    public async Task<ApiResponse<List<CategoryDto>>> GetAllAsync()
    {
        var categories = await _context.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto
            {
                CategoryId = c.CategoryId,
                Name = c.Name
            })
            .ToListAsync();

        return new ApiResponse<List<CategoryDto>>
        {
            Success = true,
            Message = "Categories loaded.",
            Data = categories
        };
    }

    //                               create category (admin)                               //

    public async Task<ApiResponse<string>> CreateAsync(CreateCategoryRequest request)
    {
        var name = request.Name.Trim();

        if (name == "")
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "Category name cannot be empty."
            };
        }

        //          no duplicates (case-insensitive check)          //

        var alreadyExists = await _context.Categories.AnyAsync(c => c.Name.ToLower() == name.ToLower());

        if (alreadyExists)
        {
            return new ApiResponse<string>
            {
                Success = false,
                Message = "This category already exists."
            };
        }

        _context.Categories.Add(new Category { Name = name });
        await _context.SaveChangesAsync();

        return new ApiResponse<string>
        {
            Success = true,
            Message = "Category '" + name + "' created."
        };
    }
}
