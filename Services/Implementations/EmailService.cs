using System.Net;
using System.Net.Mail;
using LMS.Services.Interfaces;

namespace LMS.Services.Implementations;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        var host = _config["Smtp:Host"];
        var port = int.Parse(_config["Smtp:Port"]!);
        var user = _config["Smtp:User"];
        var password = _config["Smtp:Password"];

        var message = new MailMessage
        {
            From = new MailAddress(user!, _config["Smtp:FromName"]),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        message.To.Add(toEmail);

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(user, password),
            EnableSsl = true
        };

        await client.SendMailAsync(message);
    }
}