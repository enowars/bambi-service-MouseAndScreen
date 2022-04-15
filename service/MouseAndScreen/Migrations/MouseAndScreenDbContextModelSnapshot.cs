﻿// <auto-generated />
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using MouseAndScreen.Database;

#nullable disable

namespace MouseAndScreen.Migrations
{
    [DbContext(typeof(MouseAndScreenDbContext))]
    partial class MouseAndScreenDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder.HasAnnotation("ProductVersion", "6.0.3");

            modelBuilder.Entity("MouseAndScreen.Database.Models.Background", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<long>("OwnerId")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("OwnerId");

                    b.ToTable("Backgrounds");
                });

            modelBuilder.Entity("MouseAndScreen.Database.Models.PlacedSprite", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<long>("SessionId")
                        .HasColumnType("INTEGER");

                    b.Property<long>("SpriteId")
                        .HasColumnType("INTEGER");

                    b.Property<long>("X")
                        .HasColumnType("INTEGER");

                    b.Property<long>("Y")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("SessionId");

                    b.HasIndex("SpriteId");

                    b.ToTable("SpritePositions");
                });

            modelBuilder.Entity("MouseAndScreen.Database.Models.Session", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.HasIndex("Name");

                    b.ToTable("Sessions");
                });

            modelBuilder.Entity("MouseAndScreen.Database.Models.Sprite", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.Property<long>("OwnerId")
                        .HasColumnType("INTEGER");

                    b.HasKey("Id");

                    b.HasIndex("OwnerId");

                    b.ToTable("Sprites");
                });

            modelBuilder.Entity("MouseAndScreen.Database.Models.User", b =>
                {
                    b.Property<long>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("INTEGER");

                    b.Property<byte[]>("PasswordHash")
                        .IsRequired()
                        .HasColumnType("BLOB");

                    b.Property<string>("Username")
                        .IsRequired()
                        .HasColumnType("TEXT");

                    b.HasKey("Id");

                    b.HasIndex("Username")
                        .IsUnique();

                    b.ToTable("Users");
                });

            modelBuilder.Entity("MouseAndScreen.Database.Models.Background", b =>
                {
                    b.HasOne("MouseAndScreen.Database.Models.User", "Owner")
                        .WithMany()
                        .HasForeignKey("OwnerId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Owner");
                });

            modelBuilder.Entity("MouseAndScreen.Database.Models.PlacedSprite", b =>
                {
                    b.HasOne("MouseAndScreen.Database.Models.Session", "Session")
                        .WithMany("PlacedSprites")
                        .HasForeignKey("SessionId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("MouseAndScreen.Database.Models.Sprite", "Sprite")
                        .WithMany()
                        .HasForeignKey("SpriteId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Session");

                    b.Navigation("Sprite");
                });

            modelBuilder.Entity("MouseAndScreen.Database.Models.Sprite", b =>
                {
                    b.HasOne("MouseAndScreen.Database.Models.User", "Owner")
                        .WithMany()
                        .HasForeignKey("OwnerId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Owner");
                });

            modelBuilder.Entity("MouseAndScreen.Database.Models.Session", b =>
                {
                    b.Navigation("PlacedSprites");
                });
#pragma warning restore 612, 618
        }
    }
}
