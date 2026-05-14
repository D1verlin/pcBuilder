using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PcBuilder.Domain.Entities;

namespace PcBuilder.Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext<IdentityUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<PcComponent> PcComponents { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<Build> Builds { get; set; } = null!;
        public DbSet<BenchmarkResult> BenchmarkResults { get; set; } = null!;
        public DbSet<BenchmarkScenario> BenchmarkScenarios { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<PcComponent>()
                .HasOne(c => c.Category)
                .WithMany(cat => cat.Components)
                .HasForeignKey(c => c.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<BenchmarkResult>()
                .HasOne(b => b.PcComponent)
                .WithMany(c => c.BenchmarkResults)
                .HasForeignKey(b => b.PcComponentId)
                .OnDelete(DeleteBehavior.Cascade);

            SeedInitialCategories(modelBuilder);
        }

        private static void SeedInitialCategories(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Category>().HasData(
                new Category { Id = 1, Name = "Процессор", Slug = "cpu" },
                new Category { Id = 2, Name = "Материнская плата", Slug = "motherboard" },
                new Category { Id = 3, Name = "Оперативная память", Slug = "ram" },
                new Category { Id = 4, Name = "Видеокарта", Slug = "gpu" },
                new Category { Id = 5, Name = "Накопитель", Slug = "storage" },
                new Category { Id = 6, Name = "Блок питания", Slug = "psu" }
            );
        }
    }
}
