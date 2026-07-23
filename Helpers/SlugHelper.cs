namespace LMS.Helpers;

public static class SlugHelper
{
   
    public static string GenerateSlug(string title)
    {
        var lowered = title.ToLower().Trim().Replace(" ", "-");

        var allowed = "abcdefghijklmnopqrstuvwxyz0123456789-";

        var slug = "";

        foreach (var character in lowered)
        {
            if (allowed.Contains(character))
            {
                slug = slug + character;
            }
        }

        return slug;
    }
}
