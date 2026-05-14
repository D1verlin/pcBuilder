using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PcBuilder.Domain.Interfaces;
using PcBuilder.Infrastructure.Data;
using PcBuilder.Infrastructure.Repositories;
using PcBuilder.Infrastructure.Services;

namespace PcBuilder.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                var connectionString = configuration.GetConnectionString("DefaultConnection")
                    ?? "Data Source=pcbuilder.db";
                options.UseSqlite(connectionString);
                options.ConfigureWarnings(w =>
                    w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
            });

            services.AddScoped<IPcComponentRepository, PcComponentRepository>();
            services.AddScoped<ICategoryRepository, CategoryRepository>();
            services.AddScoped<IBuildRepository, BuildRepository>();
            services.AddScoped<IBenchmarkRepository, BenchmarkRepository>();
            services.AddScoped<IBenchmarkScenarioRepository, BenchmarkScenarioRepository>();

            services.AddScoped<SeedDataService>();

            return services;
        }

        public static void ApplyMigrations(this IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            dbContext.Database.Migrate();
        }
    }
}
