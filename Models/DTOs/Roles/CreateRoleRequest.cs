using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Roles;

public class CreateRoleRequest
{
    [Required]
    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
}
