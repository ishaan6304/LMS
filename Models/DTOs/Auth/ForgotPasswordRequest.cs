using System.ComponentModel.DataAnnotations;

namespace LMS.Models.DTOs.Auth
{
    public class ForgotPasswordRequest
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;
    }

}
