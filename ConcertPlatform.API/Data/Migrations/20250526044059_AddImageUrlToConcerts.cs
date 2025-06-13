﻿using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConcertPlatform.API.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrlToConcerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Concerts",
                type: "TEXT",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Concerts");
        }
    }
}
