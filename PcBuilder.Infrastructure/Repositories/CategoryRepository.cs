using Microsoft.EntityFrameworkCore;
using PcBuilder.Domain.Entities;
using PcBuilder.Domain.Interfaces;
using PcBuilder.Infrastructure.Data;

namespace PcBuilder.Infrastructure.Repositories
{
    public class CategoryRepository : BaseRepository<Category>, ICategoryRepository
    {
        public CategoryRepository(ApplicationDbContext context) : base(context) { }

        public async Task<Category?> GetBySlugAsync(string slug)
        {
            return await Context.Categories.FirstOrDefaultAsync(c => c.Slug == slug);
        }

        public async Task<IReadOnlyList<Category>> GetAllOrderedAsync()
        {
            return await Context.Categories.OrderBy(c => c.Id).ToListAsync();
        }
    }
}
