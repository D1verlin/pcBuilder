using Microsoft.Extensions.DependencyInjection;
using PcBuilder.Application.Interfaces;
using PcBuilder.Application.Services;

namespace PcBuilder.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            services.AddScoped<IComponentService, ComponentService>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<IBuildService, BuildService>();
            services.AddScoped<IBenchmarkService, BenchmarkService>();
            services.AddScoped<IBenchmarkScenarioService, BenchmarkScenarioService>();
            services.AddScoped<IAdminBuildService, AdminBuildService>();

            return services;
        }
    }
}
