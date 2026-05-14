using PcBuilder.Application.Interfaces;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;

namespace PcBuilder.Application.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _categoryRepository;

        public CategoryService(ICategoryRepository categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        public async Task<IReadOnlyList<Category>> GetAllCategoriesAsync()
        {
            return await _categoryRepository.GetAllOrderedAsync();
        }

        public async Task<Category> CreateCategoryAsync(Category category)
        {
            category.Id = 0;
            return await _categoryRepository.AddAsync(category);
        }

        public async Task UpdateCategoryAsync(Category category)
        {
            await _categoryRepository.UpdateAsync(category);
        }

        public async Task DeleteCategoryAsync(int id)
        {
            var category = await _categoryRepository.GetByIdAsync(id);
            if (category != null)
                await _categoryRepository.DeleteAsync(category);
        }
    }
}
