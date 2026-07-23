using LMS.Models;

namespace LMS.Models.Entities;

//          master list of course categories - admin can add new ones          //

public class Category : BaseEntity
{
    public int CategoryId { get; set; }

    public string Name { get; set; } = string.Empty;
}
