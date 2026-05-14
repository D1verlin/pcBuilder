using PcBuilder.Domain.Entities;

namespace PcBuilder.Domain.Interfaces
{
    public interface ICategoryRepository : IRepository<Category>
    {
        Task<Category?> GetBySlugAsync(string slug);
        Task<IReadOnlyList<Category>> GetAllOrderedAsync();
    }
}
