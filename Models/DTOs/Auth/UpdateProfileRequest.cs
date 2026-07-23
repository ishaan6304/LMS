using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Auth;

public class UpdateProfileRequest
{
    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;
}