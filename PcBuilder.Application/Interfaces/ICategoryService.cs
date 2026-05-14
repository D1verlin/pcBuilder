using PcBuilder.Application.DTOs;
using PcBuilder.Domain.Entities;

namespace PcBuilder.Application.Interfaces
{
    public interface ICategoryService
    {
        Task<IReadOnlyList<Category>> GetAllCategoriesAsync();
        Task<Category> CreateCategoryAsync(Category category);
        Task UpdateCategoryAsync(Category category);
        Task DeleteCategoryAsync(int id);
    }
}
