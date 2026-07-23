using LMS.Models.Common;
using LMS.Models.DTOs.Categories;

namespace LMS.Services.Interfaces;

public interface ICategoryService
{
    Task<ApiResponse<List<CategoryDto>>> GetAllAsync();

    Task<ApiResponse<string>> CreateAsync(CreateCategoryRequest request);
}
