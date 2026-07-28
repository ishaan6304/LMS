using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LMS.Migrations
{
    /// <inheritdoc />
    public partial class ProgressCalc : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            //          CompletedOn becomes nullable: null = not completed yet          //

            migrationBuilder.AlterColumn<DateTime>(
                name: "CompletedOn",
                table: "ContentProgresses",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            //          new columns for the watch-time tracker          //

            migrationBuilder.AddColumn<int>(
                name: "DurationSeconds",
                table: "ContentProgresses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WatchedSeconds",
                table: "ContentProgresses",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DurationSeconds",
                table: "ContentProgresses");

            migrationBuilder.DropColumn(
                name: "WatchedSeconds",
                table: "ContentProgresses");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CompletedOn",
                table: "ContentProgresses",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);
        }
    }
}