using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Categories;

public class CreateCategoryRequest
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
}
